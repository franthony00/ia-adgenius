/**
 * Dashboard Data Layer
 *
 * Fetches dashboard data from /api/dashboard (backed by Neon/Prisma).
 * Falls back to mock data automatically if the DB is unavailable or empty.
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

export interface DashboardData {
  stats: DashboardStats;
  topAds: Ad[];
  recentHistory: HistoryEntry[];
  platformMix: PlatformMixItem[];
  performanceLoop: PerformanceLoopEntry[];
  recommendations: AIRecommendation[];
  /** 'demo' = mock data  |  'live' = real DB data */
  source: 'demo' | 'live';
  fetchedAt: string;
}

export interface ConnectedAccount {
  id: string;
  platform: string;
  name: string;
  accountId: string;
}

// Empty until Meta/Google OAuth is connected
export const CONNECTED_ACCOUNTS: ConnectedAccount[] = [];

// ─── Data fetch ───────────────────────────────────────────────────────────────

export async function fetchDashboardData(
  _platform?: string | null,
  _adAccountId?: string | null,
): Promise<DashboardData> {
  try {
    const res = await fetch('/api/dashboard', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Dashboard API error: ${res.status}`);
    const json = await res.json();

    return {
      stats:           json.stats           ?? mockDashboardStats,
      topAds:          json.topAds          ?? mockAds.filter(a => a.status === 'active').slice(0, 5),
      recentHistory:   json.recentHistory   ?? mockHistory.slice(0, 6),
      platformMix:     json.platformMix     ?? mockPlatformMix,
      performanceLoop: json.performanceLoop ?? mockPerformanceLoop,
      recommendations: json.recommendations ?? mockRecommendations,
      source:          json.source === 'db' ? 'live' : 'demo',
      fetchedAt:       json.fetchedAt       ?? new Date().toISOString(),
    };
  } catch {
    // Network error or server error — fall back to mock
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
}
