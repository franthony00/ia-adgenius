export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { mapAd, mapAnalysis, mapVariation } from '@/lib/services/mappers';
import { mockAds, mockAnalyses, mockVariations } from '@/lib/mock-data';
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
