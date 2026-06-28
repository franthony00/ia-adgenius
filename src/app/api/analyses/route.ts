export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { mapAnalysis } from '@/lib/services/mappers';
import { mockAnalyses } from '@/lib/mock-data';
import { analyzeAd } from '@/lib/ai-services';
import { hasFeature } from '@/lib/plan-gates';

// ─── GET /api/analyses ─────────────────────────────────────────────────────────

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

// ─── POST /api/analyses ────────────────────────────────────────────────────────

const MODEL_MAP: Record<string, string> = {
  'claude-3-5-sonnet': 'claude_3_5_sonnet',
  'claude-opus-4':     'claude_opus_4',
};

export async function POST(req: NextRequest) {
  const authCtx = await getAuthContext();

  if (!hasFeature(authCtx.planId, 'analyses')) {
    return NextResponse.json(
      { error: 'Ad analysis requires Pro plan or higher.', requiredPlan: 'pro' },
      { status: 403 },
    );
  }

  let adId: string;
  let model: string;
  try {
    const body = await req.json() as { adId?: string; model?: string };
    adId  = body.adId  ?? '';
    model = body.model ?? 'claude-3-5-sonnet';
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!adId) {
    return NextResponse.json({ error: 'adId is required' }, { status: 400 });
  }

  // In demo mode we still run real AI (if key is set) but don't persist to DB
  if (authCtx.isDemo) {
    try {
      const mockAd = (await import('@/lib/mock-data')).mockAds.find((a) => a.id === adId);
      if (!mockAd) {
        return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
      }
      const result = await analyzeAd({
        adId:        mockAd.id,
        adName:      mockAd.name,
        imageUrl:    mockAd.imageUrl,
        headline:    mockAd.headline,
        description: mockAd.description,
        cta:         mockAd.cta,
        platform:    mockAd.platform,
        roas:        mockAd.metrics?.roas,
        ctr:         mockAd.metrics?.ctr,
        spend:       mockAd.metrics?.spend,
      });
      return NextResponse.json({
        analysis: {
          id:                  `demo-${Date.now()}`,
          adId:                mockAd.id,
          adName:              mockAd.name,
          createdAt:           new Date().toISOString(),
          model,
          ...result,
        },
        source: 'ai',
      });
    } catch (err) {
      console.error('[POST /api/analyses] demo mode error', err);
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }
  }

  // Authenticated mode — fetch real ad and persist
  try {
    const ad = await prisma.ad.findFirst({
      where: {
        id:       adId,
        campaign: { workspaceId: authCtx.workspaceId },
      },
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    const result = await analyzeAd({
      adId:        ad.id,
      adName:      ad.name,
      imageUrl:    ad.imageUrl,
      headline:    ad.headline,
      description: ad.description,
      cta:         ad.cta,
      platform:    ad.platform,
      roas:        ad.roas,
      ctr:         ad.ctr,
      spend:       ad.spend,
    });

    const prismaModel = MODEL_MAP[model] ?? 'claude_3_5_sonnet';

    const saved = await prisma.aIAnalysis.create({
      data: {
        adId:                ad.id,
        model:               prismaModel as never,
        overallScore:        result.overallScore,
        copyScore:           result.copyScore,
        visualScore:         result.visualScore,
        audienceScore:       result.audienceScore,
        hookStrength:        result.hookStrength,
        estimatedCTR:        result.estimatedCTR,
        estimatedROAS:       result.estimatedROAS,
        strengths:           result.strengths,
        weaknesses:          result.weaknesses,
        recommendations:     result.recommendations,
        patterns:            result.patterns,
        sentiment:           result.sentiment as never,
        predictedPerformance: result.predictedPerformance as never,
      },
      include: { ad: true },
    });

    // Also update the ad's aiScore
    await prisma.ad.update({
      where: { id: ad.id },
      data:  { aiScore: result.overallScore },
    });

    return NextResponse.json({ analysis: mapAnalysis(saved), source: 'ai' });
  } catch (err) {
    console.error('[POST /api/analyses]', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
