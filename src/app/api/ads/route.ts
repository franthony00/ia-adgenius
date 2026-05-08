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
        spend:       metrics?.spend       ?? 0,
        impressions: metrics?.impressions ?? 0,
        conversions: metrics?.conversions ?? 0,
        ctr:         metrics?.ctr         ?? 0,
        cpc:         metrics?.cpc         ?? 0,
        cpa:         metrics?.cpa         ?? null,
        roas:        metrics?.roas        ?? 0,
      },
      include: { campaign: true },
    });

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
