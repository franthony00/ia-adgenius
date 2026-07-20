import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, planFromPriceId, mapStripeStatus } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { sendWorkspaceEmail } from '@/lib/email';
import {
  billingWelcome,
  billingTrialEnding,
  billingPaymentFailed,
  billingCancelled,
} from '@/lib/email-templates';

export const runtime = 'nodejs';

async function upsertSubscription(sub: Stripe.Subscription) {
  const workspaceId = sub.metadata?.workspaceId;
  if (!workspaceId) return;

  const item    = sub.items.data[0];
  const priceId = item?.price?.id ?? null;
  const planId  = (priceId ? planFromPriceId(priceId) : null) ?? 'pro';

  // In Stripe API 2026-06-24.dahlia, period dates live on SubscriptionItem
  const periodStart = item?.current_period_start ?? Math.floor(Date.now() / 1000);
  const periodEnd   = item?.current_period_end   ?? Math.floor(Date.now() / 1000) + 2592000;

  await prisma.subscription.upsert({
    where:  { workspaceId },
    create: {
      workspaceId,
      planId,
      status:               mapStripeStatus(sub.status),
      currentPeriodStart:   new Date(periodStart * 1000),
      currentPeriodEnd:     new Date(periodEnd   * 1000),
      cancelAtPeriodEnd:    sub.cancel_at_period_end,
      stripeSubscriptionId: sub.id,
      stripePriceId:        priceId,
    },
    update: {
      planId,
      status:               mapStripeStatus(sub.status),
      currentPeriodStart:   new Date(periodStart * 1000),
      currentPeriodEnd:     new Date(periodEnd   * 1000),
      cancelAtPeriodEnd:    sub.cancel_at_period_end,
      stripeSubscriptionId: sub.id,
      stripePriceId:        priceId,
    },
  });
}

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('[webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
          // Attach workspaceId from session metadata to subscription metadata if missing
          if (!sub.metadata?.workspaceId && session.metadata?.workspaceId) {
            await getStripe().subscriptions.update(sub.id, {
              metadata: { workspaceId: session.metadata.workspaceId },
            });
            sub.metadata = { ...sub.metadata, workspaceId: session.metadata.workspaceId };
          }
          await upsertSubscription(sub);
          const workspaceId = sub.metadata?.workspaceId;
          if (workspaceId) {
            const item    = sub.items.data[0];
            const priceId = item?.price?.id ?? null;
            const planId  = (priceId ? planFromPriceId(priceId) : null) ?? 'pro';
            const planName = planId.charAt(0).toUpperCase() + planId.slice(1);
            sendWorkspaceEmail(workspaceId, 'billing_welcome', billingWelcome(planName));
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        const workspaceId = sub.metadata?.workspaceId;
        if (workspaceId) {
          const trialEnd   = sub.trial_end ?? 0;
          const daysLeft   = Math.max(1, Math.ceil((trialEnd * 1000 - Date.now()) / 86_400_000));
          const item       = sub.items.data[0];
          const priceId    = item?.price?.id ?? null;
          const planId     = (priceId ? planFromPriceId(priceId) : null) ?? 'pro';
          const planName   = planId.charAt(0).toUpperCase() + planId.slice(1);
          sendWorkspaceEmail(workspaceId, 'billing_trial_ending', billingTrialEnding(planName, daysLeft));
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = sub.metadata?.workspaceId;
        if (workspaceId) {
          await prisma.subscription.updateMany({
            where: { workspaceId },
            data:  { status: 'cancelled', cancelAtPeriodEnd: false },
          });
          const item     = sub.items.data[0];
          const priceId  = item?.price?.id ?? null;
          const planId   = (priceId ? planFromPriceId(priceId) : null) ?? 'pro';
          const planName = planId.charAt(0).toUpperCase() + planId.slice(1);
          sendWorkspaceEmail(workspaceId, 'billing_cancelled', billingCancelled(planName));
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // In API 2026-06-24.dahlia, subscription is nested under parent.subscription_details
        const subDetails = invoice.parent?.type === 'subscription_details'
          ? invoice.parent.subscription_details
          : null;
        const subId = subDetails?.subscription
          ? (typeof subDetails.subscription === 'string'
              ? subDetails.subscription
              : subDetails.subscription.id)
          : null;
        if (subId) {
          const sub = await prisma.subscription.findUnique({
            where:  { stripeSubscriptionId: subId },
            select: { workspaceId: true, planId: true },
          });
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subId },
            data:  { status: 'past_due' },
          });
          if (sub) {
            const planName = sub.planId.charAt(0).toUpperCase() + sub.planId.slice(1);
            sendWorkspaceEmail(sub.workspaceId, 'billing_payment_failed', billingPaymentFailed(planName));
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[webhook] handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: '/api/billing/webhook',
    message: 'Stripe webhook endpoint is available. Use POST for Stripe events.',
  });
}
