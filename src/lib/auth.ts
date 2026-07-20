import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './db';
import type { PlanId } from './types';

export const DEMO_USER_ID      = 'demo-user';
export const DEMO_WORKSPACE_ID = 'demo-workspace';

/** Emails that bypass all plan gates and get enterprise-level access. */
export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

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
 * Ensures the user has a Workspace and WorkspaceMember record.
 *
 * Three scenarios handled:
 *   1. No membership → creates Workspace + WorkspaceMember with role owner.
 *   2. Membership exists but role is not owner and user is admin → updates to owner.
 *   3. Membership exists and role is correct → returns existing workspaceId.
 *
 * Receives dbUserId (the actual User.id from Neon) so FK constraints are
 * always satisfied regardless of whether User.id is a Clerk ID or a legacy CUID.
 */
async function ensureUserWorkspace(
  dbUserId: string,
  name:     string,
  isAdmin:  boolean,
): Promise<string> {
  const membership = await prisma.workspaceMember.findFirst({
    where:  { userId: dbUserId },
    select: { id: true, workspaceId: true, role: true },
  });

  if (membership) {
    // Admin must always be owner — fix if role drifted
    if (isAdmin && membership.role !== 'owner') {
      await prisma.workspaceMember.update({
        where: { id: membership.id },
        data:  { role: 'owner' },
      });
    }
    return membership.workspaceId;
  }

  // No workspace — create one and add member as owner
  const slug      = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
  const workspace = await prisma.workspace.create({
    data: {
      name:    `${name}'s Workspace`,
      slug,
      members: { create: { userId: dbUserId, role: 'owner' } },
    },
  });
  return workspace.id;
}

/**
 * Returns the current user's DB ids and active plan.
 *
 * - If Clerk is not configured → demo mode (no sign-in required), planId 'pro'.
 * - If user is signed in       → syncs User → Workspace → WorkspaceMember on every call.
 * - If Clerk fails unexpectedly → falls back to demo mode.
 *
 * User lookup uses email as the upsert key so records that were created with a
 * CUID primary key are found correctly without triggering the email unique constraint.
 * New users are always created with User.id = Clerk userId.
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
    // Guarantees enterprise access even if the DB is temporarily unavailable.
    const isAdmin = ADMIN_EMAILS.includes(email);

    // ── DB sync ────────────────────────────────────────────────────────────
    try {
      // Upsert by email — handles both cases:
      //   • New users:    creates User with id = Clerk userId
      //   • Legacy users: finds existing record (id may be a CUID) and updates name/avatar
      // Avoids UniqueConstraintViolation when the user already exists with a
      // non-Clerk primary key, which previously caused workspace creation to fail silently.
      const dbUser = await prisma.user.upsert({
        where:  { email },
        create: { id: clerkId, email, name, avatarUrl },
        update: { name, avatarUrl },
      });

      // Ensure Workspace + WorkspaceMember exist; fix role for admin if needed
      const workspaceId = await ensureUserWorkspace(dbUser.id, name, isAdmin);

      const sub = await prisma.subscription.findUnique({
        where:  { workspaceId },
        select: { planId: true },
      });
      const planId: PlanId = isAdmin ? 'enterprise' : (sub?.planId ?? 'pro') as PlanId;

      return { userId: clerkId, workspaceId, isDemo: false, planId, isAdmin };

    } catch (dbErr) {
      console.error('[getAuthContext] DB error:', dbErr);
      // Admins always get enterprise; regular users get pro as a generous fallback.
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
