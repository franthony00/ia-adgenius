import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mapAd } from '@/lib/services/mappers';
import { mockAds } from '@/lib/mock-data';

export async function GET() {
  try {
    const dbAds = await prisma.ad.findMany({
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
