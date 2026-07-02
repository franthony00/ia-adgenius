'use client';

import SafeAdImage from '@/components/ui/SafeAdImage';
import {
  Sparkles, Check, X, Clock, TestTube,
  BookmarkCheck, Zap, GitBranch, BarChart2, Info,
} from 'lucide-react';
import type { AdVariation } from '@/lib/types';
import { formatPercent, formatMultiplier, formatRelativeTime } from '@/lib/utils';

interface VariationCardProps {
  variation: AdVariation;
  // Legacy (variation library)
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  // New A/B actions
  onUse?: (id: string) => void;
  onSaveDraft?: (id: string) => void;
  onMarkABTest?: (id: string) => void;
  onCompare?: (id: string) => void;
  isComparing?: boolean;
  delay?: number;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:  { label: 'Pending Review', Icon: Clock,         cssColor: '#FBBF24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.25)'   },
  testing:  { label: 'A/B Testing',   Icon: TestTube,       cssColor: '#60A5FA', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.25)'   },
  approved: { label: 'Using',         Icon: Check,          cssColor: '#34D399', bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.25)'   },
  draft:    { label: 'Draft Saved',   Icon: BookmarkCheck,  cssColor: '#A78BFA', bg: 'rgba(167,139,250,0.08)',  border: 'rgba(167,139,250,0.25)'  },
  rejected: { label: 'Rejected',      Icon: X,              cssColor: '#FB7185', bg: 'rgba(251,113,133,0.08)',  border: 'rgba(251,113,133,0.25)'  },
};

// ─── Angle badge colors ───────────────────────────────────────────────────────
const ANGLE_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  'Emocional':          { text: '#FB7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)' },
  'Directa':            { text: '#34D399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)'  },
  'Urgencia':           { text: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)'  },
  'Oferta':             { text: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)'  },
  'Autoridad':          { text: '#C4B5FD', bg: 'rgba(196,181,253,0.12)', border: 'rgba(196,181,253,0.25)' },
  'Problema/Solución':  { text: '#F97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.25)'  },
  'Curiosidad':         { text: '#22D3EE', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.25)'  },
  'Social Proof':       { text: '#A3E635', bg: 'rgba(163,230,53,0.12)',  border: 'rgba(163,230,53,0.25)'  },
  'UGC':                { text: '#FCD34D', bg: 'rgba(252,211,77,0.12)',  border: 'rgba(252,211,77,0.25)'  },
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  copy: 'Copy only', visual: 'Visual only', both: 'Copy + Visual', cta: 'CTA only',
};

const MODEL_LABELS: Record<string, string> = {
  'claude-3-5-sonnet': 'Claude 3.5',
  'claude-opus-4':     'Opus 4',
  'gpt-4o':            'GPT-4o',
  'gemini-1.5-pro':    'Gemini 1.5',
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'FB', instagram: 'IG', tiktok: 'TT', google: 'GG', linkedin: 'LI',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function VariationCard({
  variation,
  onApprove, onReject,
  onUse, onSaveDraft, onMarkABTest, onCompare,
  isComparing = false,
  delay = 0,
}: VariationCardProps) {
  const st       = STATUS_STYLES[variation.status] ?? STATUS_STYLES.pending;
  const StIcon   = st.Icon;
  const angle    = variation.angle ? ANGLE_COLOR[variation.angle] : null;
  const hasNew   = Boolean(onUse || onSaveDraft || onMarkABTest || onCompare);
  const hasLegacy = !hasNew && variation.status === 'pending' && (onApprove || onReject);

  const isUsed     = variation.status === 'approved';
  const isDraft    = variation.status === 'draft';
  const isTesting  = variation.status === 'testing';

  return (
    <div
      className="rounded-2xl overflow-hidden fade-in-up transition-all duration-200"
      style={{
        background: '#111827',
        border: isComparing
          ? '1px solid rgba(34,211,238,0.4)'
          : '1px solid rgba(255,255,255,0.06)',
        animationDelay: `${delay}ms`,
        boxShadow: isComparing ? '0 0 0 1px rgba(34,211,238,0.2)' : undefined,
      }}>

      {/* ── Image ── */}
      <div className="relative h-36 overflow-hidden">
        <SafeAdImage src={variation.imageUrl} alt={variation.headline} fill className="object-cover opacity-60" />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.25) 0%,rgba(8,8,15,0.92) 100%)' }} />

        {/* AI Generated badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold"
            style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.3)', color: '#6EE7B7' }}>
            <Sparkles size={10} />AI Generated
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium"
            style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.cssColor }}>
            <StIcon size={10} />{st.label}
          </div>
        </div>

        {/* Angle badge (bottom-left) */}
        {angle && variation.angle && (
          <div className="absolute bottom-9 left-3">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: angle.bg, border: `1px solid ${angle.border}`, color: angle.text }}>
              {variation.angle}
            </span>
          </div>
        )}

        {/* Headline */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-sm font-bold text-white line-clamp-1 leading-tight">
            {variation.headline}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 space-y-3">

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{variation.description}</p>

        {/* CTA + Platform + Type row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6EE7B7' }}>
            {variation.cta}
          </span>
          {variation.recommendedPlatform && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold text-zinc-400"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {PLATFORM_LABELS[variation.recommendedPlatform] ?? variation.recommendedPlatform}
            </span>
          )}
          <span className="text-[10px] text-zinc-600 ml-auto">
            {CHANGE_TYPE_LABELS[variation.changeType]}
          </span>
        </div>

        {/* Metrics grid — 3 cols */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Est. CTR',  value: formatPercent(variation.predictedCTR),                             color: '#10B981' },
            { label: 'Est. CPC',  value: variation.predictedCPC != null ? `$${variation.predictedCPC.toFixed(2)}` : '—', color: '#22D3EE' },
            { label: 'Est. ROAS', value: formatMultiplier(variation.predictedROAS),                         color: '#818CF8' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-2 rounded-xl text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[9px] text-zinc-600 mb-0.5">{label}</p>
              <p className="text-sm font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="flex items-center gap-1">
          <Info size={9} className="text-zinc-700 shrink-0" />
          <p className="text-[9px] text-zinc-700">
            Proyección estimada · Basado en datos disponibles · No garantizado
          </p>
        </div>

        {/* Confidence bar */}
        {variation.confidence != null && (
          <div>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-zinc-600">Confianza estimada</span>
              <span className={`font-semibold ${
                variation.confidence >= 85 ? 'text-emerald-400' :
                variation.confidence >= 70 ? 'text-amber-400' : 'text-zinc-500'
              }`}>{variation.confidence}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${variation.confidence}%`,
                  background: variation.confidence >= 85
                    ? 'linear-gradient(90deg,#059669,#10B981)'
                    : variation.confidence >= 70
                      ? 'linear-gradient(90deg,#D97706,#FBBF24)'
                      : '#6B7280',
                }} />
            </div>
          </div>
        )}

        {/* Rationale */}
        <div className="px-3 py-2 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
          <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{variation.rationale}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-[10px] text-zinc-600">
          <span>{MODEL_LABELS[variation.model] ?? variation.model}</span>
          <span>{formatRelativeTime(variation.createdAt)}</span>
        </div>

        {/* ── NEW 4-button set ── */}
        {hasNew && (
          <div className="space-y-2 pt-1">
            {/* Primary: Use Variation */}
            {!isUsed ? (
              <button
                onClick={() => onUse?.(variation.id)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.2)' }}>
                <Zap size={12} />Use Variation
              </button>
            ) : (
              <div className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34D399' }}>
                <Check size={12} />Using this variation
              </div>
            )}

            {/* Secondary row */}
            <div className="grid grid-cols-3 gap-1.5">
              {/* Save Draft */}
              <button
                onClick={() => onSaveDraft?.(variation.id)}
                disabled={isUsed}
                className="py-2 rounded-xl text-[10px] font-semibold transition-all hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                style={{
                  background: isDraft ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.04)',
                  border: isDraft ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color: isDraft ? '#C4B5FD' : '#9CA3AF',
                }}>
                <BookmarkCheck size={10} />
                {isDraft ? 'Drafted' : 'Draft'}
              </button>

              {/* Mark A/B Test */}
              <button
                onClick={() => onMarkABTest?.(variation.id)}
                disabled={isUsed}
                className="py-2 rounded-xl text-[10px] font-semibold transition-all hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                style={{
                  background: isTesting ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.04)',
                  border: isTesting ? '1px solid rgba(96,165,250,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color: isTesting ? '#93C5FD' : '#9CA3AF',
                }}>
                <GitBranch size={10} />
                {isTesting ? 'In A/B' : 'A/B Test'}
              </button>

              {/* Compare */}
              <button
                onClick={() => onCompare?.(variation.id)}
                className="py-2 rounded-xl text-[10px] font-semibold transition-all hover:bg-white/[0.06] flex items-center justify-center gap-1"
                style={{
                  background: isComparing ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                  border: isComparing ? '1px solid rgba(34,211,238,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  color: isComparing ? '#22D3EE' : '#9CA3AF',
                }}>
                <BarChart2 size={10} />
                {isComparing ? 'Added' : 'Compare'}
              </button>
            </div>
          </div>
        )}

        {/* ── Legacy approve/reject (variation library) ── */}
        {hasLegacy && (
          <div className="flex gap-2 pt-1">
            {onReject && (
              <button onClick={() => onReject(variation.id)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                Reject
              </button>
            )}
            {onApprove && (
              <button onClick={() => onApprove(variation.id)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 2px 10px rgba(16,185,129,0.2)' }}>
                Approve
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
