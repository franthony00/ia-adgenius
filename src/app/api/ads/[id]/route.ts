export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { mapAd, mapAnalysis, mapVariation } from '@/lib/services/mappers';
import { mockAds, mockAnalyses, mockVariations } from '@/lib/mock-data';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
  }
  try {
    // Verify ad belongs to this workspace
    const existing = await prisma.ad.findFirst({
      where: { id, campaign: { workspaceId: authCtx.workspaceId } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, headline, description, cta, imageUrl, status, platform, metrics } = body;

    // Derive computed fields (same logic as POST)
    const impr    = metrics?.impressions ?? existing.impressions ?? 0;
    const ctr     = metrics?.ctr         ?? existing.ctr         ?? 0;
    const cpc     = metrics?.cpc         ?? existing.cpc         ?? 0;
    const roas    = metrics?.roas        ?? existing.roas        ?? 0;
    const conv    = metrics?.conversions ?? existing.conversions ?? 0;
    const cpa     = metrics?.cpa         ?? existing.cpa         ?? null;
    const clicks  = Math.round(impr * (ctr / 100));
    const spend   = +((cpc * clicks) || 0).toFixed(2);
    const revenue = +((spend * (roas || 1))).toFixed(2);
    const cpm     = impr > 0 ? +((spend / impr) * 1000).toFixed(2) : null;
    const reach   = impr > 0 ? Math.round(impr * 0.85) : null;

    const updated = await prisma.ad.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name }),
        ...(headline    !== undefined && { headline }),
        ...(description !== undefined && { description }),
        ...(cta         !== undefined && { cta }),
        ...(imageUrl    !== undefined && { imageUrl: imageUrl || null }),
        ...(status      !== undefined && { status: status as never }),
        ...(platform    !== undefined && { platform: platform as never }),
        ...(metrics     !== undefined && {
          impressions: impr,
          ctr, cpc, cpa, roas,
          conversions: conv,
          clicks, spend, revenue,
          cpm, reach,
        }),
      },
      include: { campaign: true },
    });

    return NextResponse.json({ ad: mapAd(updated) });
  } catch (err) {
    console.error(`[PATCH /api/ads/${id}]`, err);
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
  }
  try {
    const result = await prisma.ad.deleteMany({
      where: { id, campaign: { workspaceId: authCtx.workspaceId } },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[DELETE /api/ads/${id}]`, err);
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authCtx = await getAuthContext();
  // Demo mode: look up in mock data
  if (authCtx.isDemo) {
    const mockAd       = mockAds.find(a => a.id === id) ?? null;
    const mockAnalysis = mockAnalyses.find(a => a.adId === id) ?? null;
    const mockVars     = mockVariations.filter(v => v.originalAdId === id);
    return NextResponse.json({ ad: mockAd, analysis: mockAnalysis, variations: mockVars, source: 'mock' });
  }
  try {
    const wsFilter = { campaign: { workspaceId: authCtx.workspaceId } };
    const dbAd = await prisma.ad.findFirst({
      where:   { id, ...wsFilter },
      include: { campaign: true },
    });
    const [dbAnalyses, dbVariations] = await Promise.all([
      prisma.aIAnalysis.findMany({
        where:   { adId: id, ad: wsFilter },
        include: { ad: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adVariation.findMany({
        where:   { originalAdId: id, originalAd: wsFilter },
        include: { originalAd: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    // Ad not in this workspace → fall back to mock
    if (!dbAd) {
      const mockAd       = mockAds.find(a => a.id === id) ?? null;
      const mockAnalysis = mockAnalyses.find(a => a.adId === id) ?? null;
      const mockVars     = mockVariations.filter(v => v.originalAdId === id);
      return NextResponse.json({ ad: mockAd, analysis: mockAnalysis, variations: mockVars, source: 'mock' });
    }
    return NextResponse.json({
      ad:         mapAd(dbAd),
      analysis:   dbAnalyses.length > 0 ? mapAnalysis(dbAnalyses[0]) : null,
      variations: dbVariations.map(mapVariation),
      source:     'db',
    });
  } catch (err) {
    console.error(`[GET /api/ads/${id}]`, err);
    const mockAd       = mockAds.find(a => a.id === id) ?? null;
    const mockAnalysis = mockAnalyses.find(a => a.adId === id) ?? null;
    const mockVars     = mockVariations.filter(v => v.originalAdId === id);
    return NextResponse.json({ ad: mockAd, analysis: mockAnalysis, variations: mockVars, source: 'mock' });
  }
}
