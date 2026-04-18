'use client';

import Image from 'next/image';
import { Sparkles, TrendingUp, Check, X, Clock, TestTube } from 'lucide-react';
import type { AdVariation } from '@/lib/types';
import { formatPercent, formatMultiplier, formatRelativeTime } from '@/lib/utils';

interface VariationCardProps {
  variation: AdVariation;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  delay?: number;
}

const STATUS_STYLES = {
  pending:  { label: 'Pending Review', icon: Clock,    color: 'text-amber-400',   cssColor: '#FBBF24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.2)'   },
  testing:  { label: 'A/B Testing',   icon: TestTube, color: 'text-blue-400',    cssColor: '#60A5FA', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.2)'   },
  approved: { label: 'Approved',      icon: Check,    color: 'text-emerald-400', cssColor: '#34D399', bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.2)'   },
  rejected: { label: 'Rejected',      icon: X,        color: 'text-rose-400',    cssColor: '#FB7185', bg: 'rgba(251,113,133,0.08)',  border: 'rgba(251,113,133,0.2)'  },
};

const MODEL_LABELS: Record<string, string> = {
  'claude-3-5-sonnet': 'Claude 3.5',
  'claude-opus-4': 'Claude Opus 4',
  'gpt-4o': 'GPT-4o',
  'gemini-1.5-pro': 'Gemini 1.5',
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  copy: 'Copy only', visual: 'Visual only', both: 'Copy + Visual', cta: 'CTA only',
};

export default function VariationCard({ variation, onApprove, onReject, delay = 0 }: VariationCardProps) {
  const st = STATUS_STYLES[variation.status];
  const Icon = st.icon;

  return (
    <div
      className="rounded-2xl overflow-hidden fade-in-up transition-all duration-200 hover:scale-[1.01] hover:border-white/10"
      style={{
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.06)',
        animationDelay: `${delay}ms`,
      }}>
      {/* Image preview */}
      <div className="relative h-36 overflow-hidden">
        <Image src={variation.imageUrl} alt={variation.headline} fill className="object-cover opacity-60" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.3) 0%,rgba(8,8,15,0.9) 100%)' }} />
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.3)', color: '#6EE7B7' }}>
            <Sparkles size={11} />
            AI Generated
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.cssColor }}>
            <Icon size={11} />
            {st.label}
          </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-sm font-bold text-white line-clamp-1">{variation.headline}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{variation.description}</p>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6EE7B7' }}>
            {variation.cta}
          </span>
          <span className="text-[10px] text-zinc-600">{CHANGE_TYPE_LABELS[variation.changeType]}</span>
        </div>

        {/* Predictions */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <p className="text-[10px] text-zinc-600 mb-0.5">Pred. CTR</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={11} className="text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">{formatPercent(variation.predictedCTR)}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 mb-0.5">Pred. ROAS</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={11} className="text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">{formatMultiplier(variation.predictedROAS)}</span>
            </div>
          </div>
        </div>

        {/* Rationale */}
        <div className="p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
          <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{variation.rationale}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-[10px] text-zinc-600">
          <span>{MODEL_LABELS[variation.model] ?? variation.model}</span>
          <span>{formatRelativeTime(variation.createdAt)}</span>
        </div>

        {/* Actions */}
        {variation.status === 'pending' && (onApprove || onReject) && (
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
