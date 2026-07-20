'use client';

import { useState } from 'react';
import { Check, RefreshCw, AlertTriangle, Sparkles, Zap, TrendingUp, Users, Building2 } from 'lucide-react';
import { pricingPlans } from '@/lib/mock-data';
import type { PricingPlan } from '@/lib/types';
import { usePlan } from '@/hooks/usePlan';
import { PLAN_ORDER } from '@/lib/plan-gates';

const ACTION_STYLE: Record<PricingPlan['action'], { bg: string; border: string; color: string; disabled: boolean }> = {
  current:  { bg: 'rgba(16,185,129,0.08)',  border: '1px solid rgba(16,185,129,0.25)', color: '#34D399',  disabled: true  },
  upgrade:  { bg: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', color: '#fff', disabled: false },
  downgrade:{ bg: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', disabled: false },
  contact:  { bg: 'rgba(34,211,238,0.1)',   border: '1px solid rgba(34,211,238,0.25)', color: '#22D3EE',  disabled: false },
};

const BADGE_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  emerald: { bg: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399' },
  amber:   { bg: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FBBF24' },
};

const PLAN_ICON: Record<string, React.ReactNode> = {
  starter:     <Sparkles size={16} />,
  pro:         <Zap size={16} />,
  performance: <TrendingUp size={16} />,
  agency:      <Users size={16} />,
  enterprise:  <Building2 size={16} />,
};

interface BillingPaneProps {
  onContactSales?: () => void;
}

export default function BillingPane({ onContactSales }: BillingPaneProps) {
  const { planId, loading: planLoading } = usePlan();
  const activePlanId = planId ?? 'pro';
  const currentPlan  = pricingPlans.find(p => p.id === activePlanId) ?? pricingPlans[1];
  const currentIdx   = PLAN_ORDER.indexOf(activePlanId);
  const [loadingPlan, setLoadingPlan]     = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingError, setBillingError]   = useState<string | null>(null);

  async function handleUpgrade(targetPlanId: string) {
    setLoadingPlan(targetPlanId);
    setBillingError(null);
    try {
      const res  = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: targetPlanId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingPlan(null);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setBillingError(null);
    try {
      const res  = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Portal failed');
      window.location.href = data.url;
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Something went wrong');
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-5">

      {billingError && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2 text-[10px] font-semibold text-amber-300"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={12} className="shrink-0" />
          {billingError}
        </div>
      )}

      {/* Current plan summary */}
      <div className="rounded-xl p-4"
        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-zinc-400">Current Plan</p>
              {planLoading ? (
                <span className="text-[10px] text-zinc-600 animate-pulse">Loading…</span>
              ) : (
                <span className="text-xs font-bold text-emerald-400">{currentPlan.name}</span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399' }}>
                Active
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-zinc-600">
              <span>{currentPlan.priceLabel}</span>
            </div>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors text-center disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {portalLoading ? <RefreshCw size={10} className="animate-spin inline" /> : 'Manage Billing'}
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">All Plans</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pricingPlans.map(plan => {
            const thisIdx      = PLAN_ORDER.indexOf(plan.id);
            const derivedAction: PricingPlan['action'] =
              thisIdx === currentIdx ? 'current'
              : thisIdx < currentIdx ? 'downgrade'
              : plan.priceMonthly === null ? 'contact'
              : 'upgrade';
            const actionStyle = ACTION_STYLE[derivedAction];
            const isCurrent   = derivedAction === 'current';
            const showBadge   = plan.badge && plan.badgeVariant && (plan.badge !== 'Current Plan' || isCurrent);
            const badge       = showBadge ? BADGE_STYLE[plan.badgeVariant!] : null;
            const isLoading   = loadingPlan === plan.id;

            function handlePlanClick() {
              if (isCurrent) return;
              if (derivedAction === 'contact') { onContactSales?.(); return; }
              // Downgrade: usar portal de Stripe para cambiar el plan existente
              if (derivedAction === 'downgrade') { handleManageBilling(); return; }
              handleUpgrade(plan.id);
            }

            return (
              <div
                key={plan.id}
                className="rounded-xl p-4 flex flex-col gap-3 transition-all"
                style={{
                  background: isCurrent ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.025)',
                  border:     isCurrent ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow:  isCurrent ? '0 0 20px rgba(16,185,129,0.06)' : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isCurrent ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                        color:      isCurrent ? '#10B981' : '#6B7280',
                        border:     isCurrent ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.08)',
                      }}>
                      {PLAN_ICON[plan.id]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{plan.name}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{plan.priceLabel}</p>
                    </div>
                  </div>
                  {badge && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                      style={{ background: badge.bg, border: badge.border, color: badge.color }}>
                      {plan.badge}
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-zinc-500 leading-relaxed">{plan.shortDesc}</p>

                <ul className="space-y-1.5 flex-1">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-start gap-2 text-[10px] text-zinc-400">
                      <Check size={10} className="text-emerald-500 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handlePlanClick}
                  disabled={isCurrent || isLoading || !!loadingPlan}
                  className="w-full py-2 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-default flex items-center justify-center gap-1.5"
                  style={{
                    background: actionStyle.bg,
                    border:     actionStyle.border,
                    color:      actionStyle.color,
                    opacity:    (!isCurrent && !!loadingPlan && !isLoading) ? 0.5 : undefined,
                  }}>
                  {isLoading
                    ? <><RefreshCw size={10} className="animate-spin" /> Processing…</>
                    : isCurrent
                      ? <><Check size={10} /> Current Plan</>
                      : derivedAction === 'upgrade'   ? 'Upgrade'
                      : derivedAction === 'downgrade' ? 'Manage & Downgrade'
                      : 'Contact Sales'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-zinc-700 text-center pb-1">
        All plans include a 7-day free trial · Cancel anytime · No credit card required for trial
      </p>
    </div>
  );
}
