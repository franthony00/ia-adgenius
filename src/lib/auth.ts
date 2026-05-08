import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './db';

export const DEMO_USER_ID      = 'demo-user';
export const DEMO_WORKSPACE_ID = 'demo-workspace';

export interface AuthContext {
  userId: string;
  workspaceId: string;
  isDemo: boolean;
}

/**
 * Returns the current user's DB ids.
 *
 * - If Clerk is not configured → demo mode (no sign-in required).
 * - If user is signed in       → upserts User + Workspace on first visit.
 * - If Clerk fails unexpectedly → falls back to demo mode.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const demo: AuthContext = { userId: DEMO_USER_ID, workspaceId: DEMO_WORKSPACE_ID, isDemo: true };

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
      return { userId: clerkId, workspaceId: membership.workspaceId, isDemo: false };
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

    return { userId: clerkId, workspaceId: workspace.id, isDemo: false };
  } catch (err) {
    console.error('[getAuthContext]', err);
    return demo;
  }
}
