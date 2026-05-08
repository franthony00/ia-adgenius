import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mapHistory } from '@/lib/services/mappers';
import { mockHistory, mockAnalyses, mockVariations } from '@/lib/mock-data';

export async function GET() {
  try {
    const [dbEntries, analysesCount, variationsCount, approvedCount, testingCount] =
      await Promise.all([
        prisma.historyEntry.findMany({
          include: { relatedAd: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.aIAnalysis.count(),
        prisma.adVariation.count(),
        prisma.adVariation.count({ where: { status: 'approved' } }),
        prisma.adVariation.count({ where: { status: 'testing' } }),
      ]);

    if (dbEntries.length === 0) {
      return NextResponse.json({
        entries:         mockHistory,
        analysesCount:   mockAnalyses.length,
        variationsCount: mockVariations.length,
        approvedCount:   mockVariations.filter(v => v.status === 'approved').length,
        testingCount:    mockVariations.filter(v => v.status === 'testing').length,
        source:          'mock',
      });
    }

    return NextResponse.json({
      entries:         dbEntries.map(mapHistory),
      analysesCount,
      variationsCount,
      approvedCount,
      testingCount,
      source:          'db',
    });
  } catch (err) {
    console.error('[GET /api/history]', err);
    return NextResponse.json({
      entries:         mockHistory,
      analysesCount:   mockAnalyses.length,
      variationsCount: mockVariations.length,
      approvedCount:   mockVariations.filter(v => v.status === 'approved').length,
      testingCount:    mockVariations.filter(v => v.status === 'testing').length,
      source:          'mock',
    });
  }
}
