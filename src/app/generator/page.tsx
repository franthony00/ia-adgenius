'use client';

import { useState, useRef, useEffect } from 'react';
import SafeAdImage from '@/components/ui/SafeAdImage';
import {
  Sparkles, Wand2, RefreshCw, Check, ChevronRight,
  ImageIcon, FileText, Zap, BarChart2,
  X, TrendingUp, Info,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import VariationCard from '@/components/ai/VariationCard';
import { mockAds, mockVariations } from '@/lib/mock-data';
import { cn, sleep, formatPercent, formatMultiplier } from '@/lib/utils';
import { usePlan } from '@/hooks/usePlan';
import type { Ad, AIModel, AdVariation } from '@/lib/types';

type GenerateMode = 'copy' | 'visual' | 'both';
type Step = 'config' | 'generating' | 'results';

const LOADING_MSGS = [
  'Reading original ad patterns...',
  'Analysing top-performing elements...',
  'Applying persuasion frameworks...',
  'Crafting headline variations...',
  'Optimising CTAs...',
  'Building image prompts...',
  'Scoring variations...',
  'Finalising output...',
];

// ─────────────────────────────────────────────────────────────────────────────

export default function GeneratorPage() {
  const [ads, setAds]                 = useState<Ad[]>(mockAds);
  const [selectedAd, setSelectedAd]   = useState<Ad>(mockAds[0]);

  useEffect(() => {
    fetch('/api/ads')
      .then(r => r.json())
      .then(data => {
        const loaded = data.ads ?? mockAds;
        setAds(loaded);
        if (loaded.length > 0) setSelectedAd(loaded[0]);
      })
      .catch(() => { /* keep mock defaults */ });
  }, []);

  const [mode, setMode]               = useState<GenerateMode>('both');
  const [model, setModel]             = useState<AIModel>('claude-3-5-sonnet');
  const [count, setCount]             = useState(2);
  const [step, setStep]               = useState<Step>('config');
  const [progress, setProgress]       = useState(0);
  const [loadMsg, setLoadMsg]         = useState('');
  const [results, setResults]         = useState<AdVariation[]>([]);

  // Per-variation action state
  const [usedIds, setUsedIds]         = useState<Set<string>>(new Set());
  const [draftIds, setDraftIds]       = useState<Set<string>>(new Set());
  const [abTestIds, setAbTestIds]     = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds]   = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  // localId → DB id (populated after bulk save succeeds)
  const [dbIdMap, setDbIdMap]         = useState<Record<string, string>>({});
  const [savedVariations, setSavedVariations] = useState<AdVariation[]>(mockVariations);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/variations')
      .then(r => r.json())
      .then(data => { if (data.variations) setSavedVariations(data.variations); })
      .catch(() => { /* keep mock defaults */ });
  }, []);

  const { variationLimit, planId, loading: planLoading } = usePlan();
  const runIdRef = useRef(0);

  // Clamp count when plan resolves to a lower limit
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!planLoading && count > variationLimit) setCount(variationLimit);
  }, [planLoading, variationLimit, count]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const resetResults = () => {
    setResults([]);
    setUsedIds(new Set());
    setDraftIds(new Set());
    setAbTestIds(new Set());
    setCompareIds(new Set());
    setShowCompare(false);
  };

  const selectAd = (ad: Ad) => {
    runIdRef.current++;
    setSelectedAd(ad);
    setStep('config');
    resetResults();
  };

  const getStatus = (id: string): AdVariation['status'] => {
    if (usedIds.has(id))   return 'approved';
    if (abTestIds.has(id)) return 'testing';
    if (draftIds.has(id))  return 'draft';
    return 'pending';
  };

  // ── Actions ───────────────────────────────────────────────────────────────────
  const patchVariation = (localId: string, status: string) => {
    const dbId = dbIdMap[localId];
    if (!dbId) return;
    fetch(`/api/variations/${dbId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    }).catch(() => { /* optimistic — ignore errors */ });
  };

  const handleUse = (id: string) => {
    setUsedIds(s => new Set([...s, id]));
    setDraftIds(s => { const n = new Set(s); n.delete(id); return n; });
    setAbTestIds(s => { const n = new Set(s); n.delete(id); return n; });
    patchVariation(id, 'approved');
  };

  const handleSaveDraft = (id: string) => {
    if (usedIds.has(id)) return;
    setDraftIds(s => {
      const n   = new Set(s);
      const add = !n.has(id);
      if (add) n.add(id); else n.delete(id);
      patchVariation(id, add ? 'draft' : 'pending');
      return n;
    });
  };

  const handleMarkABTest = (id: string) => {
    if (usedIds.has(id)) return;
    setAbTestIds(s => new Set([...s, id]));
    setDraftIds(s => { const n = new Set(s); n.delete(id); return n; });
    patchVariation(id, 'testing');
  };

  const handleCompare = (id: string) => {
    setCompareIds(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // ── Generate ──────────────────────────────────────────────────────────────────
  const generate = async () => {
    const runId      = ++runIdRef.current;
    const adSnapshot = selectedAd;

    resetResults();
    setDbIdMap({});
    setGenerateError(null);
    setStep('generating');
    setProgress(0);
    setLoadMsg(LOADING_MSGS[0]);

    // Animate progress messages while the API call runs in parallel
    let msgIdx = 0;
    const ticker = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, LOADING_MSGS.length - 1);
      setLoadMsg(LOADING_MSGS[msgIdx]);
      setProgress(Math.round(((msgIdx + 1) / LOADING_MSGS.length) * 90));
    }, 600);

    try {
      const res = await fetch('/api/variations/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ adId: adSnapshot.id, mode, count, model }),
      });

      clearInterval(ticker);
      if (runId !== runIdRef.current) return;

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }));
        setGenerateError(err.error ?? 'Generation failed');
        setStep('config');
        return;
      }

      const data = await res.json();
      const variations: AdVariation[] = data.variations ?? [];

      setProgress(100);
      setLoadMsg('Done!');
      await sleep(300);

      if (runId !== runIdRef.current) return;
      setResults(variations);
      setStep('results');

      // Persist to DB in background (best-effort)
      fetch('/api/variations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ originalAdId: adSnapshot.id, variations }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(saved => {
          if (!saved?.variations || runId !== runIdRef.current) return;
          const map: Record<string, string> = {};
          (saved.variations as AdVariation[]).forEach((dbV, i) => {
            map[variations[i].id] = dbV.id;
          });
          setDbIdMap(map);
          return fetch('/api/variations').then(r => r.json());
        })
        .then(lib => {
          if (lib?.variations) setSavedVariations(lib.variations);
        })
        .catch(() => { /* silent — local state is still correct */ });
    } catch (err) {
      clearInterval(ticker);
      if (runId === runIdRef.current) {
        setGenerateError(err instanceof Error ? err.message : 'Generation failed');
        setStep('config');
      }
    }
  };

  // ── Compare data ──────────────────────────────────────────────────────────────
  const compareVariations = results.filter(v => compareIds.has(v.id));

  return (
    <AppLayout>
      <Header
        title="Variation Generator"
        subtitle="AI-powered A/B variations with projections"
        onRefresh={() => { runIdRef.current++; setStep('config'); resetResults(); }}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">

        {/* ── Config panel ── */}
        {(step === 'config' || step === 'results') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Source ad selector */}
            <div className="rounded-2xl p-6 space-y-4"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold text-white">Source Ad</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {ads.map(ad => (
                  <button key={ad.id} onClick={() => selectAd(ad)}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border',
                      selectedAd.id === ad.id ? 'border-emerald-500/30' : 'border-transparent hover:bg-white/5')}
                    style={selectedAd.id === ad.id ? { background: 'rgba(16,185,129,0.08)' } : {}}>
                    <div className="relative w-10 h-9 rounded-lg overflow-hidden shrink-0">
                      <SafeAdImage src={ad.imageUrl} alt={ad.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{ad.name}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">
                        {ad.platform} · {ad.status === 'draft' ? 'Draft' : `Score: ${ad.aiScore ?? '—'}`}
                      </p>
                    </div>
                    {selectedAd.id === ad.id && <Check size={12} className="text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Generation settings */}
            <div className="rounded-2xl p-6 space-y-5"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold text-white">Generation Settings</h2>

              {/* Mode */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">What to generate</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'copy',   label: 'Copy',   icon: <FileText  size={13} /> },
                    { id: 'visual', label: 'Visual', icon: <ImageIcon size={13} /> },
                    { id: 'both',   label: 'Both',   icon: <Sparkles  size={13} /> },
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
                <p className="text-xs text-zinc-500 mb-2">
                  Variations: <span className="text-white font-bold">{count}</span>
                </p>
                <input type="range" min={1} max={variationLimit} value={count}
                  onChange={e => setCount(+e.target.value)}
                  className="w-full accent-emerald-500" />
                <div className="flex justify-between text-[10px] text-zinc-700 mt-1">
                  {Array.from({ length: variationLimit }, (_, i) => i + 1).map(n => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
                {!planLoading && variationLimit < 4 && (
                  <p className="text-[10px] text-amber-600 mt-1.5">
                    {planId === 'starter' ? 'Pro plan unlocks 2 variations · ' : ''}
                    Performance plan unlocks up to 4
                  </p>
                )}
              </div>

              {/* Model */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">AI Model</p>
                <div className="space-y-1.5">
                  {(['claude-3-5-sonnet','claude-opus-4','gpt-4o','gemini-1.5-pro'] as AIModel[]).map(m => (
                    <button key={m} onClick={() => setModel(m)}
                      className={cn('w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all border',
                        model === m ? 'text-emerald-300 border-emerald-500/25' : 'text-zinc-500 border-white/5 hover:text-zinc-300')}
                      style={model === m ? { background: 'rgba(16,185,129,0.08)' } : {}}>
                      <span>{{
                        'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
                        'claude-opus-4':     'Claude Opus 4',
                        'gpt-4o':            'GPT-4o',
                        'gemini-1.5-pro':    'Gemini 1.5 Pro',
                      }[m]}</span>
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
                <SafeAdImage src={selectedAd.imageUrl} alt={selectedAd.name} fill className="object-cover opacity-70" />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.1),rgba(8,8,15,0.95))' }} />
              </div>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <p className="text-sm font-bold text-white leading-snug">{selectedAd.headline}</p>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{selectedAd.description}</p>

                <div className="flex gap-2 mt-auto flex-wrap">
                  <Badge variant="emerald">{mode} generation</Badge>
                  <Badge variant="zinc">{count} variant{count > 1 ? 's' : ''}</Badge>
                  <Badge variant="zinc">{selectedAd.platform}</Badge>
                </div>

                {generateError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-red-300"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <X size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <span>{generateError}</span>
                  </div>
                )}

                <button onClick={generate}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
                  <Wand2 size={16} />Generate Variations
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
              <p className="text-lg font-bold text-white mb-1">Creating variations for {selectedAd.name}</p>
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

            {/* Results header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">{results.length} Variations Generated</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedAd.name} · {mode} mode ·{' '}
                  {usedIds.size > 0 && <span className="text-emerald-400">{usedIds.size} using </span>}
                  {abTestIds.size > 0 && <span className="text-blue-400">{abTestIds.size} in A/B </span>}
                  {draftIds.size > 0 && <span className="text-violet-400">{draftIds.size} drafted </span>}
                  {usedIds.size === 0 && abTestIds.size === 0 && draftIds.size === 0 && 'Review and act on each variation'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {compareIds.size >= 2 && (
                  <button
                    onClick={() => setShowCompare(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: showCompare ? 'rgba(34,211,238,0.15)' : 'rgba(34,211,238,0.08)',
                      border: '1px solid rgba(34,211,238,0.3)',
                      color: '#22D3EE',
                    }}>
                    <BarChart2 size={13} />
                    Compare {compareIds.size}
                  </button>
                )}
                <button onClick={generate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <RefreshCw size={13} />Regenerate
                </button>
              </div>
            </div>

            {/* Compare panel */}
            {showCompare && compareVariations.length >= 2 && (
              <div className="rounded-2xl p-5 fade-in-up"
                style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={14} className="text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">Comparison View</h3>
                    <Badge variant="cyan">Proyección estimada</Badge>
                  </div>
                  <button onClick={() => setShowCompare(false)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <td className="text-zinc-600 pb-3 pr-4 w-28">Métrica</td>
                        {compareVariations.map((v, i) => (
                          <td key={v.id} className="pb-3 pr-4 min-w-[140px]">
                            <p className="text-white font-semibold line-clamp-1">{v.headline}</p>
                            <p className="text-zinc-600 text-[10px] mt-0.5">Variación {i + 1}</p>
                          </td>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {[
                        {
                          label: 'Ángulo',
                          render: (v: AdVariation) => v.angle ?? '—',
                          color: () => '#9CA3AF',
                        },
                        {
                          label: 'Plataforma',
                          render: (v: AdVariation) => v.recommendedPlatform ?? '—',
                          color: () => '#9CA3AF',
                        },
                        {
                          label: 'CTA',
                          render: (v: AdVariation) => v.cta,
                          color: () => '#6EE7B7',
                        },
                        {
                          label: 'Est. CTR',
                          render: (v: AdVariation) => formatPercent(v.predictedCTR),
                          color: (v: AdVariation) => {
                            const max = Math.max(...compareVariations.map(x => x.predictedCTR));
                            return v.predictedCTR === max ? '#10B981' : '#9CA3AF';
                          },
                        },
                        {
                          label: 'Est. CPC',
                          render: (v: AdVariation) => v.predictedCPC != null ? `$${v.predictedCPC.toFixed(2)}` : '—',
                          color: (v: AdVariation) => {
                            const min = Math.min(...compareVariations.map(x => x.predictedCPC ?? 99));
                            return v.predictedCPC === min ? '#10B981' : '#9CA3AF';
                          },
                        },
                        {
                          label: 'Est. ROAS',
                          render: (v: AdVariation) => formatMultiplier(v.predictedROAS),
                          color: (v: AdVariation) => {
                            const max = Math.max(...compareVariations.map(x => x.predictedROAS));
                            return v.predictedROAS === max ? '#10B981' : '#9CA3AF';
                          },
                        },
                        {
                          label: 'Confianza',
                          render: (v: AdVariation) => v.confidence != null ? `${v.confidence}%` : '—',
                          color: (v: AdVariation) => {
                            const max = Math.max(...compareVariations.map(x => x.confidence ?? 0));
                            return v.confidence === max ? '#10B981' : '#9CA3AF';
                          },
                        },
                        {
                          label: 'Tipo',
                          render: (v: AdVariation) => ({ copy: 'Copy only', visual: 'Visual only', both: 'Copy + Visual', cta: 'CTA only' }[v.changeType]),
                          color: () => '#9CA3AF',
                        },
                      ].map(row => (
                        <tr key={row.label}>
                          <td className="py-2.5 pr-4 text-zinc-600 font-medium">{row.label}</td>
                          {compareVariations.map(v => (
                            <td key={v.id} className="py-2.5 pr-4 font-semibold capitalize"
                              style={{ color: row.color(v) }}>
                              {row.render(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <Info size={9} className="text-zinc-700 shrink-0" />
                  <p className="text-[9px] text-zinc-700">
                    Proyección estimada · Basado en datos disponibles · Los resultados reales pueden variar
                  </p>
                </div>
              </div>
            )}

            {/* Variations grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((v, i) => (
                <VariationCard
                  key={v.id}
                  variation={{ ...v, status: getStatus(v.id) }}
                  onUse={handleUse}
                  onSaveDraft={handleSaveDraft}
                  onMarkABTest={handleMarkABTest}
                  onCompare={handleCompare}
                  isComparing={compareIds.has(v.id)}
                  delay={i * 80}
                />
              ))}
            </div>

            {/* Action summary banner */}
            {(usedIds.size > 0 || abTestIds.size > 0) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl fade-in-up"
                style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <TrendingUp size={15} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {usedIds.size > 0 && `${usedIds.size} variation${usedIds.size > 1 ? 's' : ''} ready to use`}
                      {usedIds.size > 0 && abTestIds.size > 0 && ' · '}
                      {abTestIds.size > 0 && `${abTestIds.size} in A/B testing`}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Proyección estimada basada en datos disponibles · No garantizado
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const selected = results.filter(v => usedIds.has(v.id) || abTestIds.has(v.id));
                    const data = selected.map(v => ({
                      id: v.id, headline: v.headline, description: v.description,
                      cta: v.cta, angle: v.angle, platform: v.recommendedPlatform,
                      predictedCTR: v.predictedCTR, predictedCPC: v.predictedCPC,
                      predictedROAS: v.predictedROAS, confidence: v.confidence,
                      status: usedIds.has(v.id) ? 'approved' : 'testing',
                      changeType: v.changeType, rationale: v.rationale,
                    }));
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href     = url;
                    a.download = `adgenius-variations-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
                  Export Selected <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Variation Library ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              Variation Library
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="zinc">{savedVariations.length} saved</Badge>
              <span className="text-xs text-zinc-600">
                {savedVariations.filter(v => v.status === 'testing').length} in A/B ·{' '}
                {savedVariations.filter(v => v.status === 'approved').length} approved
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {savedVariations.map((v, i) => (
              <VariationCard key={v.id} variation={v} delay={i * 60} />
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
