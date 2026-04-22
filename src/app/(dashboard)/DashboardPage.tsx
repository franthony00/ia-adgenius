'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, MousePointer, Users, Lightbulb, BarChart3,
  Sparkles, ArrowRight, Star, Activity,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/ui/MetricCard';
import MiniChart from '@/components/ui/MiniChart';
import Badge from '@/components/ui/Badge';
import { mockDashboardStats, mockAds, mockAnalyses, mockHistory } from '@/lib/mock-data';
import {
  formatCurrency, formatNumber, formatPercent, formatMultiplier,
  formatRelativeTime, getStatusColor, getPlatformColor, getPlatformLabel,
} from '@/lib/utils';

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const stats = mockDashboardStats;
  const topAds = mockAds.filter(a => a.status === 'active').slice(0, 4);
  const recentHistory = mockHistory.slice(0, 5);
  const latestAnalysis = mockAnalyses[0];

  return (
    <AppLayout>
      <Header
        title="Dashboard"
        subtitle="Performance overview — last 7 days"
        onRefresh={() => setRefreshKey(k => k + 1)}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">

        {/* ── Hero KPI strip ── */}
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

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
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

          {/* Quick stats */}
          <div className="rounded-2xl p-6 fade-in-up space-y-4"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', animationDelay: '100ms' }}>
            <h2 className="text-sm font-semibold text-white">Platform Mix</h2>
            {[
              { platform: 'facebook', spend: 23000, pct: 34 },
              { platform: 'instagram', spend: 18900, pct: 27 },
              { platform: 'tiktok', spend: 14200, pct: 21 },
              { platform: 'google', spend: 7800, pct: 12 },
              { platform: 'linkedin', spend: 4500, pct: 6 },
            ].map(({ platform, spend, pct }) => (
              <div key={platform}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-300 capitalize font-medium">{getPlatformLabel(platform as never)}</span>
                  <span className="text-zinc-500">{formatCurrency(spend, true)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: getPlatformColor(platform as never) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Ads + AI Feed ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Top performing ads */}
          <div className="lg:col-span-2 rounded-2xl p-6 fade-in-up"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Top Active Ads</h2>
              <Link href="/library" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {topAds.map((ad, i) => (
                <Link key={ad.id} href={`/ads/${ad.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 cursor-pointer">
                    <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0">
                      <Image src={ad.imageUrl} alt={ad.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{ad.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{ad.campaign}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400">{formatMultiplier(ad.metrics.roas)}</p>
                        <p className="text-[10px] text-zinc-600">ROAS</p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-xs font-bold text-white">{formatPercent(ad.metrics.ctr)}</p>
                        <p className="text-[10px] text-zinc-600">CTR</p>
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
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="rounded-2xl p-6 fade-in-up"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', animationDelay: '80ms' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
              <Link href="/history" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                History <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {recentHistory.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: entry.type === 'analysis' ? 'rgba(16,185,129,0.1)' : entry.type === 'variation' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)' }}>
                    {entry.type === 'analysis' ? <BarChart3 size={11} className="text-emerald-400" />
                     : entry.type === 'variation' ? <Sparkles size={11} className="text-emerald-400" />
                     : <Activity size={11} className="text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium line-clamp-1">{entry.title}</p>
                    <p className="text-[10px] text-zinc-500 line-clamp-1">{entry.description}</p>
                    <p className="text-[10px] text-zinc-700 mt-0.5">{formatRelativeTime(entry.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── AI Insight banner ── */}
        {latestAnalysis && (
          <div className="rounded-2xl p-4 sm:p-6 fade-in-up"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                <Lightbulb size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white">Latest AI Insight</h3>
                  <Badge variant="emerald">Score: {latestAnalysis.overallScore}/100</Badge>
                  <span className="text-xs text-zinc-600">{latestAnalysis.adName}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {latestAnalysis.strengths[0]}
                </p>
                <p className="text-xs text-zinc-600 mt-1.5">Top recommendation: {latestAnalysis.recommendations[0]}</p>
              </div>
              <Link href="/analysis"
                className="self-start sm:self-auto shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                View Full Analysis <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Summary row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          {[
            { label: 'Conversions',     value: formatNumber(stats.totalConversions),          icon: <Users size={14} />,    color: '#10B981' },
            { label: 'Impressions',     value: formatNumber(stats.totalImpressions, true),    icon: <Activity size={14} />, color: '#22D3EE' },
            { label: 'AI Analyses Run', value: String(stats.analysesRun),                    icon: <BarChart3 size={14} />, color: '#34D399' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="rounded-2xl p-5 flex items-center gap-4 fade-in-up"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${color}18`, color }}>
                {icon}
              </div>
              <div>
                <p className="text-lg font-bold text-white tabular-nums">{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
