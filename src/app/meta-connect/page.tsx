'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Zap,
  Clock,
  BarChart3,
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
  const [successParam, setSuccessParam] = useState<string | null>(null);
  const [errorParam, setErrorParam] = useState<string | null>(null);

  const [status, setStatus] = useState<StatusData | null>(null);
  const [syncInfo, setSyncInfo] = useState<SyncData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    ads_synced?: number;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const [statusResponse, syncResponse] = await Promise.all([
        fetch('/api/meta/status').then((response) => response.json()),
        fetch('/api/meta/sync').then((response) => response.json()),
      ]);

      setStatus(statusResponse);
      setSyncInfo(syncResponse);
    } catch {
      setStatus({
        connected: false,
        reason: 'Unable to check Meta connection status.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSuccessParam(params.get('success'));
    setErrorParam(params.get('error'));

    fetchStatus();
  }, [fetchStatus]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/meta/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setSyncResult({
          error: data.error ?? 'Sync failed',
        });
      } else {
        setSyncResult({
          ads_synced: data.ads_synced,
        });
      }

      await fetchStatus();
    } catch {
      setSyncResult({
        error: 'Network error',
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';

    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout>
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-4 lg:px-8"
        style={{
          background: 'rgba(11,11,15,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Link
          href="/"
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="flex-1 pl-10 lg:pl-0">
          <h1 className="text-base font-bold text-white">
            Meta Marketing Integration
          </h1>
          <p className="text-xs text-zinc-500">
            Connect your Facebook Ads account to sync Instagram campaigns
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-2xl space-y-5 p-4 sm:p-6 lg:space-y-6 lg:p-8">
        {successParam && (
          <div
            className="fade-in-up flex items-center gap-3 rounded-2xl p-4"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <CheckCircle size={18} className="shrink-0 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-300">
              Account connected successfully! Run your first sync below.
            </p>
          </div>
        )}

        {errorParam && (
          <div
            className="fade-in-up flex items-center gap-3 rounded-2xl p-4"
            style={{
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.2)',
            }}
          >
            <XCircle size={18} className="shrink-0 text-rose-400" />
            <p className="text-sm font-medium text-rose-300">
              {decodeURIComponent(errorParam)}
            </p>
          </div>
        )}

        <div
          className="space-y-5 rounded-2xl p-6"
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <h2 className="text-sm font-semibold text-white">
            Connection Status
          </h2>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <RefreshCw size={14} className="animate-spin" />
              Checking status...
            </div>
          ) : status?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  {
                    label: 'Ad Account',
                    value: status.ad_account_id ?? '—',
                  },
                  {
                    label: 'Meta User ID',
                    value: status.meta_user_id ?? '—',
                  },
                  {
                    label: 'Connected Since',
                    value: formatDate(status.connected_since),
                  },
                  {
                    label: 'Token Expires',
                    value: status.expires_at
                      ? `${formatDate(status.expires_at)} (${status.days_remaining}d left)`
                      : '—',
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <p className="mb-1 text-zinc-600">{label}</p>
                    <p className="truncate font-medium text-zinc-200">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {status.days_remaining !== undefined &&
                status.days_remaining <= 10 && (
                  <div
                    className="flex items-center gap-2 rounded-xl p-3"
                    style={{
                      background: 'rgba(251,191,36,0.08)',
                      border: '1px solid rgba(251,191,36,0.2)',
                    }}
                  >
                    <AlertTriangle
                      size={14}
                      className="shrink-0 text-amber-400"
                    />
                    <p className="text-xs text-amber-300">
                      Token expires in {status.days_remaining} days. Reconnect
                      soon to avoid interruption.
                    </p>
                  </div>
                )}

              <a
                href="/api/meta/oauth/login"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <RefreshCw size={12} />
                Reconnect / Refresh Token
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                <span className="text-sm text-zinc-400">
                  {status?.reason ?? 'Not connected'}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-zinc-500">
                Connect your Meta Business account to start syncing Instagram
                and Facebook ad data. You&apos;ll need{' '}
                <span className="text-zinc-300">ads_read</span> and{' '}
                <span className="text-zinc-300">read_insights</span>{' '}
                permissions.
              </p>

              <a
                href="/api/meta/oauth/login"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg,#1877F2,#0C54C2)',
                  boxShadow: '0 4px 14px rgba(24,119,242,0.3)',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Connect with Facebook
              </a>
            </div>
          )}
        </div>

        {status?.connected && (
          <div
            className="space-y-4 rounded-2xl p-6"
            style={{
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Sync Ads</h2>

              {syncInfo?.last_sync && (
                <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                  <Clock size={10} />
                  Last sync: {formatDate(syncInfo.last_sync.started_at)}
                </span>
              )}
            </div>

            {syncInfo?.last_sync && (
              <div
                className="flex items-center gap-3 rounded-xl p-3 text-xs"
                style={{
                  background:
                    syncInfo.last_sync.status === 'success'
                      ? 'rgba(16,185,129,0.06)'
                      : 'rgba(244,63,94,0.06)',
                  border:
                    syncInfo.last_sync.status === 'success'
                      ? '1px solid rgba(16,185,129,0.15)'
                      : '1px solid rgba(244,63,94,0.15)',
                }}
              >
                {syncInfo.last_sync.status === 'success' ? (
                  <BarChart3 size={13} className="text-emerald-400" />
                ) : (
                  <XCircle size={13} className="text-rose-400" />
                )}

                <span
                  className={
                    syncInfo.last_sync.status === 'success'
                      ? 'text-emerald-300'
                      : 'text-rose-300'
                  }
                >
                  {syncInfo.last_sync.status === 'success'
                    ? `${syncInfo.last_sync.ads_synced} ads synced`
                    : syncInfo.last_sync.error_message ?? 'Sync failed'}
                </span>
              </div>
            )}

            {syncResult && (
              <div
                className="fade-in-up flex items-center gap-2 rounded-xl p-3 text-xs"
                style={{
                  background: syncResult.error
                    ? 'rgba(244,63,94,0.08)'
                    : 'rgba(16,185,129,0.08)',
                  border: syncResult.error
                    ? '1px solid rgba(244,63,94,0.2)'
                    : '1px solid rgba(16,185,129,0.2)',
                }}
              >
                {syncResult.error ? (
                  <>
                    <XCircle size={13} className="text-rose-400" />
                    <span className="text-rose-300">{syncResult.error}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={13} className="text-emerald-400" />
                    <span className="text-emerald-300">
                      {syncResult.ads_synced} ads synced to your library
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-zinc-500">
                Fetches all campaigns, ad sets, ads, and last-30-day metrics
                from your Meta account.
              </p>

              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg,#10B981,#059669)',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
                }}
              >
                {syncing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Sync Now
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div
          className="space-y-3 rounded-2xl p-6"
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <h2 className="text-sm font-semibold text-white">Setup Checklist</h2>

          {[
            {
              label: 'META_APP_ID set in .env.local',
              done: !!process.env.NEXT_PUBLIC_META_CONFIGURED,
            },
            {
              label: 'META_APP_SECRET set in .env.local',
              done: !!process.env.NEXT_PUBLIC_META_CONFIGURED,
            },
            {
              label: 'META_REDIRECT_URI registered in Meta',
              done: !!process.env.NEXT_PUBLIC_META_CONFIGURED,
            },
            {
              label: 'META_AD_ACCOUNT_ID set in .env.local',
              done: !!process.env.NEXT_PUBLIC_META_CONFIGURED,
            },
            {
              label: 'SUPABASE_URL & SERVICE_ROLE_KEY set',
              done: !!process.env.NEXT_PUBLIC_META_CONFIGURED,
            },
            {
              label: 'Meta account connected',
              done: !!status?.connected,
            },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              {done ? (
                <CheckCircle
                  size={13}
                  className="shrink-0 text-emerald-400"
                />
              ) : (
                <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-zinc-700" />
              )}

              <span className={done ? 'text-zinc-300' : 'text-zinc-600'}>
                {label}
              </span>
            </div>
          ))}

          <p className="pt-1 text-[10px] text-zinc-700">
            * Checklist items 1-5 require a server restart to reflect env
            changes.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}