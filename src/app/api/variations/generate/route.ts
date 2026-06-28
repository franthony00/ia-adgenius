export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { generateAdVariations } from '@/lib/ai-services';
import { mockAds } from '@/lib/mock-data';
import { getVariationLimit } from '@/lib/plan-gates';
import type { AdVariation } from '@/lib/types';

// ─── POST /api/variations/generate ────────────────────────────────────────────
// Generates AI-powered ad variations without persisting them.
// The client persists via POST /api/variations once the user reviews the results.

export async function POST(req: NextRequest) {
  const authCtx = await getAuthContext();

  let adId: string, mode: string, count: number, model: string;
  try {
    const body = await req.json() as {
      adId?: string; mode?: string; count?: number; model?: string;
    };
    adId  = body.adId  ?? '';
    mode  = body.mode  ?? 'both';
    count = Math.min(Math.max(Number(body.count) || 2, 1), getVariationLimit(authCtx.planId));
    model = body.model ?? 'claude-3-5-sonnet';
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!adId) {
    return NextResponse.json({ error: 'adId is required' }, { status: 400 });
  }

  if (!['copy', 'visual', 'both'].includes(mode)) {
    return NextResponse.json({ error: 'mode must be copy | visual | both' }, { status: 400 });
  }

  try {
    // Resolve ad — from DB for authenticated users, from mock for demo
    let ad: {
      id: string; name: string; headline: string; description: string;
      cta: string; platform: string; imageUrl?: string | null;
      objective?: string;
    };

    if (authCtx.isDemo) {
      const mockAd = mockAds.find(a => a.id === adId);
      if (!mockAd) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
      ad = {
        id:          mockAd.id,
        name:        mockAd.name,
        headline:    mockAd.headline,
        description: mockAd.description,
        cta:         mockAd.cta,
        platform:    mockAd.platform,
        imageUrl:    mockAd.imageUrl,
        objective:   mockAd.objective,
      };
    } else {
      const dbAd = await prisma.ad.findFirst({
        where:   { id: adId, campaign: { workspaceId: authCtx.workspaceId } },
        include: { campaign: { select: { objective: true } } },
      });
      if (!dbAd) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
      ad = {
        id:          dbAd.id,
        name:        dbAd.name,
        headline:    dbAd.headline,
        description: dbAd.description,
        cta:         dbAd.cta,
        platform:    dbAd.platform,
        imageUrl:    dbAd.imageUrl,
        objective:   dbAd.campaign?.objective ?? 'conversions',
      };
    }

    const generated = await generateAdVariations({
      adId:        ad.id,
      adName:      ad.name,
      headline:    ad.headline,
      description: ad.description,
      cta:         ad.cta,
      platform:    ad.platform,
      objective:   ad.objective ?? 'conversions',
      imageUrl:    ad.imageUrl,
      mode:        mode as 'copy' | 'visual' | 'both',
      count,
    });

    const now = new Date().toISOString();
    const variations: AdVariation[] = generated.map((v, i) => ({
      id:                  `gen-${ad.id}-${mode}-${i}-${Date.now()}`,
      originalAdId:        ad.id,
      originalAdName:      ad.name,
      createdAt:           now,
      headline:            v.headline,
      description:         v.description,
      cta:                 v.cta,
      imagePrompt:         v.imagePrompt,
      imageUrl:            ad.imageUrl ?? '',
      predictedCTR:        v.predictedCTR,
      predictedCPC:        v.predictedCPC,
      predictedROAS:       v.predictedROAS,
      confidence:          v.confidence,
      angle:               v.angle  as AdVariation['angle'],
      recommendedPlatform: v.recommendedPlatform as AdVariation['recommendedPlatform'],
      status:              'pending',
      model:               model as AdVariation['model'],
      rationale:           v.rationale,
      changeType:          v.changeType,
    }));

    return NextResponse.json({
      variations,
      source: process.env.ANTHROPIC_API_KEY ? 'ai' : 'demo',
    });
  } catch (err) {
    console.error('[POST /api/variations/generate]', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
