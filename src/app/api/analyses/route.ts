import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { mapAnalysis } from '@/lib/services/mappers';
import { mockAnalyses } from '@/lib/mock-data';

export async function GET() {
  const authCtx = await getAuthContext();

  if (authCtx.isDemo) {
    return NextResponse.json({ analyses: mockAnalyses, source: 'mock' });
  }

  try {
    const dbAnalyses = await prisma.aIAnalysis.findMany({
      where:   { ad: { campaign: { workspaceId: authCtx.workspaceId } } },
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
