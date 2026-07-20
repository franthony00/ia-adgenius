export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { generateAdVariations } from '@/lib/ai-services';
import { mockAds } from '@/lib/mock-data';
import { getVariationLimit } from '@/lib/plan-gates';
import type { AdVariation } from '@/lib/types';

// ─── DALL-E image generation helper ───────────────────────────────────────────

const UNSPLASH_FALLBACK = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1024&q=80&fm=jpg&fit=crop';

async function generateImage(prompt: string, platform: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return UNSPLASH_FALLBACK;

  try {
    const client = new OpenAI({ apiKey });
    const fullPrompt =
      `${prompt}. ` +
      `Optimized for ${platform} ad. ` +
      'High-quality commercial advertising photography. ' +
      'No text, no logos, no watermarks. Clean composition, professional lighting.';

    type ImgItem = { b64_json?: string; url?: string };
    type ImgResult = { data: ImgItem[] };

    const response = await (client.images.generate as (p: object) => Promise<ImgResult>)({
      model:   'gpt-image-1',
      prompt:  fullPrompt,
      n:       1,
      size:    '1024x1024',
      quality: 'medium',
    });

    const item = response.data?.[0];
    if (!item?.b64_json && !item?.url) return UNSPLASH_FALLBACK;
    return item.url ?? `data:image/png;base64,${item.b64_json}`;
  } catch (err) {
    console.error('[generateImage] DALL-E error:', err);
    return UNSPLASH_FALLBACK;
  }
}

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

    // Generate images in parallel for visual/both modes when imagePrompt is present
    const needsImages = mode === 'visual' || mode === 'both';
    const imageUrls: string[] = needsImages
      ? await Promise.all(
          generated.map(v =>
            v.imagePrompt
              ? generateImage(v.imagePrompt, ad.platform)
              : Promise.resolve(ad.imageUrl ?? UNSPLASH_FALLBACK),
          ),
        )
      : generated.map(() => ad.imageUrl ?? '');

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
      imageUrl:            imageUrls[i] ?? ad.imageUrl ?? '',
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
      imagesSource: needsImages ? (process.env.OPENAI_API_KEY ? 'dall-e-3' : 'unsplash_fallback') : 'none',
    });
  } catch (err) {
    console.error('[POST /api/variations/generate]', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
