export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { mapAd, mapHistory } from '@/lib/services/mappers';
import {
  mockDashboardStats, mockAds, mockHistory,
  mockPlatformMix, mockPerformanceLoop, mockRecommendations,
} from '@/lib/mock-data';
import type {
  DashboardStats, PlatformMixItem, Platform,
  PerformanceLoopEntry, AIRecommendation,
  RecommendationType, ConfidenceLevel, LoopStage,
} from '@/lib/types';

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

// ─── Performance Loop ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPerformanceLoop(ads: any[]): PerformanceLoopEntry[] {
  return ads.slice(0, 8).map(ad => {
    const latestAnalysis  = ad.analyses?.[0] ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variationStatuses: string[] = (ad.variations ?? []).map((v: any) => v.status);
    const testingCount  = variationStatuses.filter(s => s === 'testing').length;
    const approvedCount = variationStatuses.filter(s => s === 'approved').length;

    const projectedCTR  = latestAnalysis?.estimatedCTR  ?? 0;
    const projectedROAS = latestAnalysis?.estimatedROAS ?? 0;
    const realCTR       = ad.ctr  > 0 ? +(ad.ctr.toFixed(2))  : undefined;
    const realROAS      = ad.roas > 0 ? +(ad.roas.toFixed(2)) : undefined;

    // Stage logic
    let stage: LoopStage;
    if (!latestAnalysis) {
      stage = 'generate';
    } else if (testingCount > 0) {
      stage = 'test';
    } else if (approvedCount > 0 || (realROAS && projectedROAS > 0 && realROAS > projectedROAS)) {
      stage = 'improve';
    } else if (realCTR !== undefined || realROAS !== undefined) {
      stage = 'learn';
    } else {
      stage = 'measure';
    }

    // Recommendation logic
    let type: RecommendationType;
    let recommendation: string;
    let confidence: ConfidenceLevel;

    if (realROAS && realROAS >= 4 && ad.ctr >= 1.5) {
      type           = 'scale';
      recommendation = `ROAS of ${realROAS}x exceeds target with ${ad.ctr.toFixed(1)}% CTR. Increase daily budget by 20–30% to capture more conversions at current efficiency.`;
      confidence     = 'high';
    } else if (realROAS !== undefined && realROAS < 1 && ad.spend > 100) {
      type           = 'pause';
      recommendation = `ROAS below 1x after $${ad.spend.toFixed(0)} spent. Pause and refresh the creative or tighten the audience targeting.`;
      confidence     = 'high';
    } else if (ad.ctr >= 1.5 && (!realROAS || realROAS < 2)) {
      type           = 'test_copy';
      recommendation = `Good CTR (${ad.ctr.toFixed(1)}%) but ROAS below target. Test a stronger offer angle or improve the landing page.`;
      confidence     = 'medium';
    } else if (ad.ctr < 1 && ad.impressions > 1000) {
      type           = 'test_cta';
      recommendation = `CTR below 1% despite ${(ad.impressions / 1000).toFixed(0)}K impressions. Try a stronger hook or a different call-to-action.`;
      confidence     = 'medium';
    } else if (approvedCount > 0) {
      type           = 'duplicate';
      recommendation = `A winning variation has been approved. Duplicate the top-performing creative and scale the budget.`;
      confidence     = 'medium';
    } else {
      type           = 'monitor';
      recommendation = `Performance within normal range. Monitor for 3–5 more days before making budget or creative changes.`;
      confidence     = 'low';
    }

    const daysActive = Math.max(0, Math.floor(
      (Date.now() - new Date(ad.createdAt).getTime()) / 86_400_000,
    ));

    return {
      id:               `loop-${ad.id}`,
      adId:             ad.id,
      adName:           ad.name,
      stage,
      projectedCTR,
      realCTR,
      projectedROAS,
      realROAS,
      recommendation,
      recommendationType: type,
      confidence,
      daysActive,
    };
  });
}

// ─── AI Recommendations ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRecommendations(ads: any[]): AIRecommendation[] {
  const recs: AIRecommendation[] = [];

  for (const ad of ads) {
    if (recs.length >= 6) break;

    if (ad.roas >= 4 && ad.ctr >= 1.5) {
      recs.push({
        id:          `rec-scale-${ad.id}`,
        adId:        ad.id,
        adName:      ad.name,
        type:        'scale',
        title:       'Scale Budget — Strong ROAS',
        description: `"${ad.name}" is delivering ${ad.roas.toFixed(1)}x ROAS with ${ad.ctr.toFixed(1)}% CTR. Increase budget by 20–30% while performance holds.`,
        impact:      'high',
        confidence:  88,
        metric:      'ROAS',
        metricValue: `${ad.roas.toFixed(1)}x`,
      });
    } else if (ad.roas < 1 && ad.spend > 200) {
      recs.push({
        id:          `rec-pause-${ad.id}`,
        adId:        ad.id,
        adName:      ad.name,
        type:        'pause',
        title:       'Pause — ROAS Below Target',
        description: `"${ad.name}" has spent $${ad.spend.toFixed(0)} with ROAS below 1x. Pause and refresh the creative or audience before spending more.`,
        impact:      'high',
        confidence:  92,
        metric:      'Spend',
        metricValue: `$${ad.spend.toFixed(0)}`,
      });
    } else if (ad.ctr < 1 && ad.impressions > 2000) {
      recs.push({
        id:          `rec-cta-${ad.id}`,
        adId:        ad.id,
        adName:      ad.name,
        type:        'test_cta',
        title:       'Low CTR — Test New Hook',
        description: `"${ad.name}" has only ${ad.ctr.toFixed(1)}% CTR across ${(ad.impressions / 1000).toFixed(0)}K impressions. Try a more compelling hook or different visual.`,
        impact:      'medium',
        confidence:  75,
        metric:      'CTR',
        metricValue: `${ad.ctr.toFixed(1)}%`,
      });
    } else if (ad.roas >= 2.5 && ad.ctr < 1.5) {
      recs.push({
        id:          `rec-copy-${ad.id}`,
        adId:        ad.id,
        adName:      ad.name,
        type:        'test_copy',
        title:       'Improve CTR — Good ROAS Potential',
        description: `"${ad.name}" converts well (${ad.roas.toFixed(1)}x) but click rate is low. Test copy variations to send more qualified traffic.`,
        impact:      'medium',
        confidence:  70,
        metric:      'CTR',
        metricValue: `${ad.ctr.toFixed(1)}%`,
      });
    } else if (ad.roas >= 3) {
      recs.push({
        id:          `rec-dup-${ad.id}`,
        adId:        ad.id,
        adName:      ad.name,
        type:        'duplicate',
        title:       'Duplicate Winning Creative',
        description: `"${ad.name}" is consistently above 3x ROAS. Duplicate to a new ad set with a broader audience.`,
        impact:      'medium',
        confidence:  78,
        metric:      'ROAS',
        metricValue: `${ad.roas.toFixed(1)}x`,
      });
    }
  }

  return recs;
}

// ─── Trend arrays (last 7 days from MetricSnapshot) ───────────────────────────

function buildTrends(snapshots: { date: Date; spend: number; revenue: number; ctr: number }[]) {
  // Build a slot for each of the past 7 days (today = index 6)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const byDay: Record<string, { spend: number; revenue: number; ctr: number[] }> = {};
  for (const d of days) byDay[d] = { spend: 0, revenue: 0, ctr: [] };

  for (const s of snapshots) {
    const day = new Date(s.date).toISOString().split('T')[0];
    if (byDay[day]) {
      byDay[day].spend   += s.spend;
      byDay[day].revenue += s.revenue;
      if (s.ctr > 0) byDay[day].ctr.push(s.ctr);
    }
  }

  return {
    spendTrend:   days.map(d => +byDay[d].spend.toFixed(0)),
    revenueTrend: days.map(d => +byDay[d].revenue.toFixed(0)),
    ctaTrend:     days.map(d =>
      byDay[d].ctr.length > 0
        ? +(byDay[d].ctr.reduce((s, v) => s + v, 0) / byDay[d].ctr.length).toFixed(2)
        : 0,
    ),
  };
}

// ─── GET /api/dashboard ────────────────────────────────────────────────────────

export async function GET() {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ ...MOCK_RESPONSE, fetchedAt: new Date().toISOString() });
  }

  try {
    const { workspaceId } = authCtx;
    const wsFilter        = { campaign: { workspaceId } };
    const sevenDaysAgo    = new Date(Date.now() - 7 * 86_400_000);

    const [
      dbAds,
      dbHistory,
      analysesCount,
      variationsCount,
      testingCount,
      winningCount,
      snapshotAgg,
      activeAdsForLoop,
      trendSnapshots,
    ] = await Promise.all([
      // Top ads sorted by ROAS for the KPI + top-ads list
      prisma.ad.findMany({
        where:   wsFilter,
        include: { campaign: true },
        orderBy: { roas: 'desc' },
      }),

      // Recent history entries
      prisma.historyEntry.findMany({
        where:   { workspaceId },
        include: { relatedAd: true },
        orderBy: { createdAt: 'desc' },
        take:    6,
      }),

      prisma.aIAnalysis.count({ where: { ad: wsFilter } }),
      prisma.adVariation.count({ where: { originalAd: wsFilter } }),
      prisma.adVariation.count({ where: { originalAd: wsFilter, status: 'testing'  } }),
      prisma.adVariation.count({ where: { originalAd: wsFilter, status: 'approved' } }),

      // Aggregate spend/revenue/impressions/conversions across all time
      prisma.metricSnapshot.aggregate({
        where: { ad: wsFilter },
        _sum:  { spend: true, revenue: true, impressions: true, conversions: true },
      }),

      // Active ads with latest analysis + variation statuses → performance loop
      prisma.ad.findMany({
        where:   { ...wsFilter, status: 'active' },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take:    1,
            select:  { estimatedCTR: true, estimatedROAS: true },
          },
          variations: {
            select: { status: true },
          },
        },
        orderBy: { roas: 'desc' },
        take:    8,
      }),

      // Last 7 days of daily snapshots for trend charts
      prisma.metricSnapshot.findMany({
        where:  { ad: wsFilter, date: { gte: sevenDaysAgo } },
        select: { date: true, spend: true, revenue: true, ctr: true },
      }),
    ]);

    // New workspace with no ads yet → show mock as sample data
    if (dbAds.length === 0) {
      return NextResponse.json({ ...MOCK_RESPONSE, fetchedAt: new Date().toISOString() });
    }

    const activeAds    = dbAds.filter(a => a.status === 'active');
    const totalSpend   = snapshotAgg._sum.spend       ?? 0;
    const totalRevenue = snapshotAgg._sum.revenue     ?? 0;
    const totalImps    = snapshotAgg._sum.impressions ?? 0;
    const totalConvs   = snapshotAgg._sum.conversions ?? 0;

    const avgROAS = activeAds.length > 0
      ? activeAds.reduce((s, a) => s + a.roas, 0) / activeAds.length : 0;
    const avgCTR = activeAds.length > 0
      ? activeAds.reduce((s, a) => s + a.ctr, 0) / activeAds.length : 0;

    // Trend arrays — real if snapshots exist, mock fallback if none yet
    const hasTrendData = trendSnapshots.length > 0;
    const { spendTrend, revenueTrend, ctaTrend } = hasTrendData
      ? buildTrends(trendSnapshots)
      : {
          spendTrend:   mockDashboardStats.spendTrend,
          revenueTrend: mockDashboardStats.revenueTrend,
          ctaTrend:     mockDashboardStats.ctaTrend,
        };

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
      spendTrend,
      revenueTrend,
      ctaTrend,
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

    // Performance loop and recommendations from real ad data
    const performanceLoop = activeAdsForLoop.length > 0
      ? buildPerformanceLoop(activeAdsForLoop)
      : mockPerformanceLoop;

    const recommendations = activeAdsForLoop.length > 0
      ? buildRecommendations(activeAdsForLoop)
      : mockRecommendations;

    return NextResponse.json({
      stats,
      topAds:          activeAds.slice(0, 5).map(mapAd),
      recentHistory:   dbHistory.map(mapHistory),
      platformMix:     platformMix.length > 0 ? platformMix : mockPlatformMix,
      performanceLoop: performanceLoop.length > 0 ? performanceLoop : mockPerformanceLoop,
      recommendations: recommendations.length  > 0 ? recommendations  : mockRecommendations,
      source:          'db',
      fetchedAt:       new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/dashboard]', err);
    return NextResponse.json({ ...MOCK_RESPONSE, fetchedAt: new Date().toISOString() });
  }
}
