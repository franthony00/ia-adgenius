import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { mapAd, mapHistory } from '@/lib/services/mappers';
import {
  mockDashboardStats, mockAds, mockHistory,
  mockPlatformMix, mockPerformanceLoop, mockRecommendations,
} from '@/lib/mock-data';
import type { DashboardStats, PlatformMixItem, Platform } from '@/lib/types';

const MOCK_RESPONSE = {
  stats:           mockDashboardStats,
  topAds:          mockAds.filter(a => a.status === 'active').slice(0, 5),
  recentHistory:   mockHistory.slice(0, 6),
  platformMix:     mockPlatformMix,
  performanceLoop: mockPerformanceLoop,
  recommendations: mockRecommendations,
  source:          'mock' as const,
  fetchedAt:       new Date().toISOString(),
};

export async function GET() {
  const authCtx = await getAuthContext();

  // Demo mode or new user with no data → return mock
  if (authCtx.isDemo) {
    return NextResponse.json({ ...MOCK_RESPONSE, fetchedAt: new Date().toISOString() });
  }

  try {
    const { workspaceId } = authCtx;
    const wsFilter = { campaign: { workspaceId } };

    const [dbAds, dbHistory, analysesCount, variationsCount, testingCount, winningCount] =
      await Promise.all([
        prisma.ad.findMany({
          where:   wsFilter,
          include: { campaign: true },
          orderBy: { roas: 'desc' },
        }),
        prisma.historyEntry.findMany({
          where:   { workspaceId },
          include: { relatedAd: true },
          orderBy: { createdAt: 'desc' },
          take:    6,
        }),
        prisma.aIAnalysis.count({ where: { ad: wsFilter } }),
        prisma.adVariation.count({ where: { originalAd: wsFilter } }),
        prisma.adVariation.count({ where: { originalAd: wsFilter, status: 'testing' } }),
        prisma.adVariation.count({ where: { originalAd: wsFilter, status: 'approved' } }),
      ]);

    // New workspace with no ads yet → show mock as sample data
    if (dbAds.length === 0) {
      return NextResponse.json({ ...MOCK_RESPONSE, fetchedAt: new Date().toISOString() });
    }

    const activeAds    = dbAds.filter(a => a.status === 'active');
    const totalSpend   = dbAds.reduce((s, a) => s + a.spend,       0);
    const totalRevenue = dbAds.reduce((s, a) => s + a.revenue,     0);
    const totalImps    = dbAds.reduce((s, a) => s + a.impressions, 0);
    const totalConvs   = dbAds.reduce((s, a) => s + a.conversions, 0);

    const avgROAS = activeAds.length > 0
      ? activeAds.reduce((s, a) => s + a.roas, 0) / activeAds.length : 0;
    const avgCTR = activeAds.length > 0
      ? activeAds.reduce((s, a) => s + a.ctr, 0) / activeAds.length : 0;

    const stats: DashboardStats = {
      totalSpend,
      totalRevenue,
      avgROAS:             +avgROAS.toFixed(2),
      avgCTR:              +avgCTR.toFixed(2),
      totalConversions:    totalConvs,
      totalImpressions:    totalImps,
      activeAds:           activeAds.length,
      analysesRun:         analysesCount,
      variationsGenerated: variationsCount,
      topPerformingAd:     dbAds[0]?.name ?? '—',
      spendTrend:          mockDashboardStats.spendTrend,
      revenueTrend:        mockDashboardStats.revenueTrend,
      ctaTrend:            mockDashboardStats.ctaTrend,
      campaignsRunning:    activeAds.length,
      variationsTested:    testingCount,
      winningAds:          winningCount,
      estimatedAvgROAS:    mockDashboardStats.estimatedAvgROAS,
      realAvgROAS:         +avgROAS.toFixed(2),
    };

    const byPlatform: Record<string, { spend: number; roas: number[]; ctr: number[] }> = {};
    for (const a of dbAds) {
      const p = a.platform;
      if (!byPlatform[p]) byPlatform[p] = { spend: 0, roas: [], ctr: [] };
      byPlatform[p].spend += a.spend;
      if (a.roas > 0) byPlatform[p].roas.push(a.roas);
      if (a.ctr  > 0) byPlatform[p].ctr.push(a.ctr);
    }

    const platformMix: PlatformMixItem[] = Object.entries(byPlatform).map(([p, d]) => ({
      platform: p as Platform,
      spend:    +d.spend.toFixed(0),
      pct:      totalSpend > 0 ? +((d.spend / totalSpend) * 100).toFixed(0) : 0,
      roas:     d.roas.length > 0 ? +(d.roas.reduce((s, v) => s + v, 0) / d.roas.length).toFixed(1) : 0,
      ctr:      d.ctr.length  > 0 ? +(d.ctr.reduce((s, v)  => s + v, 0) / d.ctr.length).toFixed(2)  : 0,
    }));

    return NextResponse.json({
      stats,
      topAds:          activeAds.slice(0, 5).map(mapAd),
      recentHistory:   dbHistory.map(mapHistory),
      platformMix:     platformMix.length > 0 ? platformMix : mockPlatformMix,
      performanceLoop: mockPerformanceLoop,
      recommendations: mockRecommendations,
      source:          'db',
      fetchedAt:       new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/dashboard]', err);
    return NextResponse.json({ ...MOCK_RESPONSE, fetchedAt: new Date().toISOString() });
  }
}
