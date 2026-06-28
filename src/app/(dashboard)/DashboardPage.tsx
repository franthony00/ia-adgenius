'use client';

import React from 'react';
import SafeAdImage from '@/components/ui/SafeAdImage';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, MousePointer, Lightbulb, BarChart3,
  Sparkles, ArrowRight, Star, Activity, Play, Award, Target, ChevronRight,
  Zap, RefreshCw, Copy, AlertTriangle, Pause, GitBranch, Info,
  ThumbsUp, ThumbsDown, Trophy, XCircle,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/ui/MetricCard';
import MiniChart from '@/components/ui/MiniChart';
import Badge from '@/components/ui/Badge';
import { mockVariations } from '@/lib/mock-data';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  formatCurrency, formatPercent, formatMultiplier,
  formatRelativeTime, getPlatformColor, getPlatformLabel,
} from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActivityMeta(type: string): {
  color: string; bg: string; el: React.ReactNode;
} {
  const map: Record<string, { color: string; bg: string; el: React.ReactNode }> = {
    analysis:      { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  el: <BarChart3 size={11} className="text-emerald-400" /> },
    variation:     { color: '#22D3EE', bg: 'rgba(34,211,238,0.1)',  el: <Sparkles  size={11} className="text-cyan-400"    /> },
    ad_added:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  el: <Star      size={11} className="text-amber-400"   /> },
    metric_update: { color: '#818CF8', bg: 'rgba(129,140,248,0.1)', el: <Activity  size={11} className="text-indigo-400"  /> },
  };
  return map[type] ?? map.analysis;
}

function getRecMeta(type: string): {
  el: React.ReactNode; color: string; bg: string;
  badgeVariant: 'emerald' | 'rose' | 'cyan' | 'violet' | 'amber' | 'zinc';
} {
  const map: Record<string, {
    el: React.ReactNode; color: string; bg: string;
    badgeVariant: 'emerald' | 'rose' | 'cyan' | 'violet' | 'amber' | 'zinc';
  }> = {
    scale:     { el: <Zap       size={15} />, color: '#10B981', bg: 'rgba(16,185,129,0.1)',  badgeVariant: 'emerald' },
    pause:     { el: <Pause     size={15} />, color: '#F87171', bg: 'rgba(248,113,113,0.1)', badgeVariant: 'rose'    },
    test_cta:  { el: <RefreshCw size={15} />, color: '#22D3EE', bg: 'rgba(34,211,238,0.1)',  badgeVariant: 'cyan'   },
    test_copy: { el: <RefreshCw size={15} />, color: '#22D3EE', bg: 'rgba(34,211,238,0.1)',  badgeVariant: 'cyan'   },
    duplicate: { el: <Copy      size={15} />, color: '#818CF8', bg: 'rgba(129,140,248,0.1)', badgeVariant: 'violet' },
    monitor:   { el: <Activity  size={15} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  badgeVariant: 'amber'  },
  };
  return map[type] ?? map.monitor;
}

const STAGE_META: Record<string, { label: string; color: string }> = {
  generate: { label: 'Generate', color: '#10B981' },
  test:     { label: 'Test A/B', color: '#22D3EE' },
  measure:  { label: 'Measure',  color: '#818CF8' },
  learn:    { label: 'Learn',    color: '#F59E0B' },
  improve:  { label: 'Improve',  color: '#34D399' },
};

const IMPACT_COLOR: Record<string, string> = {
  high:   'text-rose-400',
  medium: 'text-amber-400',
  low:    'text-zinc-500',
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   'text-emerald-400',
  medium: 'text-amber-400',
  low:    'text-zinc-500',
};

// ─── Component ────────────────────────────────────────────────────────────────

// ─── Feedback buttons for recommendations ────────────────────────────────────
type RecFeedback = 'useful' | 'not_useful' | 'winner' | 'failed';

function RecFeedbackBar({ recId }: { recId: string }) {
  const [sent, setSent] = React.useState<RecFeedback | null>(null);

  async function sendFeedback(type: RecFeedback) {
    setSent(type);
    try {
      await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId, feedbackType: type }),
      });
    } catch { /* silent */ }
  }

  if (sent) {
    return (
      <p className="text-[10px] text-emerald-400 font-medium mt-2">
        ✓ Feedback registrado
      </p>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-2.5">
      <span className="text-[10px] text-zinc-600 mr-0.5">¿Útil?</span>
      {([
        { type: 'useful'    as RecFeedback, icon: <ThumbsUp  size={11} />, label: 'Sí',      color: '#34D399' },
        { type: 'not_useful'as RecFeedback, icon: <ThumbsDown size={11} />, label: 'No',      color: '#F87171' },
        { type: 'winner'    as RecFeedback, icon: <Trophy    size={11} />, label: 'Ganadora', color: '#FBBF24' },
        { type: 'failed'    as RecFeedback, icon: <XCircle   size={11} />, label: 'Fallida',  color: '#6B7280' },
      ] as const).map(({ type, icon, label, color }) => (
        <button key={type} onClick={() => sendFeedback(type)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all hover:opacity-80"
          style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const {
    data, isLoading, error, isDemoMode, refresh,
  } = useDashboardData();

  const variationsByAd = mockVariations.reduce<Record<string, number>>((acc, v) => {
    acc[v.originalAdId] = (acc[v.originalAdId] ?? 0) + 1;
    return acc;
  }, {});

  // ── Loading state ──
  if (isLoading && !data) {
    return (
      <AppLayout>
        <Header title="Dashboard" subtitle="Performance overview — last 7 days" onRefresh={refresh} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-sm text-zinc-500">Loading dashboard…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <AppLayout>
        <Header title="Dashboard" subtitle="Performance overview — last 7 days" onRefresh={refresh} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-center max-w-xs">
            <AlertTriangle size={24} className="text-rose-400" />
            <p className="text-sm text-white font-semibold">Could not load dashboard data</p>
            <p className="text-xs text-zinc-500">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              Try again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const stats          = data!.stats;
  const topAds         = data!.topAds;
  const recentHistory  = data!.recentHistory;

  const loopSteps = [
    { key: 'generate', label: 'Generate',  Icon: Sparkles,   count: stats.variationsGenerated, color: '#10B981', bg: 'rgba(16,185,129,0.08)'  },
    { key: 'test',     label: 'Test A/B',  Icon: GitBranch,  count: stats.variationsTested,    color: '#22D3EE', bg: 'rgba(34,211,238,0.08)'  },
    { key: 'measure',  label: 'Measure',   Icon: BarChart3,  count: stats.activeAds,           color: '#818CF8', bg: 'rgba(129,140,248,0.08)' },
    { key: 'learn',    label: 'Learn',     Icon: Lightbulb,  count: stats.analysesRun,         color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
    { key: 'improve',  label: 'Improve',   Icon: TrendingUp, count: stats.winningAds,          color: '#34D399', bg: 'rgba(52,211,153,0.08)'  },
  ];

  return (
    <AppLayout>
      <Header
        title="Dashboard"
        subtitle="Performance overview — last 7 days"
        onRefresh={refresh}
      />

      {/* ── Demo mode banner ── */}
      {isDemoMode && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <Info size={14} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300/80 flex-1">
            <span className="font-semibold text-amber-300">Demo mode</span>
            {' '}— showing sample data. Connect Meta Ads or Google Ads in{' '}
            <Link href="/meta-connect" className="underline underline-offset-2 hover:text-amber-200 transition-colors">
              Ad Platforms
            </Link>
            {' '}to see your real performance.
          </p>
        </div>
      )}

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">

        {/* ── KPI Row 1 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <MetricCard
            label="Total Spend" value={formatCurrency(stats.totalSpend, true)}
            subValue="7 days" trend={8.4} accent="cyan"
            icon={<DollarSign size={15} />} delay={0}
          />
          <MetricCard
            label="Revenue Generated" value={formatCurrency(stats.totalRevenue, true)}
            trend={14.2} accent="emerald"
            icon={<TrendingUp size={15} />} delay={60}
          />
          <MetricCard
            label="Avg. ROAS" value={formatMultiplier(stats.avgROAS)}
            trend={6.8} accent="blue"
            icon={<Activity size={15} />} delay={120}
          />
          <MetricCard
            label="Avg. CTR" value={formatPercent(stats.avgCTR)}
            trend={11.3} accent="amber"
            icon={<MousePointer size={15} />} delay={180}
          />
        </div>

        {/* ── KPI Row 2 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <MetricCard
            label="Campaigns Running" value={String(stats.campaignsRunning)}
            subValue="active" trend={0} accent="emerald"
            icon={<Play size={15} />} delay={0}
          />
          <MetricCard
            label="Variations Tested" value={String(stats.variationsTested)}
            subValue="A/B active" trend={25} accent="cyan"
            icon={<GitBranch size={15} />} delay={60}
          />
          <MetricCard
            label="Winning Ads" value={String(stats.winningAds)}
            subValue="above target" trend={16.7} accent="amber"
            icon={<Award size={15} />} delay={120}
          />
          <MetricCard
            label="Est. vs Real ROAS"
            value={`${stats.realAvgROAS}x`}
            subValue={`Est. was ${stats.estimatedAvgROAS}x`}
            trend={Number((((stats.realAvgROAS - stats.estimatedAvgROAS) / stats.estimatedAvgROAS) * 100).toFixed(1))}
            accent="blue"
            icon={<Target size={15} />} delay={180}
          />
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue vs Spend */}
          <div className="lg:col-span-2 rounded-2xl p-6 fade-in-up"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-white">Revenue vs. Spend</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Last 7 days</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />Revenue
                </span>
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />Spend
                </span>
              </div>
            </div>
            <div className="relative h-28 overflow-hidden">
              <MiniChart data={stats.revenueTrend} color="#10B981" height={112} />
              <div className="absolute inset-0 opacity-40">
                <MiniChart data={stats.spendTrend} color="#52525b" height={112} />
              </div>
            </div>
            <div className="flex justify-between mt-3">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <span key={d} className="text-[10px] text-zinc-600">{d}</span>
              ))}
            </div>
          </div>

          {/* Platform Mix */}
          <div className="rounded-2xl p-6 fade-in-up space-y-3"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-white">Platform Mix</h2>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wide">by spend</span>
            </div>
            {data!.platformMix.map(({ platform, spend, pct, roas, ctr }) => (
              <div key={platform}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300 capitalize font-medium">{getPlatformLabel(platform)}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-500">{formatCurrency(spend, true)}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">{roas}x</span>
                    <span className="text-[10px] text-zinc-600">{ctr}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: getPlatformColor(platform) }} />
                </div>
              </div>
            ))}
            <div className="pt-1 flex items-center gap-1.5 text-[10px] text-zinc-600">
              <Activity size={9} />
              ROAS · CTR shown per platform
            </div>
          </div>
        </div>

        {/* ── Performance Loop ── */}
        <div className="rounded-2xl p-6 fade-in-up"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Performance Loop</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Generate → Test → Measure → Learn → Improve
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="emerald">{data!.performanceLoop.length} ads in cycle</Badge>
              <Link href="/generator"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                Generator <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* Cycle bar */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
            {loopSteps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
                <div
                  className="flex flex-col items-center px-3 sm:px-4 py-2.5 rounded-xl min-w-[78px] sm:min-w-[92px]"
                  style={{ background: step.bg, border: `1px solid ${step.color}25` }}>
                  <div className="flex items-center gap-1 mb-1">
                    <step.Icon size={10} style={{ color: step.color }} />
                    <span className="text-[10px] font-semibold leading-none" style={{ color: step.color }}>
                      {step.label}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-white tabular-nums">{step.count}</span>
                </div>
                {i < loopSteps.length - 1 && (
                  <ChevronRight size={13} className="text-zinc-700 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Loop entry cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data!.performanceLoop.map(entry => {
              const ctrDelta  = entry.realCTR  !== undefined ? entry.realCTR  - entry.projectedCTR  : null;
              const roasDelta = entry.realROAS !== undefined ? entry.realROAS - entry.projectedROAS : null;
              const stage     = STAGE_META[entry.stage];
              return (
                <Link key={entry.id} href={`/ads/${entry.adId}`}>
                  <div className="p-4 rounded-xl transition-all hover:bg-white/[0.04] cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <p className="text-xs font-semibold text-white truncate">{entry.adName}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: `${stage.color}15`,
                          color: stage.color,
                          border: `1px solid ${stage.color}28`,
                        }}>
                        {stage.label}
                      </span>
                    </div>

                    {/* Metrics comparison */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* CTR */}
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-[10px] text-zinc-600 mb-1">CTR — Est. vs Real</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-zinc-400">{entry.projectedCTR}%</span>
                          <ChevronRight size={9} className="text-zinc-700" />
                          {entry.realCTR !== undefined
                            ? <span className="text-[11px] font-bold text-white">{entry.realCTR}%</span>
                            : <span className="text-[11px] text-zinc-600">—</span>}
                          {ctrDelta !== null && (
                            <span className={`text-[10px] font-bold ml-auto ${ctrDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {ctrDelta >= 0 ? '+' : ''}{ctrDelta.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* ROAS */}
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-[10px] text-zinc-600 mb-1">ROAS — Est. vs Real</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-zinc-400">{entry.projectedROAS}x</span>
                          <ChevronRight size={9} className="text-zinc-700" />
                          {entry.realROAS !== undefined
                            ? <span className="text-[11px] font-bold text-white">{entry.realROAS}x</span>
                            : <span className="text-[11px] text-zinc-600">—</span>}
                          {roasDelta !== null && (
                            <span className={`text-[10px] font-bold ml-auto ${roasDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {roasDelta >= 0 ? '+' : ''}{roasDelta.toFixed(1)}x
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="px-2.5 py-2 rounded-lg mb-2"
                      style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        <span className="text-emerald-400 font-semibold">Suggested: </span>
                        {entry.recommendation}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-600">Confidence:</span>
                      <span className={`text-[10px] font-semibold ${CONFIDENCE_COLOR[entry.confidence]}`}>
                        {entry.confidence.charAt(0).toUpperCase() + entry.confidence.slice(1)}
                      </span>
                      <span className="text-zinc-700 text-[10px]">·</span>
                      <span className="text-[10px] text-zinc-600">{entry.daysActive}d active</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Top Active Ads + Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Top Active Ads */}
          <div className="lg:col-span-2 rounded-2xl p-6 fade-in-up"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-white">Top Active Ads</h2>
                <p className="text-xs text-zinc-600 mt-0.5">Sorted by ROAS</p>
              </div>
              <Link href="/library"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {topAds.map(ad => {
                const varCount = variationsByAd[ad.id] ?? 0;
                return (
                  <Link key={ad.id} href={`/ads/${ad.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.04] cursor-pointer">
                      <div className="relative w-11 h-10 rounded-lg overflow-hidden shrink-0">
                        <SafeAdImage src={ad.imageUrl} alt={ad.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-xs font-semibold text-white truncate">{ad.name}</p>
                          {varCount > 0 && (
                            <span className="hidden sm:flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold flex-shrink-0"
                              style={{ background: 'rgba(34,211,238,0.08)', color: '#22D3EE', border: '1px solid rgba(34,211,238,0.15)' }}>
                              <GitBranch size={8} />{varCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-600 truncate">{ad.campaign}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-400">{formatMultiplier(ad.metrics.roas)}</p>
                          <p className="text-[10px] text-zinc-600">ROAS</p>
                        </div>
                        <div className="hidden sm:block text-right">
                          <p className="text-xs font-bold text-white">{formatPercent(ad.metrics.ctr)}</p>
                          <p className="text-[10px] text-zinc-600">CTR</p>
                        </div>
                        <div className="hidden md:block text-right">
                          <p className="text-xs font-semibold text-zinc-300">{formatCurrency(ad.metrics.spend, true)}</p>
                          <p className="text-[10px] text-zinc-600">Spend</p>
                        </div>
                        {ad.aiScore && (
                          <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg"
                            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                            <Star size={9} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-bold text-amber-400">{ad.aiScore}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl p-6 fade-in-up"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', animationDelay: '80ms' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
              <Link href="/history"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                History <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {recentHistory.map(entry => {
                const meta = getActivityMeta(entry.type);
                return (
                  <div key={entry.id} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: meta.bg }}>
                      {meta.el}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs text-white font-medium line-clamp-1 flex-1">{entry.title}</p>
                        {entry.score && (
                          <span className="text-[10px] font-bold text-emerald-400 shrink-0">{entry.score}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{entry.description}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <p className="text-[10px] text-zinc-700">{formatRelativeTime(entry.createdAt)}</p>
                        {entry.model && (
                          <span className="text-[9px] text-zinc-700 px-1 py-0.5 rounded"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {entry.model === 'claude-3-5-sonnet' ? 'Sonnet' :
                             entry.model === 'claude-opus-4'     ? 'Opus'   : 'GPT-4o'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── AI Recommendations ── */}
        <div className="rounded-2xl p-6 fade-in-up"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Lightbulb size={14} className="text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">AI Recommendations</h2>
              </div>
              <p className="text-xs text-zinc-600">
                Recomendación sugerida · Basado en datos disponibles · Confianza media
              </p>
            </div>
            <Link href="/analysis"
              className="self-start sm:self-auto text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors shrink-0">
              Full Analysis <ArrowRight size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data!.recommendations.map(rec => {
              const meta = getRecMeta(rec.type);
              return (
                <div key={rec.id} className="p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>

                  {/* Icon + badges */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: meta.bg, color: meta.color }}>
                        {meta.el}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white leading-tight">{rec.title}</p>
                        {rec.adName && (
                          <p className="text-[10px] text-zinc-600 mt-0.5 truncate max-w-[140px]">{rec.adName}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={meta.badgeVariant}>
                      {rec.impact === 'high' ? 'High' : rec.impact === 'medium' ? 'Medium' : 'Low'}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                    {rec.description}
                  </p>

                  {/* Confidence bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-zinc-600">Confianza estimada</span>
                      <span className="font-semibold text-zinc-400">{rec.confidence}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${rec.confidence}%`, background: meta.color }} />
                    </div>
                  </div>

                  {/* Metric + action */}
                  <div className="flex items-center justify-between">
                    {rec.metric && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-600">{rec.metric}:</span>
                        <span className="text-[10px] font-bold" style={{ color: meta.color }}>{rec.metricValue}</span>
                      </div>
                    )}
                    {rec.adId && (
                      <Link href={`/ads/${rec.adId}`}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 transition-colors ml-auto">
                        View ad <ArrowRight size={9} />
                      </Link>
                    )}
                  </div>

                  {/* Feedback loop */}
                  <RecFeedbackBar recId={rec.id} />

                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <AlertTriangle size={11} className="text-zinc-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              Proyección estimada basada en datos disponibles. Los resultados reales pueden variar según factores externos. No se garantizan ventas ni ROAS específicos.
            </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
