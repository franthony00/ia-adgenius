export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { mapAd } from '@/lib/services/mappers';
import { mockAds } from '@/lib/mock-data';
export async function GET() {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ ads: mockAds, source: 'mock' });
  }
  try {
    const dbAds = await prisma.ad.findMany({
      where:   { campaign: { workspaceId: authCtx.workspaceId } },
      include: { campaign: true },
      orderBy: { createdAt: 'desc' },
    });
    if (dbAds.length === 0) {
      return NextResponse.json({ ads: mockAds, source: 'mock' });
    }
    return NextResponse.json({ ads: dbAds.map(mapAd), source: 'db' });
  } catch (err) {
    console.error('[GET /api/ads]', err);
    return NextResponse.json({ ads: mockAds, source: 'mock' });
  }
}
export async function POST(req: Request) {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const {
      name, platform, status, campaign: campaignName,
      headline, description, cta, imageUrl, budget, metrics,
    } = body;
    // Find or create campaign by name in this workspace
    let campaign = await prisma.campaign.findFirst({
      where: { name: campaignName, workspaceId: authCtx.workspaceId },
    });
    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          name:        campaignName,
          workspaceId: authCtx.workspaceId,
          platform:    platform as never,
          totalBudget: budget > 0 ? budget : null,
        },
      });
    }
    // Derive computed fields from raw metrics (budget ≠ spend)
    const impr  = metrics?.impressions ?? 0;
    const ctr   = metrics?.ctr         ?? 0;
    const cpc   = metrics?.cpc         ?? 0;
    const roas  = metrics?.roas        ?? 0;
    const conv  = metrics?.conversions ?? 0;
    const cpa   = metrics?.cpa         ?? null;
    const clicks  = Math.round(impr * (ctr / 100));
    const spend   = +((cpc * clicks) || 0).toFixed(2);
    const revenue = +((spend * (roas || 1))).toFixed(2);
    const cpm     = impr > 0 ? +((spend / impr) * 1000).toFixed(2) : null;
    const reach   = impr > 0 ? Math.round(impr * 0.85) : null;
    const hasMetrics = impr > 0 || ctr > 0 || cpc > 0 || roas > 0 || conv > 0;
    const dbAd = await prisma.ad.create({
      data: {
        name,
        headline,
        description,
        cta,
        imageUrl:    imageUrl || null,
        platform:    platform as never,
        status:      status   as never,
        campaignId:  campaign.id,
        spend,
        revenue,
        impressions: impr,
        clicks,
        conversions: conv,
        ctr,
        cpc,
        cpm,
        cpa,
        roas,
        reach,
      },
      include: { campaign: true },
    });
    // Create initial MetricSnapshot if the user filled any metric
    if (hasMetrics) {
      await prisma.metricSnapshot.create({
        data: {
          adId:        dbAd.id,
          spend,
          revenue,
          impressions: impr,
          clicks,
          conversions: conv,
          ctr,
          cpc,
          cpm,
          cpa,
          roas,
          reach,
          frequency:   1.4,
        },
      });
    }
    await prisma.historyEntry.create({
      data: {
        type:        'ad_added',
        title:       `New ad: ${name}`,
        description: `Added "${name}" to campaign "${campaignName}"`,
        workspaceId: authCtx.workspaceId,
        relatedAdId: dbAd.id,
      },
    });
    return NextResponse.json({ ad: mapAd(dbAd), source: 'db' });
  } catch (err) {
    console.error('[POST /api/ads]', err);
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
  }
}
