'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import {
  Brain, Zap, Target, Lightbulb, ThumbsUp, ThumbsDown,
  Minus, AlertTriangle, RefreshCw, Star,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type InsightsData = {
  source: 'db' | 'mock';
  scoreAverages: { overall: number; copy: number; visual: number; audience: number; hookStrength: number; totalAnalyses: number };
  topAngles: Array<{ angle: string; avgCTR: number; avgROAS: number; count: number }>;
  platformPerformance: Array<{ platform: string; avgCTR: number; avgROAS: number; count: number }>;
  topStrengths: Array<{ text: string; count: number }>;
  topWeaknesses: Array<{ text: string; count: number }>;
  topRecommendations: Array<{ text: string; count: number }>;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  changeTypeBreakdown: Array<{ type: string; count: number; avgCTR: number }>;
  winRate: number;
  totalVariations: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ANGLE_LABELS: Record<string, string> = {
  emocional: 'Emotional', urgencia: 'Urgency', social_proof: 'Social Proof',
  problema_solucion: 'Problem / Solution', oferta: 'Offer', curiosidad: 'Curiosity',
  directa: 'Direct', autoridad: 'Authority', ugc: 'UGC',
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C', facebook: '#1877F2', google: '#4285F4',
  tiktok: '#69C9D0', linkedin: '#0A66C2',
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  copy: 'Copy', visual: 'Visual', cta: 'CTA', both: 'Copy + Visual',
};

// ─── Score card ───────────────────────────────────────────────────────────────

function ScoreCard({ label, score, color, sub }: { label: string; score: number; color: string; sub: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-4xl font-bold" style={{ color }}>{score}</p>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }} />
      </div>
      <p className="text-[10px] text-zinc-600">{sub}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [data, setData]       = React.useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError]     = React.useState<string | null>(null);

  function load() {
    setIsLoading(true);
    setError(null);
    fetch('/api/insights')
      .then(r => r.json())
      .then((d: InsightsData) => setData(d))
      .catch(() => setError('Failed to load insights'))
      .finally(() => setIsLoading(false));
  }

  React.useEffect(() => { load(); }, []);

  if (isLoading && !data) {
    return (
      <AppLayout>
        <Header title="Learning Insights" subtitle="Patterns learned from your AI analyses" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-sm text-zinc-500">Loading insights…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Header title="Learning Insights" subtitle="Patterns learned from your AI analyses" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={24} className="text-rose-400" />
            <p className="text-sm text-white font-semibold">Could not load insights</p>
            <button onClick={load}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              Try again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const d = data!;
  const totalSentiment = d.sentimentBreakdown.positive + d.sentimentBreakdown.neutral + d.sentimentBreakdown.negative || 1;
  const maxAngleCTR    = Math.max(...d.topAngles.map(a => a.avgCTR), 0.01);
  const maxPlatCTR     = Math.max(...d.platformPerformance.map(p => p.avgCTR), 0.01);
  const maxCtCTR       = Math.max(...d.changeTypeBreakdown.map(c => c.avgCTR), 0.01);

  return (
    <AppLayout>
      <Header title="Learning Insights" subtitle="Patterns learned from your AI analyses"
        action={
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
            style={d.source === 'mock'
              ? { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#FCD34D' }
              : { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34D399' }
            }>
            <span className={`w-1.5 h-1.5 rounded-full ${d.source === 'mock' ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            {d.source === 'mock' ? 'Sample Data' : 'Live Data'}
          </div>
        }
      />

      {/* Demo banner */}
      {d.source === 'mock' && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300/80">
            <span className="font-semibold text-amber-300">Sample insights</span>
            {' '}— run AI analyses on your ads to generate real learning data.
          </p>
        </div>
      )}

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ── 1. Score Overview ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <ScoreCard label="Overall Score"  score={d.scoreAverages.overall}      color="#10B981" sub={`from ${d.scoreAverages.totalAnalyses} analyses`} />
          <ScoreCard label="Copy Score"     score={d.scoreAverages.copy}         color="#22D3EE" sub="headline + description" />
          <ScoreCard label="Visual Score"   score={d.scoreAverages.visual}       color="#818CF8" sub="image + creative quality" />
          <ScoreCard label="Audience Score" score={d.scoreAverages.audience}     color="#F59E0B" sub="targeting alignment" />
          <ScoreCard label="Hook Strength"  score={d.scoreAverages.hookStrength} color="#F87171" sub="first 3 seconds" />
        </div>

        {/* ── 2. Winning Angles + Platform Performance ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Winning Angles */}
          <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Zap size={14} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Winning Angles</h2>
              <span className="ml-auto text-[10px] text-zinc-600">sorted by avg CTR</span>
            </div>
            <div className="space-y-3">
              {d.topAngles.map((a, i) => (
                <div key={a.angle}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-300 font-medium">
                        {ANGLE_LABELS[a.angle] ?? a.angle}
                      </span>
                      {i === 0 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                          style={{ background: 'rgba(251,191,36,0.1)', color: '#FCD34D', border: '1px solid rgba(251,191,36,0.2)' }}>
                          <Star size={8} className="fill-amber-400" /> Best
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-emerald-400 font-semibold">{a.avgCTR}% CTR</span>
                      <span className="text-zinc-500">{a.avgROAS}x ROAS</span>
                      <span className="text-zinc-700">{a.count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(a.avgCTR / maxAngleCTR) * 100}%`, background: i === 0 ? '#10B981' : 'rgba(16,185,129,0.4)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Performance */}
          <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Target size={14} className="text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Platform Performance</h2>
              <span className="ml-auto text-[10px] text-zinc-600">sorted by avg CTR</span>
            </div>
            <div className="space-y-3">
              {d.platformPerformance.map(p => (
                <div key={p.platform}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[p.platform] ?? '#6B7280' }} />
                      <span className="text-xs text-zinc-300 font-medium capitalize">{p.platform}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-cyan-400 font-semibold">{p.avgCTR}% CTR</span>
                      <span className="text-zinc-500">{p.avgROAS}x ROAS</span>
                      <span className="text-zinc-700">{p.count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(p.avgCTR / maxPlatCTR) * 100}%`, background: PLATFORM_COLORS[p.platform] ?? '#6B7280' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. Win Rate + Change Type ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Win Rate */}
          <div className="rounded-2xl p-6 flex flex-col items-center justify-center text-center"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wide mb-3">Variation Win Rate</p>
            <p className="text-6xl font-bold text-emerald-400 mb-2">{d.winRate}%</p>
            <p className="text-xs text-zinc-500">of variations approved</p>
            <p className="text-[10px] text-zinc-700 mt-1">{d.totalVariations} total variations</p>
          </div>

          {/* Change Type Breakdown */}
          <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Brain size={14} className="text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Change Type Performance</h2>
            </div>
            <div className="space-y-3">
              {d.changeTypeBreakdown.map(c => (
                <div key={c.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-300 font-medium">{CHANGE_TYPE_LABELS[c.type] ?? c.type}</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-violet-400 font-semibold">{c.avgCTR}% CTR</span>
                      <span className="text-zinc-700">{c.count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(c.avgCTR / maxCtCTR) * 100}%`, background: '#818CF8' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 4. Sentiment Breakdown ── */}
        <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-white mb-5">Ad Sentiment Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'positive' as const, icon: <ThumbsUp size={20} />, label: 'Positive', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
              { key: 'neutral'  as const, icon: <Minus    size={20} />, label: 'Neutral',  color: '#71717A', bg: 'rgba(113,113,122,0.08)' },
              { key: 'negative' as const, icon: <ThumbsDown size={20} />, label: 'Negative', color: '#F87171', bg: 'rgba(248,113,113,0.08)' },
            ].map(({ key, icon, label, color, bg }) => {
              const count = d.sentimentBreakdown[key];
              const pct   = Math.round((count / totalSentiment) * 100);
              return (
                <div key={key} className="flex flex-col items-center gap-2 p-4 rounded-xl"
                  style={{ background: bg, border: `1px solid ${color}20` }}>
                  <div style={{ color }}>{icon}</div>
                  <p className="text-2xl font-bold" style={{ color }}>{count}</p>
                  <p className="text-xs font-medium" style={{ color }}>{label}</p>
                  <p className="text-[10px] text-zinc-600">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 5. Strengths & Weaknesses ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Strengths */}
          <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-5">
              <ThumbsUp size={14} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Common Strengths</h2>
            </div>
            <div className="space-y-2.5">
              {d.topStrengths.map(s => (
                <div key={s.text} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <p className="text-xs text-zinc-300 flex-1 leading-relaxed">{s.text}</p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399' }}>
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-5">
              <ThumbsDown size={14} className="text-rose-400" />
              <h2 className="text-sm font-semibold text-white">Common Weaknesses</h2>
            </div>
            <div className="space-y-2.5">
              {d.topWeaknesses.map(w => (
                <div key={w.text} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <p className="text-xs text-zinc-300 flex-1 leading-relaxed">{w.text}</p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
                    {w.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 6. AI Recommendation Patterns ── */}
        <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb size={14} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-white">AI Recommendation Patterns</h2>
            <span className="ml-auto text-[10px] text-zinc-600">most frequent suggestions</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.topRecommendations.map((r, i) => (
              <div key={r.text} className="p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-amber-400">#{i + 1}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                    seen {r.count}×
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
