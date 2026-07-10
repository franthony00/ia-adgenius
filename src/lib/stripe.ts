import Stripe from 'stripe';
import type { PlanId } from './types';

// Lazy singleton — avoids build-time crash when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured.');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-06-24.dahlia',
    });
  }
  return _stripe;
}

/** Map planId → Stripe price ID (set in env vars after creating products in Stripe) */
export const STRIPE_PRICE_MAP: Partial<Record<PlanId, string>> = {
  starter:     process.env.STRIPE_PRICE_STARTER     ?? '',
  pro:         process.env.STRIPE_PRICE_PRO          ?? '',
  performance: process.env.STRIPE_PRICE_PERFORMANCE  ?? '',
  agency:      process.env.STRIPE_PRICE_AGENCY       ?? '',
};

/** Map Stripe price ID → planId (reverse lookup for webhooks) */
export function planFromPriceId(priceId: string): PlanId | null {
  for (const [plan, pid] of Object.entries(STRIPE_PRICE_MAP)) {
    if (pid && pid === priceId) return plan as PlanId;
  }
  return null;
}

/** Map Stripe subscription status → our SubscriptionStatus */
export function mapStripeStatus(
  status: Stripe.Subscription['status'],
): 'active' | 'trialing' | 'past_due' | 'cancelled' {
  switch (status) {
    case 'active':    return 'active';
    case 'trialing':  return 'trialing';
    case 'past_due':  return 'past_due';
    default:          return 'cancelled';
  }
}
