'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, XCircle, RefreshCw, AlertTriangle,
  ArrowLeft, Zap, Clock, BarChart3,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

interface StatusData {
  connected: boolean;
  ad_account_id?: string;
  meta_user_id?: string;
  expires_at?: string;
  days_remaining?: number;
  connected_since?: string;
  reason?: string;
}

interface SyncData {
  connected: boolean;
  last_sync?: {
    status: string;
    ads_synced: number;
    error_message: string | null;
    started_at: string;
    finished_at: string | null;
  } | null;
}

export default function MetaConnectPage() {
  const searchParams  = useSearchParams();
  const successParam  = searchParams.get('success');
  const errorParam    = searchParams.get('error');

  const [status,   setStatus]   = useState<StatusData | null>(null);
  const [syncInfo, setSyncInfo] = useState<SyncData | null>(null);
  const [syncing,  setSyncing]  = useState(false);
  const [syncResult, setSyncResult] = useState<{ ads_synced?: number; error?: string } | null>(null);
  const [loading,  setLoading]  = useState(true);

  const fetchStatus = async () => {
    try {
      const [s, sy] = await Promise.all([
        fetch('/api/meta/status').then(r => r.json()),
        fetch('/api/meta/sync').then(r => r.json()),
      ]);
      setStatus(s);
      setSyncInfo(sy);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, [successParam]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res  = await fetch('/api/meta/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) setSyncResult({ error: data.error });
      else         setSyncResult({ ads_synced: data.ads_synced });
      await fetchStatus();
    } catch (e) {
      setSyncResult({ error: 'Network error' });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <AppLayout>
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-8 py-4"
        style={{ background: 'rgba(11,11,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/" className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 pl-10 lg:pl-0">
          <h1 className="text-base font-bold text-white">Meta Marketing Integration</h1>
          <p className="text-xs text-zinc-500">Connect your Facebook Ads account to sync Instagram campaigns</p>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-2xl space-y-5 lg:space-y-6">

        {/* ── Flash messages ── */}
        {successParam && (
          <div className="flex items-center gap-3 p-4 rounded-2xl fade-in-up"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300 font-medium">Account connected successfully! Run your first sync below.</p>
          </div>
        )}
        {errorParam && (
          <div className="flex items-center gap-3 p-4 rounded-2xl fade-in-up"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <XCircle size={18} className="text-rose-400 shrink-0" />
            <p className="text-sm text-rose-300 font-medium">{decodeURIComponent(errorParam)}</p>
          </div>
        )}

        {/* ── Connection status card ── */}
        <div className="rounded-2xl p-6 space-y-5"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-semibold text-white">Connection Status</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <RefreshCw size={14} className="animate-spin" /> Checking status...
            </div>
          ) : status?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-300">Connected</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Ad Account',      value: status.ad_account_id   ?? '—' },
                  { label: 'Meta User ID',    value: status.meta_user_id    ?? '—' },
                  { label: 'Connected Since', value: formatDate(status.connected_since) },
                  { label: 'Token Expires',   value: status.expires_at ? `${formatDate(status.expires_at)} (${status.days_remaining}d left)` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-zinc-600 mb-1">{label}</p>
                    <p className="text-zinc-200 font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Token expiry warning */}
              {status.days_remaining !== undefined && status.days_remaining <= 10 && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300">Token expires in {status.days_remaining} days. Reconnect soon to avoid interruption.</p>
                </div>
              )}

              <a href="/api/meta/oauth/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <RefreshCw size={12} /> Reconnect / Refresh Token
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                <span className="text-sm text-zinc-400">{status?.reason ?? 'Not connected'}</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Connect your Meta Business account to start syncing Instagram and Facebook ad data.
                You'll need <span className="text-zinc-300">ads_read</span> and <span className="text-zinc-300">read_insights</span> permissions.
              </p>
              <a href="/api/meta/oauth/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#1877F2,#0C54C2)', boxShadow: '0 4px 14px rgba(24,119,242,0.3)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Connect with Facebook
              </a>
            </div>
          )}
        </div>

        {/* ── Sync card (only if connected) ── */}
        {status?.connected && (
          <div className="rounded-2xl p-6 space-y-4"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Sync Ads</h2>
              {syncInfo?.last_sync && (
                <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                  <Clock size={10} /> Last sync: {formatDate(syncInfo.last_sync.started_at)}
                </span>
              )}
            </div>

            {syncInfo?.last_sync && (
              <div className="flex items-center gap-3 p-3 rounded-xl text-xs"
                style={{
                  background: syncInfo.last_sync.status === 'success'
                    ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)',
                  border: syncInfo.last_sync.status === 'success'
                    ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(244,63,94,0.15)',
                }}>
                {syncInfo.last_sync.status === 'success'
                  ? <BarChart3 size={13} className="text-emerald-400" />
                  : <XCircle   size={13} className="text-rose-400" />}
                <span className={syncInfo.last_sync.status === 'success' ? 'text-emerald-300' : 'text-rose-300'}>
                  {syncInfo.last_sync.status === 'success'
                    ? `${syncInfo.last_sync.ads_synced} ads synced`
                    : syncInfo.last_sync.error_message ?? 'Sync failed'}
                </span>
              </div>
            )}

            {syncResult && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs fade-in-up"
                style={{
                  background: syncResult.error ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)',
                  border:     syncResult.error ? '1px solid rgba(244,63,94,0.2)' : '1px solid rgba(16,185,129,0.2)',
                }}>
                {syncResult.error
                  ? <><XCircle size={13} className="text-rose-400" /><span className="text-rose-300">{syncResult.error}</span></>
                  : <><CheckCircle size={13} className="text-emerald-400" /><span className="text-emerald-300">{syncResult.ads_synced} ads synced to your library</span></>}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-zinc-500">
                Fetches all campaigns, ad sets, ads, and last-30-day metrics from your Meta account.
              </p>
              <button onClick={handleSync} disabled={syncing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
                {syncing
                  ? <><RefreshCw size={14} className="animate-spin" /> Syncing...</>
                  : <><Zap size={14} /> Sync Now</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Setup checklist ── */}
        <div className="rounded-2xl p-6 space-y-3"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-semibold text-white">Setup Checklist</h2>
          {[
            { label: 'META_APP_ID set in .env.local',         done: !!process.env.NEXT_PUBLIC_META_CONFIGURED },
            { label: 'META_APP_SECRET set in .env.local',     done: !!process.env.NEXT_PUBLIC_META_CONFIGURED },
            { label: 'META_REDIRECT_URI registered in Meta',  done: !!process.env.NEXT_PUBLIC_META_CONFIGURED },
            { label: 'META_AD_ACCOUNT_ID set in .env.local',  done: !!process.env.NEXT_PUBLIC_META_CONFIGURED },
            { label: 'SUPABASE_URL & SERVICE_ROLE_KEY set',   done: !!process.env.NEXT_PUBLIC_META_CONFIGURED },
            { label: 'Meta account connected',                 done: !!status?.connected },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              {done
                ? <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                : <div className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0" />}
              <span className={done ? 'text-zinc-300' : 'text-zinc-600'}>{label}</span>
            </div>
          ))}
          <p className="text-[10px] text-zinc-700 pt-1">
            * Checklist items 1-5 require a server restart to reflect env changes.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
