export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe, STRIPE_PRICE_MAP } from '@/lib/stripe';
import type { PlanId } from '@/lib/types';

export async function POST(req: NextRequest) {
  let planId: PlanId | undefined;
  try {
    ({ planId } = (await req.json()) as { planId: PlanId });

    const priceId = STRIPE_PRICE_MAP[planId];

    if (!priceId) {
      console.error('[BILLING_CHECKOUT_ERROR]', {
        planId,
        hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
        hasPriceId: false,
        stripeError: `Missing Stripe price ID for plan: ${planId}`,
      });
      return NextResponse.json(
        { error: `Missing Stripe price ID for plan: ${planId}` },
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

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price:    priceId,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { workspaceId: ctx.workspaceId, planId },
      },
      success_url: `${origin}/settings?billing=success`,
      cancel_url:  `${origin}/settings?billing=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[BILLING_CHECKOUT_ERROR]', {
      planId,
      hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
      hasPriceId: Boolean(planId && STRIPE_PRICE_MAP[planId]),
      stripeError: error.message,
    });
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
  }
}
