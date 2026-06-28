export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';

export async function POST(req: Request) {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    // Allow demo mode to record feedback locally (200 but no DB)
    return NextResponse.json({ success: true, source: 'demo' });
  }
  try {
    const body = await req.json();
    const { recommendationId, feedbackType, notes } = body;

    if (!recommendationId || !feedbackType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const feedback = await prisma.recommendationFeedback.create({
      data: {
        workspaceId: authCtx.workspaceId,
        recommendationId,
        feedbackType,
        notes,
      },
    });
    return NextResponse.json({ feedback, source: 'db' });
  } catch (err) {
    console.error('[POST /api/recommendations/feedback]', err);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}

export async function GET() {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ feedback: [], source: 'demo' });
  }
  try {
    const feedback = await prisma.recommendationFeedback.findMany({
      where: { workspaceId: authCtx.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ feedback, source: 'db' });
  } catch (err) {
    console.error('[GET /api/recommendations/feedback]', err);
    return NextResponse.json({ feedback: [], source: 'error' });
  }
}
