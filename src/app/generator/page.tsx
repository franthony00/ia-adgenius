'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Sparkles, Wand2, RefreshCw, Check, Copy, ChevronRight,
  ImageIcon, FileText, Zap, ToggleLeft, ToggleRight,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import VariationCard from '@/components/ai/VariationCard';
import { mockAds, mockVariations } from '@/lib/mock-data';
import { cn, sleep, formatPercent, formatMultiplier } from '@/lib/utils';
import type { AIModel, AdVariation } from '@/lib/types';

type GenerateMode = 'copy' | 'visual' | 'both';
type Step = 'config' | 'generating' | 'results';

const LOADING_MSGS = [
  'Reading original ad patterns...',
  'Analysing top-performing elements...',
  'Applying persuasion frameworks...',
  'Crafting headline variations...',
  'Optimizing CTAs...',
  'Building image prompts...',
  'Scoring variations...',
  'Finalizing output...',
];

export default function GeneratorPage() {
  const [selectedAd, setSelectedAd] = useState(mockAds[0]);
  const [mode, setMode] = useState<GenerateMode>('both');
  const [model, setModel] = useState<AIModel>('claude-3-5-sonnet');
  const [count, setCount] = useState(2);
  const [step, setStep] = useState<Step>('config');
  const [progress, setProgress] = useState(0);
  const [loadMsg, setLoadMsg] = useState('');
  const [results, setResults] = useState<AdVariation[]>([]);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  const generate = async () => {
    setStep('generating');
    setProgress(0);
    for (let i = 0; i < LOADING_MSGS.length; i++) {
      setLoadMsg(LOADING_MSGS[i]);
      setProgress(Math.round(((i + 1) / LOADING_MSGS.length) * 100));
      await sleep(500 + Math.random() * 300);
    }
    // Return mock variations filtered by selected ad (or use first 2 if none)
    const matching = mockVariations.filter(v => v.originalAdId === selectedAd.id);
    const toShow = matching.length > 0 ? matching.slice(0, count) : mockVariations.slice(0, count);
    setResults(toShow.map(v => ({ ...v, status: 'pending' })));
    setStep('results');
  };

  const approve = (id: string) => {
    setApprovedIds(s => new Set([...s, id]));
    setRejectedIds(s => { const n = new Set(s); n.delete(id); return n; });
  };
  const reject = (id: string) => {
    setRejectedIds(s => new Set([...s, id]));
    setApprovedIds(s => { const n = new Set(s); n.delete(id); return n; });
  };

  const getStatus = (id: string): AdVariation['status'] => {
    if (approvedIds.has(id)) return 'approved';
    if (rejectedIds.has(id)) return 'rejected';
    return 'pending';
  };

  return (
    <AppLayout>
      <Header
        title="Variation Generator"
        subtitle="AI-powered ad copy and creative variations"
        onRefresh={() => { setStep('config'); setResults([]); setApprovedIds(new Set()); setRejectedIds(new Set()); }}
      />

      <div className="flex-1 p-8 space-y-8">

        {/* ── Config ── */}
        {(step === 'config' || step === 'results') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Source ad */}
            <div className="rounded-2xl p-6 space-y-4"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold text-white">Source Ad</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {mockAds.filter(a => a.aiScore !== undefined || a.status === 'active').map(ad => (
                  <button key={ad.id} onClick={() => setSelectedAd(ad)}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border',
                      selectedAd.id === ad.id ? 'border-emerald-500/30' : 'border-transparent hover:bg-white/5')}
                    style={selectedAd.id === ad.id ? { background: 'rgba(16,185,129,0.08)' } : {}}>
                    <div className="relative w-10 h-9 rounded-lg overflow-hidden shrink-0">
                      <Image src={ad.imageUrl} alt={ad.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{ad.name}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">{ad.platform} · Score: {ad.aiScore ?? '—'}</p>
                    </div>
                    {selectedAd.id === ad.id && <Check size={12} className="text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Config options */}
            <div className="rounded-2xl p-6 space-y-5"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold text-white">Generation Settings</h2>

              {/* Mode */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">What to generate</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'copy', label: 'Copy', icon: <FileText size={13} /> },
                    { id: 'visual', label: 'Visual', icon: <ImageIcon size={13} /> },
                    { id: 'both', label: 'Both', icon: <Sparkles size={13} /> },
                  ] as const).map(({ id, label, icon }) => (
                    <button key={id} onClick={() => setMode(id)}
                      className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all border',
                        mode === id ? 'text-white border-emerald-500/30' : 'text-zinc-500 border-white/5 hover:border-white/10')}
                      style={mode === id ? { background: 'rgba(16,185,129,0.12)' } : {}}>
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">Number of variations: <span className="text-white font-bold">{count}</span></p>
                <input type="range" min={1} max={4} value={count} onChange={e => setCount(+e.target.value)}
                  className="w-full accent-emerald-500" />
                <div className="flex justify-between text-[10px] text-zinc-700 mt-1">
                  <span>1</span><span>2</span><span>3</span><span>4</span>
                </div>
              </div>

              {/* Model */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">AI Model</p>
                <div className="space-y-1.5">
                  {(['claude-3-5-sonnet', 'claude-opus-4', 'gpt-4o'] as AIModel[]).map(m => (
                    <button key={m} onClick={() => setModel(m)}
                      className={cn('w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all border',
                        model === m ? 'text-emerald-300 border-emerald-500/25' : 'text-zinc-500 border-white/5 hover:text-zinc-300')}
                      style={model === m ? { background: 'rgba(16,185,129,0.08)' } : {}}>
                      <span>{m}</span>
                      {model === m && <Check size={11} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview + Generate CTA */}
            <div className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="relative h-36">
                <Image src={selectedAd.imageUrl} alt={selectedAd.name} fill className="object-cover opacity-70" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.1),rgba(8,8,15,0.95))' }} />
              </div>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <p className="text-sm font-bold text-white leading-snug">{selectedAd.headline}</p>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{selectedAd.description}</p>

                <div className="flex gap-2 mt-auto">
                  <Badge variant="emerald">{mode} generation</Badge>
                  <Badge variant="zinc">{count} variant{count > 1 ? 's' : ''}</Badge>
                </div>

                <button onClick={generate} disabled={false}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
                  <Wand2 size={16} />
                  Generate Variations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Generating ── */}
        {step === 'generating' && (
          <div className="rounded-2xl p-10 text-center space-y-6 fade-in-up"
            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}>
              <Sparkles size={24} className="text-white animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-bold text-white mb-2">Creating your variations</p>
              <p className="text-sm text-zinc-400">{loadMsg}<span className="cursor-blink">_</span></p>
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <ProgressBar value={progress} color="#10B981" height={6} />
              <p className="text-xs text-zinc-600">{progress}% complete</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {step === 'results' && results.length > 0 && (
          <div className="space-y-5 fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">{results.length} Variations Generated</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Based on {selectedAd.name} · Review and approve to test</p>
              </div>
              <button onClick={generate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <RefreshCw size={14} />
                Regenerate
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((v, i) => (
                <VariationCard
                  key={v.id}
                  variation={{ ...v, status: getStatus(v.id) }}
                  onApprove={approve}
                  onReject={reject}
                  delay={i * 80}
                />
              ))}
            </div>

            {approvedIds.size > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-2xl fade-in-up"
                style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <Check size={18} className="text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{approvedIds.size} variation{approvedIds.size > 1 ? 's' : ''} approved</p>
                  <p className="text-xs text-zinc-500">Ready to export to your ad platform or launch A/B test</p>
                </div>
                <button className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
                  Export <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── All library variations ── */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            Variation Library
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockVariations.map((v, i) => (
              <VariationCard key={v.id} variation={v} delay={i * 60} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
