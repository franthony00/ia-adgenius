import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './db';
import type { PlanId } from './types';

export const DEMO_USER_ID      = 'demo-user';
export const DEMO_WORKSPACE_ID = 'demo-workspace';

/** Emails that bypass all plan gates and get enterprise-level access. */
export const ADMIN_EMAILS = ['franthonysanchez77@gmail.com'];

export interface AuthContext {
  userId: string;
  workspaceId: string;
  isDemo: boolean;
  /** Active subscription plan. Demo mode and new workspaces default to 'pro'. */
  planId: PlanId;
  /** True for admin emails — bypasses all plan gates. */
  isAdmin: boolean;
}

/**
 * Returns the current user's DB ids and active plan.
 *
 * - If Clerk is not configured → demo mode (no sign-in required), planId 'pro'.
 * - If user is signed in       → upserts User + Workspace on first visit.
 * - If Clerk fails unexpectedly → falls back to demo mode.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const demo: AuthContext = {
    userId: DEMO_USER_ID, workspaceId: DEMO_WORKSPACE_ID, isDemo: true, planId: 'pro', isAdmin: false,
  };

  // No Clerk keys → demo mode
  if (!process.env.CLERK_SECRET_KEY) return demo;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return demo;

    const clerkUser = await currentUser();
    const email     = clerkUser?.emailAddresses[0]?.emailAddress ?? `${clerkId}@noreply.clerk`;
    const name      = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ')
                      || email.split('@')[0];
    const avatarUrl = clerkUser?.imageUrl ?? null;

    // ── Admin check happens FIRST, before any DB call ──────────────────────
    // This guarantees enterprise access even if the DB is temporarily unavailable.
    const isAdmin = ADMIN_EMAILS.includes(email);

    // ── DB operations (non-blocking for admins if they fail) ───────────────
    try {
      // Upsert user — Clerk userId is stored as the primary key
      await prisma.user.upsert({
        where:  { id: clerkId },
        create: { id: clerkId, email, name, avatarUrl },
        update: { name, avatarUrl },
      });

      // Find existing workspace membership
      const membership = await prisma.workspaceMember.findFirst({
        where:  { userId: clerkId },
        select: { workspaceId: true },
      });

      if (membership) {
        const wsId = membership.workspaceId;
        const sub  = await prisma.subscription.findUnique({
          where:  { workspaceId: wsId },
          select: { planId: true },
        });
        const planId: PlanId = isAdmin ? 'enterprise' : (sub?.planId ?? 'pro') as PlanId;
        return { userId: clerkId, workspaceId: wsId, isDemo: false, planId, isAdmin };
      }

      // First login: create a default workspace automatically
      const slug      = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
      const workspace = await prisma.workspace.create({
        data: {
          name:    `${name}'s Workspace`,
          slug,
          members: { create: { userId: clerkId, role: 'owner' } },
        },
      });

      return { userId: clerkId, workspaceId: workspace.id, isDemo: false, planId: isAdmin ? 'enterprise' : 'pro', isAdmin };

    } catch (dbErr) {
      console.error('[getAuthContext] DB error:', dbErr);
      // If DB fails but user is authenticated, return best-effort context.
      // Admins always get enterprise; regular users get pro (generous fallback).
      return {
        userId:      clerkId,
        workspaceId: DEMO_WORKSPACE_ID,
        isDemo:      false,
        planId:      isAdmin ? 'enterprise' : 'pro',
        isAdmin,
      };
    }
  } catch (err) {
    console.error('[getAuthContext] Clerk error:', err);
    return demo;
  }
}
