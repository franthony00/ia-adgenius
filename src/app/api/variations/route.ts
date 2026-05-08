import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mapVariation } from '@/lib/services/mappers';
import { mockVariations } from '@/lib/mock-data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adId = searchParams.get('adId');

  try {
    const where = adId ? { originalAdId: adId } : {};

    const dbVariations = await prisma.adVariation.findMany({
      where,
      include: { originalAd: true },
      orderBy: { createdAt: 'desc' },
    });

    if (dbVariations.length === 0) {
      const fallback = adId ? mockVariations.filter(v => v.originalAdId === adId) : mockVariations;
      return NextResponse.json({ variations: fallback, source: 'mock' });
    }

    return NextResponse.json({ variations: dbVariations.map(mapVariation), source: 'db' });
  } catch (err) {
    console.error('[GET /api/variations]', err);
    const fallback = adId ? mockVariations.filter(v => v.originalAdId === adId) : mockVariations;
    return NextResponse.json({ variations: fallback, source: 'mock' });
  }
}
