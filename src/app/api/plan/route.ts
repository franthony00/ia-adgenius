export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { getFeatureMap, getVariationLimit } from '@/lib/plan-gates';

// ─── GET /api/plan ─────────────────────────────────────────────────────────────
// Returns the current user's active plan and feature flags.
// Used by the usePlan() hook on the client.

export async function GET() {
  const { planId } = await getAuthContext();

  return NextResponse.json({
    planId,
    variationLimit: getVariationLimit(planId),
    features:       getFeatureMap(planId),
  });
}
