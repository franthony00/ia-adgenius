/**
 * Dashboard Data Layer
 *
 * Single seam between the dashboard UI and data sources.
 * Currently returns mock data. To switch to real data:
 *   1. Set CONNECTED_PLATFORMS with real account IDs after OAuth.
 *   2. Replace the body of `fetchDashboardData` with a real API call:
 *      const res = await fetch(`/api/dashboard?platform=${platform}&accountId=${accountId}`);
 *      return res.json();
 */

import type {
  DashboardStats, Ad, HistoryEntry,
  PlatformMixItem, PerformanceLoopEntry, AIRecommendation,
} from './types';
import {
  mockDashboardStats, mockAds, mockHistory,
  mockPlatformMix, mockPerformanceLoop, mockRecommendations,
} from './mock-data';

// ─── Types ────────────────────────────────────────────────────────────────────

/** All data the dashboard needs, in one object. */
export interface DashboardData {
  stats: DashboardStats;
  topAds: Ad[];
  recentHistory: HistoryEntry[];
  platformMix: PlatformMixItem[];
  performanceLoop: PerformanceLoopEntry[];
  recommendations: AIRecommendation[];
  /** 'demo' = mock data  |  'live' = real connected account data */
  source: 'demo' | 'live';
  fetchedAt: string;
}

/** A connected ad account (populated after OAuth). */
export interface ConnectedAccount {
  id: string;
  platform: string;
  name: string;
  accountId: string;
}

// ─── Connected accounts registry ─────────────────────────────────────────────
/**
 * Replace this with persisted state (localStorage, Supabase, etc.) when
 * implementing real OAuth. Empty array = demo mode.
 */
export const CONNECTED_ACCOUNTS: ConnectedAccount[] = [
  // Example of what a real entry looks like — leave commented out:
  // { id: 'meta-1', platform: 'meta', name: 'My Business Page', accountId: 'act_123456789' },
];

// ─── Data fetch ───────────────────────────────────────────────────────────────

/**
 * Fetch dashboard data for the given platform/account.
 * - No args → returns demo data.
 * - With args → will call real API (not implemented yet).
 *
 * To implement real data: replace this function's body with an API call.
 */
export async function fetchDashboardData(
  _platform?: string | null,
  _adAccountId?: string | null,
): Promise<DashboardData> {
  const isLive = Boolean(_platform && _adAccountId);

  if (isLive) {
    // ── REAL DATA (future) ────────────────────────────────────────────────
    // Example:
    // const res = await fetch(
    //   `/api/dashboard?platform=${_platform}&accountId=${_adAccountId}`,
    //   { credentials: 'include' }
    // );
    // if (!res.ok) throw new Error(`Dashboard API error: ${res.status}`);
    // const json = await res.json();
    // return { ...json, source: 'live', fetchedAt: new Date().toISOString() };
    //
    // For now, fall through to mock data (will be replaced above):
  }

  // ── DEMO / MOCK DATA (current) ───────────────────────────────────────────
  // Simulate a short async delay so the loading state is exercised
  await new Promise(r => setTimeout(r, 200));

  return {
    stats:           mockDashboardStats,
    topAds:          mockAds.filter(a => a.status === 'active').slice(0, 5),
    recentHistory:   mockHistory.slice(0, 6),
    platformMix:     mockPlatformMix,
    performanceLoop: mockPerformanceLoop,
    recommendations: mockRecommendations,
    source:          'demo',
    fetchedAt:       new Date().toISOString(),
  };
}
