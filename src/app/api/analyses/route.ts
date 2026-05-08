import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mapAnalysis } from '@/lib/services/mappers';
import { mockAnalyses } from '@/lib/mock-data';

export async function GET() {
  try {
    const dbAnalyses = await prisma.aIAnalysis.findMany({
      include: { ad: true },
      orderBy: { createdAt: 'desc' },
    });

    if (dbAnalyses.length === 0) {
      return NextResponse.json({ analyses: mockAnalyses, source: 'mock' });
    }

    return NextResponse.json({ analyses: dbAnalyses.map(mapAnalysis), source: 'db' });
  } catch (err) {
    console.error('[GET /api/analyses]', err);
    return NextResponse.json({ analyses: mockAnalyses, source: 'mock' });
  }
}
