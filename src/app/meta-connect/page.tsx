'use client';

import { useState, useEffect, useRef } from 'react';
import {
  RefreshCw, CheckCircle, XCircle, AlertTriangle, ArrowRight,
  BarChart3, Zap, Clock, TrendingUp, TrendingDown,
  ExternalLink, Download, ChevronRight, Info,
  Globe, Layers, X, Link2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import {
  mockPlatformAccounts, mockImportedCampaigns,
  mockSyncHistory, mockPlatformRecommendations,
} from '@/lib/mock-data';
import { formatCurrency, formatPercent, formatMultiplier, sleep } from '@/lib/utils';
import type { ImportedCampaign } from '@/lib/types';
import { usePlan } from '@/hooks/usePlan';

interface MetaStatus {
  connected: boolean;
  ad_account_id?: string;
  meta_user_id?: string;
  expires_at?: string;
  days_remaining?: number;
  connected_since?: string;
}

interface SyncResult {
  adsImported: number;
  campaignsImported: number;
}

// ─── Platform brand config ────────────────────────────────────────────────────
const META_COLOR   = '#1877F2';
const GOOGLE_COLOR = '#EA4335';

function MetaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const REC_TYPE_META: Record<string, { label: string; color: string; bg: string; borderC: string }> = {
  scale:         { label: 'Scale',         color: '#10B981', bg: 'rgba(16,185,129,0.1)',  borderC: 'rgba(16,185,129,0.25)' },
  pause:         { label: 'Pause',         color: '#F87171', bg: 'rgba(248,113,113,0.1)', borderC: 'rgba(248,113,113,0.25)' },
  budget_shift:  { label: 'Budget Shift',  color: '#22D3EE', bg: 'rgba(34,211,238,0.1)',  borderC: 'rgba(34,211,238,0.25)' },
  audience:      { label: 'Audience',      color: '#818CF8', bg: 'rgba(129,140,248,0.1)', borderC: 'rgba(129,140,248,0.25)' },
  creative:      { label: 'Creative',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  borderC: 'rgba(245,158,11,0.25)' },
};

const IMPACT_COLOR: Record<string, string> = {
  high: 'text-rose-400', medium: 'text-amber-400', low: 'text-zinc-500',
};

function roasDelta(real: number, est: number) {
  return ((real - est) / est) * 100;
}

function BudgetBar({ spend, total }: { spend: number; total: number }) {
  const pct = Math.min((spend / total) * 100, 100);
  const color = pct >= 90 ? '#F87171' : pct >= 70 ? '#FBBF24' : '#10B981';
  return (
    <div className="h-1 rounded-full overflow-hidden w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── Campaign row ─────────────────────────────────────────────────────────────
function CampaignRow({ campaign }: { campaign: ImportedCampaign }) {
  const delta   = roasDelta(campaign.roas, campaign.estimatedROAS);
  const isUp    = delta >= 0;
  const budgetPct = Math.round((campaign.spend / campaign.totalBudget) * 100);

  return (
    <div className="p-4 rounded-xl transition-all hover:bg-white/[0.03]"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">

        {/* Name + meta */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(24,119,242,0.12)', color: META_COLOR }}>
            <MetaIcon size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-semibold text-white truncate">{campaign.name}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                campaign.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
              }`} style={{
                background: campaign.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                border: campaign.status === 'active' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)',
              }}>
                {campaign.status === 'active' ? '● Active' : '⏸ Paused'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {campaign.objective} · {campaign.adsCount} ads · {budgetPct}% budget used
            </p>
          </div>
        </div>

        {/* Budget bar */}
        <div className="sm:w-28 shrink-0">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-zinc-400 font-medium">{formatCurrency(campaign.spend, true)}</span>
            <span className="text-zinc-600">/ {formatCurrency(campaign.totalBudget, true)}</span>
          </div>
          <BudgetBar spend={campaign.spend} total={campaign.totalBudget} />
        </div>

        {/* ROAS vs Est */}
        <div className="sm:w-36 shrink-0 flex items-center gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-zinc-600 mb-0.5">Real vs Est. ROAS</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-400">{formatMultiplier(campaign.roas)}</span>
              <span className="text-[10px] text-zinc-600">vs {formatMultiplier(campaign.estimatedROAS)}</span>
              <span className={`text-[10px] font-bold ml-auto ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? '+' : ''}{delta.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* CTR + CPC */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-white">{formatPercent(campaign.ctr)}</p>
            <p className="text-[10px] text-zinc-600">CTR</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-zinc-300">${campaign.cpc.toFixed(2)}</p>
            <p className="text-[10px] text-zinc-600">CPC</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-zinc-300">{campaign.conversions.toLocaleString()}</p>
            <p className="text-[10px] text-zinc-600">Conv.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ExternalLink size={9} />View
          </button>
          <button className="px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:opacity-90"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6EE7B7' }}>
            Import Ads
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Campaigns modal ──────────────────────────────────────────────────────────
function CampaignsModal({ campaigns, onClose }: { campaigns: ImportedCampaign[]; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden fade-in-up pointer-events-auto"
        style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: `linear-gradient(135deg,${META_COLOR},#0C54C2)` }}>
              <MetaIcon size={14} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Meta Campaigns</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{campaigns.length} imported campaigns · Mock data</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0" style={{ background: '#0F1724' }}>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Campaign', 'Status', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC', 'ROAS', 'Est. ROAS', 'Delta', 'Conv.', 'Updated'].map(h => (
                  <th key={h} className="text-left text-zinc-600 font-semibold py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => {
                const delta = ((c.roas - c.estimatedROAS) / c.estimatedROAS) * 100;
                const isUp  = delta >= 0;
                return (
                  <tr key={c.id}
                    className="transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white whitespace-nowrap">{c.name}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{c.objective} · {c.adsCount} ads</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        c.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                      }`} style={{
                        background: c.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      }}>
                        {c.status === 'active' ? '● Active' : '⏸ Paused'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-200 font-medium whitespace-nowrap">{formatCurrency(c.spend, true)}</td>
                    <td className="py-3.5 px-4 text-zinc-400">{(c.impressions / 1000).toFixed(0)}K</td>
                    <td className="py-3.5 px-4 text-zinc-400">{c.clicks.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-cyan-300 font-semibold">{formatPercent(c.ctr)}</td>
                    <td className="py-3.5 px-4 text-zinc-300">${c.cpc.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">{formatMultiplier(c.roas)}</td>
                    <td className="py-3.5 px-4 text-indigo-400">{formatMultiplier(c.estimatedROAS)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{delta.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">{c.conversions.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-zinc-600 whitespace-nowrap">
                      {new Date(c.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1.5">
            <Info size={10} className="text-zinc-700" />
            <p className="text-[10px] text-zinc-700">Mock data · No real API connection</p>
          </div>
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
            Close
          </button>
        </div>
      </div>
      </div>
    </>
  );
}

// ─── Google toast ──────────────────────────────────────────────────────────────
function GoogleComingSoonToast({ onClose }: { onClose: () => void }) {
  // Stable ref so the effect never re-runs when the parent re-renders
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const t = setTimeout(() => onCloseRef.current(), 3500);
    return () => clearTimeout(t);
  }, []); // intentionally empty — timer fires once on mount, cleans up on unmount

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl fade-in-up"
      style={{ background: '#111827', border: '1px solid rgba(234,67,53,0.3)', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(234,67,53,0.12)', border: '1px solid rgba(234,67,53,0.2)' }}>
        <GoogleIcon size={16} />
      </div>
      <div>
        <p className="text-xs font-bold text-white">Google Ads integration is coming soon</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">Launching Q3 2026 · OAuth flow in development</p>
      </div>
      <button onClick={onClose} className="ml-1 text-zinc-600 hover:text-zinc-400 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Upgrade wall ─────────────────────────────────────────────────────────────
function UpgradeWall() {
  return (
    <div className="rounded-2xl p-8 text-center space-y-4 fade-in-up"
      style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.18)' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
        style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-bold text-white mb-1">Performance Plan Required</p>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
          Meta Ads and Google Ads connections are available on the <span className="text-amber-400 font-semibold">Performance plan</span> ($149/mo) and higher.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
        <a href="#billing"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}>
          Upgrade to Performance
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-settings', { detail: 'billing' }))}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          View Plans
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdPlatformsPage() {
  const { features, loading: planLoading } = usePlan();
  const canConnectMeta = !planLoading && features.meta_connect;

  const [metaSyncing, setMetaSyncing]         = useState(false);
  const [metaSyncDone, setMetaSyncDone]       = useState(false);
  const [metaSyncResult, setMetaSyncResult]   = useState<SyncResult | null>(null);
  const [metaSyncError, setMetaSyncError]     = useState<string | null>(null);
  const [showCampaigns, setShowCampaigns]     = useState(false);
  const [showGoogleToast, setShowGoogleToast] = useState(false);
  const [metaStatus, setMetaStatus]           = useState<MetaStatus | null>(null);
  const [statusLoading, setStatusLoading]     = useState(true);

  const metaAccount   = mockPlatformAccounts.find(a => a.platform === 'meta')!;
  const googleAccount = mockPlatformAccounts.find(a => a.platform === 'google')!;
  const metaCampaigns = mockImportedCampaigns.filter(c => c.platform === 'meta');

  // Derived KPIs
  const totalSpend       = metaCampaigns.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = metaCampaigns.reduce((s, c) => s + c.impressions, 0);
  const totalConversions = metaCampaigns.reduce((s, c) => s + c.conversions, 0);
  const activeCampaigns  = metaCampaigns.filter(c => c.status === 'active');
  const avgROAS          = activeCampaigns.length > 0
    ? activeCampaigns.reduce((s, c) => s + c.roas, 0) / activeCampaigns.length
    : 0;

  // Fetch real Meta connection status on mount
  useEffect(() => {
    fetch('/api/meta/status')
      .then(r => r.json())
      .then((data: MetaStatus) => setMetaStatus(data))
      .catch(() => setMetaStatus({ connected: false }))
      .finally(() => setStatusLoading(false));
  }, []);

  const handleMetaSync = async () => {
    setMetaSyncing(true);
    setMetaSyncDone(false);
    setMetaSyncError(null);
    setMetaSyncResult(null);
    try {
      const res = await fetch('/api/meta/sync', { method: 'POST' });
      const data = await res.json() as { adsImported?: number; campaignsImported?: number; error?: string };
      if (!res.ok) {
        setMetaSyncError(data.error ?? 'Sync failed');
      } else {
        setMetaSyncResult({
          adsImported: data.adsImported ?? 0,
          campaignsImported: data.campaignsImported ?? 0,
        });
        setMetaSyncDone(true);
      }
    } catch {
      setMetaSyncError('Network error — could not reach sync endpoint');
    } finally {
      setMetaSyncing(false);
    }
  };

  // Whether Meta is really connected (not just mock)
  const isReallyConnected = !statusLoading && metaStatus?.connected === true;

  const formatSyncDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  return (
    <AppLayout>
      <Header
        title="Ad Platforms"
        subtitle="Connect and sync your advertising accounts"
        action={
          isReallyConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400">Meta Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] font-semibold text-amber-400">Demo Mode</span>
            </div>
          )
        }
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">

        {/* ── Platform status cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Meta Ads card */}
          <div className="rounded-2xl p-6 fade-in-up"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{ background: `linear-gradient(135deg,${META_COLOR},#0C54C2)` }}>
                  <MetaIcon size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Meta Ads</p>
                    {statusLoading ? (
                      <span className="text-[10px] text-zinc-600 animate-pulse">Checking…</span>
                    ) : isReallyConnected ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34D399' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-zinc-500"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Facebook · Instagram · Audience Network</p>
                </div>
              </div>
              <Badge variant={isReallyConnected ? 'emerald' : 'zinc'}>{isReallyConnected ? 'Live' : 'Demo'}</Badge>
            </div>

            {/* Plan gate — upgrade wall */}
            {!planLoading && !canConnectMeta && (
              <div className="mb-5"><UpgradeWall /></div>
            )}

            {/* Not connected — prompt to connect (only if plan allows) */}
            {!statusLoading && !isReallyConnected && canConnectMeta && (
              <div className="mb-5 p-4 rounded-xl"
                style={{ background: 'rgba(24,119,242,0.06)', border: '1px solid rgba(24,119,242,0.2)' }}>
                <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                  Connect your Meta Ads account to import real campaigns and sync live performance data.
                </p>
                <a
                  href="/api/meta/oauth/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: `linear-gradient(135deg,${META_COLOR},#0C54C2)`, boxShadow: '0 4px 12px rgba(24,119,242,0.3)' }}>
                  <Link2 size={12} />Connect Meta Ads Account
                </a>
              </div>
            )}

            {/* Account info — show real data when connected, mock otherwise */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {(isReallyConnected ? [
                { label: 'Account ID',     value: metaStatus!.ad_account_id ?? '—' },
                { label: 'Meta User ID',   value: metaStatus!.meta_user_id ?? '—' },
                { label: 'Connected Since',value: metaStatus!.connected_since ? formatSyncDate(metaStatus!.connected_since) : '—' },
                { label: 'Token Expires',  value: metaStatus!.expires_at ? `${formatSyncDate(metaStatus!.expires_at)} (${metaStatus!.days_remaining}d)` : '—' },
              ] : [
                { label: 'Account ID',     value: metaAccount.accountId },
                { label: 'Currency',       value: `${metaAccount.currency} · ${metaAccount.timezone.split('/')[1]}` },
                { label: 'Connected Since',value: formatSyncDate(metaAccount.connectedSince!) },
                { label: 'Token Expires',  value: `${formatSyncDate(metaAccount.tokenExpiresAt!)} (${metaAccount.daysUntilExpiry}d)` },
              ]).map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-[10px] text-zinc-600 mb-0.5">{label}</p>
                  <p className="text-xs font-medium text-zinc-200 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mb-5 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="text-center flex-1">
                <p className="text-sm font-bold text-white">{metaAccount.campaignsImported}</p>
                <p className="text-[10px] text-zinc-600">Campaigns</p>
              </div>
              <div className="h-6 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="text-center flex-1">
                <p className="text-sm font-bold text-white">{metaAccount.adsImported}</p>
                <p className="text-[10px] text-zinc-600">Ads Imported</p>
              </div>
              <div className="h-6 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="text-center flex-1">
                <p className="text-sm font-bold text-emerald-400">{formatMultiplier(avgROAS)}</p>
                <p className="text-[10px] text-zinc-600">Avg ROAS</p>
              </div>
              <div className="h-6 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-xs font-bold text-zinc-300">
                    {formatSyncDate(metaAccount.lastSync!)}
                  </p>
                </div>
                <p className="text-[10px] text-zinc-600">Last Sync</p>
              </div>
            </div>

            {/* Sync feedback */}
            {metaSyncDone && metaSyncResult && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-3 fade-in-up"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-300">
                  {metaSyncResult.adsImported} ads · {metaSyncResult.campaignsImported} campaigns synced successfully
                </p>
              </div>
            )}
            {metaSyncError && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-3 fade-in-up"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <XCircle size={13} className="text-rose-400 shrink-0" />
                <p className="text-xs text-rose-300">{metaSyncError}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {isReallyConnected ? (
                <button onClick={handleMetaSync} disabled={metaSyncing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                  {metaSyncing
                    ? <><RefreshCw size={13} className="animate-spin" />Syncing…</>
                    : <><Zap size={13} />Sync Meta Campaigns</>}
                </button>
              ) : (
                <button onClick={handleMetaSync} disabled={metaSyncing || statusLoading}
                  title="Connect Meta account first to enable real sync"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-zinc-400 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {metaSyncing
                    ? <><RefreshCw size={13} className="animate-spin" />Syncing…</>
                    : <><Zap size={13} />Sync Meta Campaigns</>}
                </button>
              )}
              <button
                onClick={() => setShowCampaigns(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <BarChart3 size={12} />View Campaigns
              </button>
            </div>
          </div>

          {/* Google Ads card */}
          <div className="rounded-2xl p-6 fade-in-up"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', animationDelay: '80ms' }}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)' }}>
                  <GoogleIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Google Ads</p>
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-zinc-500"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      Not Connected
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Search · Shopping · Display · YouTube</p>
                </div>
              </div>
              <Badge variant="amber">Coming Soon</Badge>
            </div>

            {/* Feature list */}
            <div className="space-y-2 mb-5">
              <p className="text-xs text-zinc-500 mb-3">
                Connect Google Ads to import campaigns and compare real performance against AI projections.
              </p>
              {[
                'Import Search, Shopping, Display & YouTube campaigns',
                'Compare estimated ROAS vs real Google Ads data',
                'Cross-platform budget recommendations',
                'Unified dashboard — Meta + Google in one view',
                'Automatic weekly sync',
              ].map(feat => (
                <div key={feat} className="flex items-center gap-2 text-xs text-zinc-500">
                  <ChevronRight size={11} className="text-zinc-700 shrink-0" />
                  {feat}
                </div>
              ))}
            </div>

            {/* Placeholder stats */}
            <div className="grid grid-cols-3 gap-2 mb-5 opacity-40">
              {[
                { label: 'Campaigns', value: '—' },
                { label: 'Ads', value: '—' },
                { label: 'Avg ROAS', value: '—' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="text-sm font-bold text-zinc-600">{value}</p>
                  <p className="text-[10px] text-zinc-700">{label}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowGoogleToast(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-300 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <GoogleIcon size={13} />Connect Google Ads
                <span className="ml-1 text-[9px] font-semibold text-amber-500 px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(245,158,11,0.1)' }}>Soon</span>
              </button>
              <button
                onClick={() => setShowGoogleToast(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <BarChart3 size={12} />Sync
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI strip (Meta data) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <MetricCard label="Total Spend (Meta)" value={formatCurrency(totalSpend, true)}
            subValue="last 30 days" trend={8.4} accent="cyan"
            icon={<Layers size={15} />} delay={0} />
          <MetricCard label="Impressions" value={`${(totalImpressions / 1000).toFixed(0)}K`}
            trend={12.1} accent="emerald"
            icon={<Globe size={15} />} delay={60} />
          <MetricCard label="Conversions" value={totalConversions.toLocaleString()}
            trend={6.3} accent="amber"
            icon={<TrendingUp size={15} />} delay={120} />
          <MetricCard label="Avg. ROAS (Meta)" value={formatMultiplier(avgROAS)}
            subValue="active campaigns" trend={4.1} accent="blue"
            icon={<BarChart3 size={15} />} delay={180} />
        </div>

        {/* ── Meta Campaigns ── */}
        <div className="rounded-2xl p-6 fade-in-up"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center text-white"
                  style={{ background: META_COLOR }}>
                  <MetaIcon size={11} />
                </div>
                <h2 className="text-sm font-semibold text-white">Meta Campaigns</h2>
                <Badge variant="emerald">{metaCampaigns.filter(c => c.status === 'active').length} active</Badge>
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                {isReallyConnected ? 'Live data from Meta Business' : 'Mock data · Connect Meta to see real campaigns'} · Last sync {formatSyncDate(mockPlatformAccounts[0].lastSync!)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleMetaSync} disabled={metaSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <RefreshCw size={11} className={metaSyncing ? 'animate-spin' : ''} />
                {metaSyncing ? 'Syncing…' : 'Sync Now'}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6EE7B7' }}>
                <Download size={11} />Import Ads
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {metaCampaigns.map(campaign => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>

        {/* ── Projection vs Reality ── */}
        <div className="rounded-2xl p-6 fade-in-up"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Projected vs Real Performance</h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                AI estimations generated before each campaign launch · Basado en datos disponibles
              </p>
            </div>
            <Badge variant="cyan">ROAS comparison</Badge>
          </div>

          <div className="space-y-4">
            {metaCampaigns.map(campaign => {
              const delta = roasDelta(campaign.roas, campaign.estimatedROAS);
              const isUp  = delta >= 0;
              const maxROAS = Math.max(campaign.roas, campaign.estimatedROAS) * 1.2;

              return (
                <div key={campaign.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        campaign.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                      }`} style={{
                        background: campaign.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      }}>
                        {campaign.status === 'active' ? '●' : '⏸'}
                      </span>
                      <p className="text-xs font-semibold text-white">{campaign.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
                        {isUp ? '+' : ''}{delta.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-zinc-600">vs projection</span>
                    </div>
                  </div>

                  {/* Estimated bar */}
                  <div className="grid grid-cols-[60px_1fr_40px] items-center gap-2">
                    <span className="text-[10px] text-zinc-600 text-right">Est.</span>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${(campaign.estimatedROAS / maxROAS) * 100}%`,
                          background: 'rgba(129,140,248,0.5)',
                        }} />
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-400">{formatMultiplier(campaign.estimatedROAS)}</span>
                  </div>

                  {/* Real bar */}
                  <div className="grid grid-cols-[60px_1fr_40px] items-center gap-2">
                    <span className="text-[10px] text-zinc-600 text-right">Real</span>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(campaign.roas / maxROAS) * 100}%`,
                          background: isUp
                            ? 'linear-gradient(90deg,#059669,#10B981)'
                            : 'linear-gradient(90deg,#BE185D,#F87171)',
                        }} />
                    </div>
                    <span className={`text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatMultiplier(campaign.roas)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-1.5 mt-5 pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Info size={10} className="text-zinc-700 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-700 leading-relaxed">
              Proyección estimada generada antes del lanzamiento de cada campaña · Los resultados reales pueden variar · No se garantizan ROAS específicos
            </p>
          </div>
        </div>

        {/* ── Google Ads — blurred preview ── */}
        <div className="rounded-2xl overflow-hidden fade-in-up"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-6 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <GoogleIcon size={16} />
              <h2 className="text-sm font-semibold text-white">Google Ads</h2>
              <Badge variant="amber">Not Connected</Badge>
            </div>
            <p className="text-xs text-zinc-600">Connect Google Ads to unlock this view and get cross-platform insights.</p>
          </div>

          {/* Blurred rows */}
          <div className="relative px-6 pb-6">
            <div className="space-y-2 select-none" style={{ filter: 'blur(4px)', opacity: 0.4, pointerEvents: 'none' }}>
              {[
                { name: 'Brand Search — Exact Match',   obj: 'Search', spend: 8200,  roas: 7.8 },
                { name: 'Product Shopping Feed',         obj: 'Shopping', spend: 14600, roas: 6.2 },
                { name: 'Display Remarketing',           obj: 'Display', spend: 4100,  roas: 4.9 },
              ].map(row => (
                <div key={row.name} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg" style={{ background: 'rgba(234,67,53,0.15)' }} />
                    <div>
                      <p className="text-xs font-semibold text-white">{row.name}</p>
                      <p className="text-[10px] text-zinc-600">{row.obj}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">{formatCurrency(row.spend, true)}</p>
                      <p className="text-[10px] text-zinc-600">Spend</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">{formatMultiplier(row.roas)}</p>
                      <p className="text-[10px] text-zinc-600">ROAS</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(17,24,39,0.9) 40%)' }}>
              <div className="mt-12 flex flex-col items-center gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)' }}>
                  <GoogleIcon size={22} />
                </div>
                <p className="text-sm font-semibold text-white">Connect Google Ads to unlock</p>
                <p className="text-xs text-zinc-500 max-w-xs">
                  See real Google Ads data alongside Meta campaigns. Compare cross-platform ROAS and get unified recommendations.
                </p>
                <button
                  onClick={() => setShowGoogleToast(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-zinc-200 transition-colors mt-1"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <GoogleIcon size={14} />
                  Connect Google Ads
                  <span className="text-[10px] font-semibold text-amber-400 ml-1">Coming Soon</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Platform Recommendations ── */}
        <div className="rounded-2xl p-6 fade-in-up"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Platform Recommendations</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Recomendación sugerida · Basado en datos de campañas importadas</p>
            </div>
            <Badge variant="emerald">{mockPlatformRecommendations.length} insights</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mockPlatformRecommendations.map(rec => {
              const tm      = REC_TYPE_META[rec.type];
              const isGoog  = rec.platform === 'google';
              return (
                <div key={rec.id}
                  className={`p-4 rounded-xl ${isGoog ? 'opacity-60' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: isGoog ? 'rgba(234,67,53,0.1)' : tm.bg, border: `1px solid ${isGoog ? 'rgba(234,67,53,0.2)' : tm.borderC}` }}>
                        {isGoog ? <GoogleIcon size={12} /> : (
                          <span className="text-[10px] font-bold" style={{ color: tm.color }}>
                            {rec.type === 'scale' ? '↑' : rec.type === 'pause' ? '⏸' : rec.type === 'budget_shift' ? '⇄' : rec.type === 'creative' ? '✦' : '◎'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white leading-tight">{rec.title}</p>
                        {rec.campaignName && (
                          <p className="text-[10px] text-zinc-600 mt-0.5">{rec.campaignName}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${IMPACT_COLOR[rec.impact]}`}
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">{rec.description}</p>

                  {rec.confidence > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-600">Confianza estimada</span>
                        <span className="text-zinc-400 font-semibold">{rec.confidence}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full"
                          style={{
                            width: `${rec.confidence}%`,
                            background: isGoog ? '#EA4335' : tm.color,
                          }} />
                      </div>
                    </div>
                  )}

                  {isGoog && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-amber-400 font-semibold">↳ Requires Google Ads connection</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-1.5 mt-4 pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Info size={10} className="text-zinc-700 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-700 leading-relaxed">
              Proyección estimada · No se garantizan resultados específicos · Recomendaciones basadas en datos disponibles de campañas importadas
            </p>
          </div>
        </div>

        {/* ── Sync History ── */}
        <div className="rounded-2xl p-6 fade-in-up"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-white mb-5">Sync History</h2>
          <div className="space-y-3 relative">
            {/* Vertical line */}
            <div className="absolute left-3.5 top-4 bottom-4 w-px"
              style={{ background: 'rgba(255,255,255,0.06)' }} />

            {mockSyncHistory.map(event => {
              const ok = event.status === 'success';
              return (
                <div key={event.id} className="flex gap-4 pl-0.5">
                  {/* Status dot */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{
                      background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,133,0.12)',
                      border: ok ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(248,113,133,0.3)',
                    }}>
                    {ok
                      ? <CheckCircle size={11} className="text-emerald-400" />
                      : <XCircle    size={11} className="text-rose-400"    />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded flex items-center justify-center text-white"
                          style={{ background: event.platform === 'meta' ? META_COLOR : GOOGLE_COLOR }}>
                          {event.platform === 'meta' ? <MetaIcon size={9} /> : <GoogleIcon size={9} />}
                        </div>
                        <p className="text-xs font-semibold text-white capitalize">
                          {event.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                          {ok
                            ? ` — ${event.adsImported} ads · ${event.campaignsImported} campaigns synced`
                            : ' — Sync failed'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={9} className="text-zinc-700" />
                        <span className="text-[10px] text-zinc-600">{formatSyncDate(event.startedAt)}</span>
                        {event.finishedAt && (
                          <span className="text-[10px] text-zinc-700">
                            · {Math.round((new Date(event.finishedAt).getTime() - new Date(event.startedAt).getTime()) / 1000)}s
                          </span>
                        )}
                      </div>
                    </div>
                    {event.note && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <AlertTriangle size={9} className="text-amber-500 shrink-0" />
                        <p className="text-[10px] text-amber-500/80">{event.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── More platforms coming ── */}
        <div className="rounded-2xl p-6 fade-in-up"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={14} className="text-zinc-500" />
            <h2 className="text-sm font-semibold text-white">Integrations Roadmap</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { name: 'TikTok Ads',    color: '#010101', accent: '#FE2C55', label: 'TT', status: 'Q3 2026' },
              { name: 'LinkedIn Ads',  color: '#0A66C2', accent: '#0A66C2', label: 'in', status: 'Q3 2026' },
              { name: 'Pinterest Ads', color: '#E60023', accent: '#E60023', label: 'P',  status: 'Q4 2026' },
              { name: 'Snapchat Ads',  color: '#FFFC00', accent: '#FFFC00', label: 'S',  status: 'Q4 2026' },
              { name: 'X Ads',         color: '#14171A', accent: '#FFFFFF', label: 'X',  status: 'Planned'  },
            ].map(pl => (
              <div key={pl.name} className="flex flex-col items-center gap-2 p-3 rounded-xl text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: `${pl.accent}18`, color: pl.accent, border: `1px solid ${pl.accent}25` }}>
                  {pl.label}
                </div>
                <p className="text-xs font-medium text-zinc-300">{pl.name}</p>
                <span className="text-[9px] font-semibold text-zinc-600">{pl.status}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Info size={9} className="text-zinc-700" />
            <p className="text-[10px] text-zinc-700">
              Architecture prepared for real OAuth + API integration. No credentials stored in frontend.
            </p>
          </div>
        </div>

      </div>

      {/* ── Modals / toasts ── */}
      {showCampaigns  && <CampaignsModal campaigns={metaCampaigns} onClose={() => setShowCampaigns(false)} />}
      {showGoogleToast && <GoogleComingSoonToast onClose={() => setShowGoogleToast(false)} />}
    </AppLayout>
  );
}
