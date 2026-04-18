'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Sparkles, BarChart3, TrendingUp, TrendingDown, Lightbulb, Brain,
  Check, AlertTriangle, ArrowRight,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import ScoreRing from '@/components/ui/ScoreRing';
import ProgressBar from '@/components/ui/ProgressBar';
import InsightCard from '@/components/ai/InsightCard';
import Badge from '@/components/ui/Badge';
import { mockAds, mockAnalyses, globalPatterns } from '@/lib/mock-data';
import { formatPercent, formatMultiplier, formatDate, cn, sleep } from '@/lib/utils';
import type { AIModel } from '@/lib/types';

const MODELS: { id: AIModel; label: string; desc: string }[] = [
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', desc: 'Best balance of speed and insight depth' },
  { id: 'claude-opus-4',    label: 'Claude Opus 4',     desc: 'Maximum reasoning depth for complex ads' },
  { id: 'gpt-4o',           label: 'GPT-4o',            desc: 'Strong multimodal analysis capabilities' },
];

type Step = 'idle' | 'loading' | 'done';

export default function AnalysisPage() {
  const [selectedAd, setSelectedAd] = useState(mockAds[0]);
  const [model, setModel] = useState<AIModel>('claude-3-5-sonnet');
  const [step, setStep] = useState<Step>('idle');
  const [progress, setProgress] = useState(0);
  const [activeAnalysis, setActiveAnalysis] = useState(mockAnalyses[0]);
  const [loadingText, setLoadingText] = useState('');

  const runAnalysis = async () => {
    setStep('loading');
    setProgress(0);
    const steps = [
      'Reading ad creative...',
      'Analysing visual composition...',
      'Evaluating copy effectiveness...',
      'Detecting performance patterns...',
      'Generating recommendations...',
      'Compiling insights...',
    ];
    for (let i = 0; i < steps.length; i++) {
      setLoadingText(steps[i]);
      setProgress(Math.round(((i + 1) / steps.length) * 100));
      await sleep(600);
    }
    const found = mockAnalyses.find(a => a.adId === selectedAd.id) ?? mockAnalyses[0];
    setActiveAnalysis(found);
    setStep('done');
  };

  return (
    <AppLayout>
      <Header
        title="AI Analysis"
        subtitle="Deep-dive into what makes your ads work — or not"
        onRefresh={() => setStep('idle')}
      />

      <div className="flex-1 p-8 space-y-8">
        {/* ── Setup panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Ad selector */}
          <div className="rounded-2xl p-6 space-y-4"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-white">Select Ad to Analyse</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {mockAds.filter(a => a.status !== 'draft').map(ad => (
                <button key={ad.id} onClick={() => { setSelectedAd(ad); setStep('idle'); }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                    selectedAd.id === ad.id
                      ? 'border border-emerald-500/30'
                      : 'hover:bg-white/5 border border-transparent',
                  )}
                  style={selectedAd.id === ad.id ? { background: 'rgba(16,185,129,0.08)' } : {}}>
                  <div className="relative w-10 h-9 rounded-lg overflow-hidden shrink-0">
                    <Image src={ad.imageUrl} alt={ad.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{ad.name}</p>
                    <p className="text-[10px] text-zinc-500 capitalize">{ad.platform}</p>
                  </div>
                  {selectedAd.id === ad.id && <Check size={13} className="text-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Model + Run */}
          <div className="rounded-2xl p-6 space-y-5"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-white">Choose AI Model</h2>
            <div className="space-y-2">
              {MODELS.map(m => (
                <button key={m.id} onClick={() => setModel(m.id)}
                  className={cn('w-full p-3 rounded-xl text-left transition-all border',
                    model === m.id ? 'border-emerald-500/30' : 'border-white/5 hover:border-white/10')}
                  style={model === m.id ? { background: 'rgba(16,185,129,0.08)' } : {}}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-white">{m.label}</span>
                    {model === m.id && <Check size={12} className="text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-500">{m.desc}</p>
                </button>
              ))}
            </div>

            <button onClick={runAnalysis} disabled={step === 'loading'}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
              {step === 'loading' ? (
                <><RefreshCwAnim /> Analysing...</>
              ) : (
                <><Sparkles size={15} /> Run AI Analysis</>
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative h-40">
              <Image src={selectedAd.imageUrl} alt={selectedAd.name} fill className="object-cover opacity-80" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.2),rgba(8,8,15,0.9))' }} />
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm font-bold text-white">{selectedAd.headline}</p>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{selectedAd.description}</p>
              {selectedAd.aiScore && (
                <div className="flex items-center gap-2 pt-1">
                  <ProgressBar value={selectedAd.aiScore} color="#10B981" height={4} className="flex-1" />
                  <span className="text-xs font-bold text-emerald-400">{selectedAd.aiScore}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Loading state ── */}
        {step === 'loading' && (
          <div className="rounded-2xl p-8 space-y-5 fade-in-up"
            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                <Brain size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{loadingText}<span className="cursor-blink">_</span></p>
                <p className="text-xs text-zinc-500">Analysing with {MODELS.find(m => m.id === model)?.label}</p>
              </div>
            </div>
            <div className="space-y-2">
              <ProgressBar value={progress} color="#10B981" height={6} />
              <p className="text-xs text-zinc-600 text-right">{progress}% complete</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {step === 'done' && activeAnalysis && (
          <div className="space-y-6 fade-in-up">
            {/* Score overview */}
            <div className="rounded-2xl p-6"
              style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 0 32px rgba(16,185,129,0.06)' }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-white mb-1">Analysis Complete</h2>
                  <p className="text-xs text-zinc-500">{activeAnalysis.adName} · {MODELS.find(m => m.id === model)?.label} · {formatDate(activeAnalysis.createdAt)}</p>
                </div>
                <div className="flex gap-3">
                  <Badge variant={activeAnalysis.predictedPerformance === 'high' ? 'emerald' : 'amber'} dot>
                    {activeAnalysis.predictedPerformance} performance
                  </Badge>
                  <Badge variant="cyan">Pred. CTR: {formatPercent(activeAnalysis.estimatedCTR)}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <ScoreRing score={activeAnalysis.overallScore} size={100} label="Overall" />
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Copy',         value: activeAnalysis.copyScore,     color: '#10B981' },
                    { label: 'Visual',       value: activeAnalysis.visualScore,   color: '#22D3EE' },
                    { label: 'Audience Fit', value: activeAnalysis.audienceScore, color: '#34D399' },
                    { label: 'Hook Strength',value: activeAnalysis.hookStrength,  color: '#FBBF24' },
                  ].map(({ label, value, color }) => (
                    <ProgressBar key={label} label={label} value={value} color={color} height={5} showValue />
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 mb-1">Predicted ROAS</p>
                  <p className="text-3xl font-bold text-emerald-400">{formatMultiplier(activeAnalysis.estimatedROAS)}</p>
                </div>
              </div>
            </div>

            {/* Insights columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-400" /> Strengths ({activeAnalysis.strengths.length})
                </h3>
                <div className="space-y-2">
                  {activeAnalysis.strengths.map((s, i) => <InsightCard key={i} type="strength" content={s} index={i} />)}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-rose-400" /> Weaknesses ({activeAnalysis.weaknesses.length})
                </h3>
                <div className="space-y-2">
                  {activeAnalysis.weaknesses.map((w, i) => <InsightCard key={i} type="weakness" content={w} index={i} />)}
                </div>
              </div>
            </div>

            {/* Patterns */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-400" /> Detected Patterns
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeAnalysis.patterns.map((p, i) => <InsightCard key={i} type="pattern" content={p} index={i} />)}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <ArrowRight size={14} className="text-emerald-400" /> Recommendations
              </h3>
              <div className="space-y-2">
                {activeAnalysis.recommendations.map((r, i) => <InsightCard key={i} type="recommendation" content={r} index={i} />)}
              </div>
            </div>
          </div>
        )}

        {/* ── Global Patterns table ── */}
        <div className="rounded-2xl p-6 space-y-4"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-white">Cross-Ad Performance Patterns</h2>
          <p className="text-xs text-zinc-500">Patterns detected across all ads in your library</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Pattern', 'Avg ROAS', 'Avg CTR', 'Ads Using', 'Trend'].map(h => (
                    <th key={h} className="text-left text-zinc-600 font-medium pb-3 pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {globalPatterns.map((p) => (
                  <tr key={p.name} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 pr-6 text-white font-medium">{p.name}</td>
                    <td className="py-3 pr-6 text-emerald-400 font-bold">{formatMultiplier(p.avgROAS)}</td>
                    <td className="py-3 pr-6 text-cyan-300">{formatPercent(p.avgCTR)}</td>
                    <td className="py-3 pr-6 text-zinc-400">{p.adsUsing} ads</td>
                    <td className="py-3">
                      {p.trend === 'up'
                        ? <TrendingUp size={13} className="text-emerald-400" />
                        : p.trend === 'down'
                        ? <TrendingDown size={13} className="text-rose-400" />
                        : <span className="text-zinc-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function RefreshCwAnim() {
  return (
    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
      <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
    </svg>
  );
}
