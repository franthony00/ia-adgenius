'use client';

import { useState, useEffect } from 'react';
import type { PlanId } from '@/lib/types';
import type { FeatureKey } from '@/lib/plan-gates';
import { getFeatureMap, getVariationLimit } from '@/lib/plan-gates';

export interface PlanState {
  planId: PlanId;
  variationLimit: number;
  features: Record<FeatureKey, boolean>;
  loading: boolean;
}

// Safe defaults while loading (pro = good UX, same as demo mode)
const DEFAULT_PLAN: PlanId = 'pro';

const VALID_PLAN_IDS: readonly PlanId[] = ['starter', 'pro', 'performance', 'agency', 'enterprise'];

function buildDefault(): PlanState {
  return {
    planId:         DEFAULT_PLAN,
    variationLimit: getVariationLimit(DEFAULT_PLAN),
    features:       getFeatureMap(DEFAULT_PLAN),
    loading:        true,
  };
}

export function usePlan(): PlanState {
  const [state, setState] = useState<PlanState>(buildDefault);

  useEffect(() => {
    fetch('/api/plan')
      .then(r => r.json())
      .then(data => {
        // Guard against malformed API responses (e.g. error JSON without planId)
        // to prevent downstream crashes in components that index into plan maps.
        const planId: PlanId = VALID_PLAN_IDS.includes(data.planId) ? data.planId : DEFAULT_PLAN;
        setState({
          planId,
          variationLimit: data.variationLimit ?? getVariationLimit(planId),
          features:       data.features       ?? getFeatureMap(planId),
          loading:        false,
        });
      })
      .catch(() => {
        // On error keep defaults, just mark loading done
        setState(s => ({ ...s, loading: false }));
      });
  }, []);

  return state;
}

/** Convenience — true once loaded and the feature is available. */
export function useHasFeature(feature: FeatureKey): boolean {
  const { features } = usePlan();
  return features[feature] ?? false;
}
