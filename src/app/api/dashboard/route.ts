import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mapAd, mapHistory } from '@/lib/services/mappers';
import {
  mockDashboardStats, mockAds, mockHistory,
  mockPlatformMix, mockPerformanceLoop, mockRecommendations,
} from '@/lib/mock-data';
import type { DashboardStats, PlatformMixItem, Platform } from '@/lib/types';

export async function GET() {
  try {
    const [dbAds, dbHistory, analysesCount, variationsCount, testingCount, winningCount] =
      await Promise.all([
        prisma.ad.findMany({ include: { campaign: true }, orderBy: { roas: 'desc' } }),
        prisma.historyEntry.findMany({
          include: { relatedAd: true },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
        prisma.aIAnalysis.count(),
        prisma.adVariation.count(),
        prisma.adVariation.count({ where: { status: 'testing' } }),
        prisma.adVariation.count({ where: { status: 'approved' } }),
      ]);

    // Fall back to mock if DB is empty
    if (dbAds.length === 0) {
      return NextResponse.json({
        stats:           mockDashboardStats,
        topAds:          mockAds.filter(a => a.status === 'active').slice(0, 5),
        recentHistory:   mockHistory.slice(0, 6),
        platformMix:     mockPlatformMix,
        performanceLoop: mockPerformanceLoop,
        recommendations: mockRecommendations,
        source:          'mock',
        fetchedAt:       new Date().toISOString(),
      });
    }

    // ── Compute stats from DB ──────────────────────────────────────────────────
    const activeAds = dbAds.filter(a => a.status === 'active');

    const totalSpend    = dbAds.reduce((s, a) => s + a.spend,       0);
    const totalRevenue  = dbAds.reduce((s, a) => s + a.revenue,     0);
    const totalImps     = dbAds.reduce((s, a) => s + a.impressions, 0);
    const totalConvs    = dbAds.reduce((s, a) => s + a.conversions, 0);

    const avgROAS = activeAds.length > 0
      ? activeAds.reduce((s, a) => s + a.roas, 0) / activeAds.length
      : 0;
    const avgCTR = activeAds.length > 0
      ? activeAds.reduce((s, a) => s + a.ctr, 0) / activeAds.length
      : 0;

    const topAd = dbAds[0]; // already sorted by roas desc

    const stats: DashboardStats = {
      totalSpend,
      totalRevenue,
      avgROAS:               +avgROAS.toFixed(2),
      avgCTR:                +avgCTR.toFixed(2),
      totalConversions:      totalConvs,
      totalImpressions:      totalImps,
      activeAds:             activeAds.length,
      analysesRun:           analysesCount,
      variationsGenerated:   variationsCount,
      topPerformingAd:       topAd?.name ?? '—',
      // Trend data: use mock placeholder (single snapshot, no time series yet)
      spendTrend:            mockDashboardStats.spendTrend,
      revenueTrend:          mockDashboardStats.revenueTrend,
      ctaTrend:              mockDashboardStats.ctaTrend,
      campaignsRunning:      dbAds.filter(a => a.status === 'active').length,
      variationsTested:      testingCount,
      winningAds:            winningCount,
      estimatedAvgROAS:      mockDashboardStats.estimatedAvgROAS,
      realAvgROAS:           +avgROAS.toFixed(2),
    };

    // ── Platform mix from DB ───────────────────────────────────────────────────
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
      ctr:      d.ctr.length  > 0 ? +(d.ctr.reduce((s, v) => s + v, 0) / d.ctr.length).toFixed(2) : 0,
    }));

    return NextResponse.json({
      stats,
      topAds:          dbAds.filter(a => a.status === 'active').slice(0, 5).map(mapAd),
      recentHistory:   dbHistory.map(mapHistory),
      platformMix:     platformMix.length > 0 ? platformMix : mockPlatformMix,
      performanceLoop: mockPerformanceLoop,   // requires real time-series data
      recommendations: mockRecommendations,   // requires AI inference
      source:          'db',
      fetchedAt:       new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/dashboard]', err);
    return NextResponse.json({
      stats:           mockDashboardStats,
      topAds:          mockAds.filter(a => a.status === 'active').slice(0, 5),
      recentHistory:   mockHistory.slice(0, 6),
      platformMix:     mockPlatformMix,
      performanceLoop: mockPerformanceLoop,
      recommendations: mockRecommendations,
      source:          'mock',
      fetchedAt:       new Date().toISOString(),
    });
  }
}
