import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe, STRIPE_PRICE_MAP } from '@/lib/stripe';
import type { PlanId } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { planId } = (await req.json()) as { planId: PlanId };

    if (!STRIPE_PRICE_MAP[planId]) {
      return NextResponse.json(
        { error: 'Plan not available for online checkout. Please contact sales.' },
        { status: 400 },
      );
    }

    const ctx = await getAuthContext();
    if (ctx.isDemo) {
      return NextResponse.json({ error: 'Sign in to upgrade your plan.' }, { status: 401 });
    }

    // Get or create Stripe customer
    const workspace = await prisma.workspace.findUnique({
      where:  { id: ctx.workspaceId },
      select: { id: true, name: true, stripeCustomerId: true },
    });

    let customerId = workspace?.stripeCustomerId;

    if (!customerId) {
      const user = await prisma.user.findUnique({
        where:  { id: ctx.userId },
        select: { email: true, name: true },
      });
      const customer = await getStripe().customers.create({
        email:    user?.email,
        name:     user?.name ?? workspace?.name,
        metadata: { workspaceId: ctx.workspaceId },
      });
      customerId = customer.id;
      await prisma.workspace.update({
        where: { id: ctx.workspaceId },
        data:  { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price:    STRIPE_PRICE_MAP[planId]!,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { workspaceId: ctx.workspaceId, planId },
      },
      success_url: `${appUrl}/?billing=success`,
      cancel_url:  `${appUrl}/?billing=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[billing/checkout]', err);
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
  }
}
