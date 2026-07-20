export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';

export async function GET() {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) return NextResponse.json({ hasOnboarded: false });

  const brandKit = await prisma.brandKit.findUnique({
    where: { workspaceId: authCtx.workspaceId },
    select: { id: true },
  });

  return NextResponse.json({ hasOnboarded: !!brandKit });
}
