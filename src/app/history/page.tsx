'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3, Sparkles, Activity, Plus, ArrowRight, Clock,
  TrendingUp, Lightbulb, Filter,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import { mockHistory, mockAnalyses, mockVariations } from '@/lib/mock-data';
import { formatRelativeTime, formatDate, cn } from '@/lib/utils';
import type { HistoryEntry } from '@/lib/types';

type FilterType = 'all' | 'analysis' | 'variation' | 'ad_added' | 'metric_update';

const TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; badge: 'emerald' | 'cyan' | 'amber' | 'zinc' }> = {
  analysis:      { icon: <BarChart3 size={13} />,  label: 'AI Analysis',  color: '#34D399', bg: 'rgba(52,211,153,0.08)',  badge: 'emerald' },
  variation:     { icon: <Sparkles size={13} />,   label: 'Variation',    color: '#22D3EE', bg: 'rgba(34,211,238,0.08)',  badge: 'cyan'    },
  ad_added:      { icon: <Plus size={13} />,       label: 'Ad Added',     color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', badge: 'amber'   },
  metric_update: { icon: <Activity size={13} />,   label: 'Metrics Sync', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)',badge: 'zinc'    },
};

export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = mockHistory.filter(h => filter === 'all' || h.type === filter);

  const grouped: Record<string, HistoryEntry[]> = {};
  filtered.forEach(h => {
    const d = new Date(h.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(h);
  });

  const SUMMARY = [
    { label: 'Total Analyses',        value: mockAnalyses.length,                                  icon: <BarChart3 size={16} />,  color: '#10B981', border: 'rgba(16,185,129,0.2)',  link: '/analysis'  },
    { label: 'Variations Generated',  value: mockVariations.length,                                icon: <Sparkles size={16} />,   color: '#22D3EE', border: 'rgba(34,211,238,0.2)',  link: '/generator' },
    { label: 'Approved Variations',   value: mockVariations.filter(v => v.status === 'approved').length, icon: <TrendingUp size={16} />, color: '#34D399', border: 'rgba(52,211,153,0.2)',  link: '/generator' },
    { label: 'Active Tests',          value: mockVariations.filter(v => v.status === 'testing').length,  icon: <Lightbulb size={16} />,  color: '#FBBF24', border: 'rgba(251,191,36,0.2)', link: '/generator' },
  ];

  return (
    <AppLayout>
      <Header title="History" subtitle="Complete record of analyses, variations, and ad changes" onRefresh={() => {}} />

      <div className="flex-1 p-8 space-y-8">

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SUMMARY.map(({ label, value, icon, color, border, link }) => (
            <Link key={label} href={link}>
              <div className="rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 fade-in-up"
                style={{ background: '#111827', border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-500">{label}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}18`, color }}>
                    {icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-zinc-600" />
          {(['all', 'analysis', 'variation', 'ad_added', 'metric_update'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize',
                filter === f ? 'text-white' : 'text-zinc-500 hover:text-zinc-300')}
              style={filter === f
                ? { background: 'linear-gradient(135deg,#10B981,#059669)' }
                : { background: 'rgba(255,255,255,0.04)' }}>
              {f === 'all' ? 'All Events' : f === 'ad_added' ? 'Ads Added' : f === 'metric_update' ? 'Metrics' : f === 'analysis' ? 'Analyses' : 'Variations'}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                  <Clock size={11} />
                  {date}
                </div>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <Badge variant="zinc">{entries.length}</Badge>
              </div>

              <div className="space-y-3">
                {entries.map((entry, i) => {
                  const meta = TYPE_META[entry.type];
                  return (
                    <div key={entry.id}
                      className="flex gap-4 p-4 rounded-2xl transition-all hover:bg-white/[0.03] cursor-pointer fade-in-up"
                      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', animationDelay: `${i * 50}ms` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: meta.bg, color: meta.color }}>
                        {meta.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-semibold text-white">{entry.title}</p>
                              <Badge variant={meta.badge}>{meta.label}</Badge>
                              {entry.score !== undefined && (
                                <span className="text-xs font-bold text-amber-400">Score: {entry.score}</span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400">{entry.description}</p>
                            {entry.relatedAdName && (
                              <p className="text-[10px] text-zinc-600 mt-0.5">Ad: {entry.relatedAdName}</p>
                            )}
                            {entry.model && (
                              <p className="text-[10px] text-zinc-600">Model: {entry.model}</p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] text-zinc-600">{formatRelativeTime(entry.createdAt)}</p>
                            {entry.relatedAdId && (
                              <Link href={`/ads/${entry.relatedAdId}`}
                                className="text-[10px] text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5 mt-1 justify-end"
                                onClick={e => e.stopPropagation()}>
                                View <ArrowRight size={9} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
              style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
              <Clock size={32} className="text-zinc-700 mb-4" />
              <p className="text-zinc-400 font-medium">No events match this filter</p>
            </div>
          )}
        </div>

        {/* Analyses breakdown */}
        <div className="rounded-2xl p-6 space-y-4"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-white">Analysis History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Ad', 'Model', 'Score', 'Copy', 'Visual', 'Audience', 'Pred. ROAS', 'Date'].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 text-zinc-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockAnalyses.map(a => (
                  <tr key={a.id} className="border-b border-white/[0.03]">
                    <td className="py-3 pr-4">
                      <p className="text-white font-medium truncate max-w-32">{a.adName}</p>
                    </td>
                    <td className="py-3 pr-4 text-zinc-500">{a.model}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('font-bold', a.overallScore >= 85 ? 'text-emerald-400' : a.overallScore >= 70 ? 'text-amber-400' : 'text-rose-400')}>
                        {a.overallScore}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-emerald-300">{a.copyScore}</td>
                    <td className="py-3 pr-4 text-emerald-300">{a.visualScore}</td>
                    <td className="py-3 pr-4 text-emerald-300">{a.audienceScore}</td>
                    <td className="py-3 pr-4 text-emerald-400 font-bold">{a.estimatedROAS}x</td>
                    <td className="py-3 pr-4 text-zinc-600">{formatDate(a.createdAt)}</td>
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
