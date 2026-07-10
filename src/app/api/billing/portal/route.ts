export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  try {
    const ctx = await getAuthContext();
    if (ctx.isDemo) {
      return NextResponse.json({ error: 'Sign in to manage billing.' }, { status: 401 });
    }

    const workspace = await prisma.workspace.findUnique({
      where:  { id: ctx.workspaceId },
      select: { stripeCustomerId: true },
    });

    if (!workspace?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await getStripe().billingPortal.sessions.create({
      customer:   workspace.stripeCustomerId,
      return_url: appUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[billing/portal]', err);
    return NextResponse.json({ error: 'Failed to open billing portal.' }, { status: 500 });
  }
}
