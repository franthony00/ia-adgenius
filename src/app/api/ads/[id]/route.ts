import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mapAd, mapAnalysis, mapVariation } from '@/lib/services/mappers';
import { mockAds, mockAnalyses, mockVariations } from '@/lib/mock-data';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const dbAd = await prisma.ad.findUnique({
      where: { id },
      include: { campaign: true },
    });

    const dbAnalyses = await prisma.aIAnalysis.findMany({
      where: { adId: id },
      include: { ad: true },
      orderBy: { createdAt: 'desc' },
    });

    const dbVariations = await prisma.adVariation.findMany({
      where: { originalAdId: id },
      include: { originalAd: true },
      orderBy: { createdAt: 'desc' },
    });

    // If nothing found in DB, fall back to mock data
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
