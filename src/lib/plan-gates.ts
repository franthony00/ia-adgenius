/**
 * Plan feature-gating — pure logic, no I/O.
 * Safe to import from both server (API routes) and client (React hooks).
 */
import type { PlanId } from './types';

// ─── Tier order ───────────────────────────────────────────────────────────────
export const PLAN_ORDER: PlanId[] = [
  'starter', 'pro', 'performance', 'agency', 'enterprise',
];

/** True if `planId` is at least as high as `minimum`. */
export function planAtLeast(planId: PlanId, minimum: PlanId): boolean {
  return PLAN_ORDER.indexOf(planId) >= PLAN_ORDER.indexOf(minimum);
}

// ─── Feature keys ─────────────────────────────────────────────────────────────
export type FeatureKey =
  | 'analyses'            // pro+  — AI ad analysis
  | 'ab_variations'       // pro+  — A/B variation generation
  | 'variations_save'     // pro+  — persist variations to DB
  | 'advanced_projections'// pro+  — detailed CTR/CPC/ROAS projections
  | 'history'             // pro+  — campaign history tab
  | 'export'              // pro+  — export ads
  | 'multi_workspace'     // pro+  — up to 3 workspaces
  | 'meta_connect'        // performance+ — Meta Ads OAuth + sync
  | 'google_connect'      // performance+ — Google Ads connection
  | 'real_metrics'        // performance+ — real performance dashboard
  | 'smart_recommendations' // performance+ — AI-powered action recommendations
  | 'team_members'        // agency+ — multiple team users
  | 'client_reports'      // agency+ — client-facing reports
  | 'multi_client'        // agency+ — multiple clients / brands
  | 'white_label'         // enterprise — white-label reports
  | 'custom_automations'; // enterprise — custom automation rules

// ─── Feature sets per plan (cumulative) ──────────────────────────────────────
const FEATURES_BY_TIER: Record<PlanId, FeatureKey[]> = {
  starter: [],
  pro: [
    'analyses', 'ab_variations', 'variations_save',
    'advanced_projections', 'history', 'export', 'multi_workspace',
  ],
  performance: [
    'meta_connect', 'google_connect', 'real_metrics', 'smart_recommendations',
  ],
  agency: [
    'team_members', 'client_reports', 'multi_client',
  ],
  enterprise: [
    'white_label', 'custom_automations',
  ],
};

/** All features available to a given plan (including inherited from lower tiers). */
const PLAN_FEATURES: Record<PlanId, Set<FeatureKey>> = (() => {
  const result = {} as Record<PlanId, Set<FeatureKey>>;
  const accumulated: FeatureKey[] = [];
  for (const plan of PLAN_ORDER) {
    accumulated.push(...FEATURES_BY_TIER[plan]);
    result[plan] = new Set(accumulated);
  }
  return result;
})();

/** Returns true if the plan includes the given feature. */
export function hasFeature(planId: PlanId, feature: FeatureKey): boolean {
  return PLAN_FEATURES[planId].has(feature);
}

/** Returns all feature keys as a plain boolean map — useful for API responses. */
export function getFeatureMap(planId: PlanId): Record<FeatureKey, boolean> {
  const keys: FeatureKey[] = [
    'analyses', 'ab_variations', 'variations_save', 'advanced_projections',
    'history', 'export', 'multi_workspace',
    'meta_connect', 'google_connect', 'real_metrics', 'smart_recommendations',
    'team_members', 'client_reports', 'multi_client',
    'white_label', 'custom_automations',
  ];
  return Object.fromEntries(
    keys.map(k => [k, hasFeature(planId, k)])
  ) as Record<FeatureKey, boolean>;
}

// ─── Per-plan variation count limits ─────────────────────────────────────────
const VARIATION_LIMITS: Record<PlanId, number> = {
  starter:     1,
  pro:         2,
  performance: 4,
  agency:      4,
  enterprise:  4,
};

export function getVariationLimit(planId: PlanId): number {
  return VARIATION_LIMITS[planId];
}

// ─── Upgrade message helper ───────────────────────────────────────────────────
const PLAN_NAMES: Record<PlanId, string> = {
  starter:     'Starter',
  pro:         'Pro',
  performance: 'Performance',
  agency:      'Agency',
  enterprise:  'Enterprise',
};

/** Returns the minimum plan name required for a feature (for upgrade messages). */
export function requiredPlanName(feature: FeatureKey): string {
  for (const plan of PLAN_ORDER) {
    if (PLAN_FEATURES[plan].has(feature)) return PLAN_NAMES[plan];
  }
  return 'Enterprise';
}
