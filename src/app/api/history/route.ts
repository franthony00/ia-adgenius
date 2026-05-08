import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { mapHistory } from '@/lib/services/mappers';
import { mockHistory, mockAnalyses, mockVariations } from '@/lib/mock-data';

const MOCK_RESPONSE = {
  entries:         mockHistory,
  analysesCount:   mockAnalyses.length,
  variationsCount: mockVariations.length,
  approvedCount:   mockVariations.filter(v => v.status === 'approved').length,
  testingCount:    mockVariations.filter(v => v.status === 'testing').length,
  source:          'mock' as const,
};

export async function GET() {
  const authCtx = await getAuthContext();

  if (authCtx.isDemo) {
    return NextResponse.json(MOCK_RESPONSE);
  }

  try {
    const wsFilter = { ad: { campaign: { workspaceId: authCtx.workspaceId } } };

    const [dbEntries, analysesCount, variationsCount, approvedCount, testingCount] =
      await Promise.all([
        prisma.historyEntry.findMany({
          where:   { workspaceId: authCtx.workspaceId },
          include: { relatedAd: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.aIAnalysis.count({ where: wsFilter }),
        prisma.adVariation.count({ where: { originalAd: { campaign: { workspaceId: authCtx.workspaceId } } } }),
        prisma.adVariation.count({ where: { originalAd: { campaign: { workspaceId: authCtx.workspaceId } }, status: 'approved' } }),
        prisma.adVariation.count({ where: { originalAd: { campaign: { workspaceId: authCtx.workspaceId } }, status: 'testing' } }),
      ]);

    if (dbEntries.length === 0) {
      return NextResponse.json(MOCK_RESPONSE);
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
    return NextResponse.json(MOCK_RESPONSE);
  }
}
