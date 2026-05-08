'use client';

import { use, useState, useEffect } from 'react';
import SafeAdImage from '@/components/ui/SafeAdImage';
import Link from 'next/link';
import {
  ArrowLeft, BarChart3, Sparkles, ExternalLink, Star, TrendingUp,
  Eye, MousePointer, DollarSign, Users,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import ScoreRing from '@/components/ui/ScoreRing';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import InsightCard from '@/components/ai/InsightCard';
import { mockAds, mockAnalyses, mockVariations } from '@/lib/mock-data';
import type { Ad, AIAnalysis, AdVariation } from '@/lib/types';
import {
  formatCurrency, formatNumber, formatPercent, formatMultiplier,
  getStatusColor, getPlatformLabel, getPlatformColor, formatDate, cn,
} from '@/lib/utils';

export default function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ad, setAd]               = useState<Ad | null>(mockAds.find(a => a.id === id) ?? null);
  const [analysis, setAnalysis]   = useState<AIAnalysis | null>(mockAnalyses.find(a => a.adId === id) ?? null);
  const [variations, setVariations] = useState<AdVariation[]>(mockVariations.filter(v => v.originalAdId === id));
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'analysis' | 'variations'>('metrics');
  const [ctaToast, setCtaToast]   = useState(false);

  useEffect(() => {
    fetch(`/api/ads/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.ad)         setAd(data.ad);
        if (data.analysis)   setAnalysis(data.analysis);
        if (data.variations) setVariations(data.variations);
      })
      .catch(() => { /* keep mock defaults */ })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading && !ad) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!ad) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Ad not found</p>
            <Link href="/library" className="text-emerald-400 hover:text-emerald-300">← Back to Library</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const METRICS = [
    { label: 'CTR',         value: formatPercent(ad.metrics.ctr),             icon: <MousePointer size={14} />, accent: '#10B981', trend: +0.4   },
    { label: 'CPC',         value: formatCurrency(ad.metrics.cpc),            icon: <DollarSign size={14} />,   accent: '#22D3EE', trend: -0.08  },
    { label: 'CPM',         value: formatCurrency(ad.metrics.cpm),            icon: <Eye size={14} />,          accent: '#34D399', trend: -1.2   },
    { label: 'CPA',         value: formatCurrency(ad.metrics.cpa),            icon: <Users size={14} />,        accent: '#6EE7B7', trend: -3.1   },
    { label: 'ROAS',        value: formatMultiplier(ad.metrics.roas),         icon: <TrendingUp size={14} />,   accent: '#10B981', trend: +0.6   },
    { label: 'Conversions', value: formatNumber(ad.metrics.conversions),       icon: <TrendingUp size={14} />,   accent: '#34D399', trend: +88    },
    { label: 'Reach',       value: formatNumber(ad.metrics.reach, true),       icon: <Users size={14} />,        accent: '#FBBF24', trend: +12000 },
    { label: 'Impressions', value: formatNumber(ad.metrics.impressions, true), icon: <Eye size={14} />,          accent: '#F59E0B', trend: +45000 },
    { label: 'Spend',       value: formatCurrency(ad.metrics.spend, true),     icon: <DollarSign size={14} />,   accent: '#F87171', trend: undefined },
    { label: 'Revenue',     value: formatCurrency(ad.metrics.revenue, true),   icon: <TrendingUp size={14} />,   accent: '#34D399', trend: undefined },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-2 sm:gap-4 px-4 lg:px-8 py-4"
        style={{ background: 'rgba(11,11,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/library" className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0 pl-10 lg:pl-0">
          <h1 className="text-base font-bold text-white truncate">{ad.name}</h1>
          <p className="text-xs text-zinc-500 truncate">{ad.campaign} · {getPlatformLabel(ad.platform)}</p>
        </div>
        <span className={cn('hidden sm:inline px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0', getStatusColor(ad.status))}>
          {ad.status}
        </span>
        {ad.aiScore && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-amber-300">{ad.aiScore}/100</span>
          </div>
        )}
        <Link href="/analysis"
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shrink-0"
          style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
          <BarChart3 size={14} />
          <span className="hidden sm:inline">Analyze</span>
        </Link>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Ad Preview ── */}
          <div className="space-y-5">
            {/* Image */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="relative h-64">
                <SafeAdImage src={ad.imageUrl} alt={ad.name} fill className="object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(11,11,15,0.85))' }} />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded text-white mb-2 inline-block"
                    style={{ background: getPlatformColor(ad.platform) }}>
                    {getPlatformLabel(ad.platform)}
                  </span>
                </div>
              </div>
              <div className="p-4" style={{ background: '#111827' }}>
                <p className="text-sm font-bold text-white mb-1">{ad.headline}</p>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">{ad.description}</p>
                <button
                  onClick={() => { setCtaToast(true); setTimeout(() => setCtaToast(false), 2800); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                  {ad.cta} <ExternalLink size={10} />
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {ad.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full text-zinc-400"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Scores */}
            {analysis && (
              <div className="rounded-2xl p-5 space-y-4" style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.15)' }}>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">AI Score Breakdown</p>
                <div className="flex justify-around">
                  <ScoreRing score={analysis.copyScore} label="Copy" size={72} />
                  <ScoreRing score={analysis.visualScore} label="Visual" size={72} />
                  <ScoreRing score={analysis.audienceScore} label="Audience" size={72} />
                </div>
                <ProgressBar value={analysis.hookStrength} label="Hook Strength" showValue color="#10B981" height={5} />
              </div>
            )}
          </div>

          {/* ── Right: Tabs ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl overflow-x-auto max-w-full" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              {(['metrics', 'analysis', 'variations'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                    activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300')}
                  style={activeTab === tab ? { background: 'linear-gradient(135deg,#10B981,#059669)' } : {}}>
                  {tab}
                  {tab === 'variations' && variations.length > 0 && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.2)', color: '#6EE7B7' }}>
                      {variations.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {METRICS.map(({ label, value, icon, accent, trend }) => (
                    <div key={label} className="p-4 rounded-2xl"
                      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: accent }}>{icon}</span>
                        <span className="text-xs text-zinc-500 font-medium">{label}</span>
                      </div>
                      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
                      {trend !== undefined && (
                        <p className={cn('text-xs mt-1', trend > 0 ? 'text-emerald-400' : 'text-rose-400')}>
                          {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(trend > 1 ? 0 : 2)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Budget */}
                <div className="p-5 rounded-2xl" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-zinc-400">Budget Utilization</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(ad.metrics.spend)} / {formatCurrency(ad.budget)}
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.round((ad.metrics.spend / ad.budget) * 100)}
                    color={ad.metrics.spend / ad.budget > 0.9 ? '#F87171' : '#10B981'}
                    height={6}
                    showValue
                  />
                </div>
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-5">
                {analysis ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-500">Analysed with <span className="text-emerald-400">{analysis.model}</span> · {formatDate(analysis.createdAt)}</p>
                      </div>
                      <Badge variant={analysis.predictedPerformance === 'high' ? 'emerald' : analysis.predictedPerformance === 'medium' ? 'amber' : 'rose'} dot>
                        Predicted: {analysis.predictedPerformance} performance
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-emerald-400" />
                        Strengths
                      </h3>
                      <div className="space-y-2">
                        {analysis.strengths.map((s, i) => (
                          <InsightCard key={i} type="strength" content={s} index={i} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-rose-400" />
                        Weaknesses
                      </h3>
                      <div className="space-y-2">
                        {analysis.weaknesses.map((w, i) => (
                          <InsightCard key={i} type="weakness" content={w} index={i} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-emerald-400" />
                        Recommendations
                      </h3>
                      <div className="space-y-2">
                        {analysis.recommendations.map((r, i) => (
                          <InsightCard key={i} type="recommendation" content={r} index={i} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
                    style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                    <BarChart3 size={32} className="text-zinc-700 mb-4" />
                    <p className="text-zinc-400 font-medium mb-2">No analysis yet</p>
                    <p className="text-zinc-600 text-sm mb-4">Run an AI analysis to get insights on this ad</p>
                    <Link href="/analysis"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                      <Sparkles size={14} />
                      Run Analysis
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Variations Tab */}
            {activeTab === 'variations' && (
              <div className="space-y-5">
                {variations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {variations.map((v, i) => (
                      <div key={v.id} className="rounded-2xl overflow-hidden fade-in-up"
                        style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', animationDelay: `${i*60}ms` }}>
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-white leading-tight">{v.headline}</p>
                            <Badge variant={v.status === 'approved' ? 'emerald' : v.status === 'testing' ? 'blue' : v.status === 'rejected' ? 'rose' : 'amber'}>
                              {v.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{v.description}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-emerald-400 font-bold">CTR: {formatPercent(v.predictedCTR)}</span>
                            <span className="text-zinc-600">·</span>
                            <span className="text-emerald-400 font-bold">ROAS: {formatMultiplier(v.predictedROAS)}</span>
                          </div>
                          <p className="text-[11px] text-zinc-600 leading-relaxed">{v.rationale}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
                    style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                    <Sparkles size={32} className="text-zinc-700 mb-4" />
                    <p className="text-zinc-400 font-medium mb-2">No variations yet</p>
                    <Link href="/generator"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mt-2"
                      style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                      <Sparkles size={14} />
                      Generate Variations
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA demo toast */}
      {ctaToast && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl fade-in-up"
          style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
          <Sparkles size={14} className="text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold text-white">Demo mode — CTA not connected yet</p>
        </div>
      )}
    </AppLayout>
  );
}
