import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { mapVariation } from '@/lib/services/mappers';
import { mockVariations } from '@/lib/mock-data';

// UI string → Prisma enum value
function unmapAngle(a: string | undefined): string | null {
  if (!a) return null;
  const MAP: Record<string, string> = {
    'Emocional':          'emocional',
    'Directa':            'directa',
    'Urgencia':           'urgencia',
    'Oferta':             'oferta',
    'Autoridad':          'autoridad',
    'Problema/Solución':  'problema_solucion',
    'Curiosidad':         'curiosidad',
    'Social Proof':       'social_proof',
    'UGC':                'ugc',
  };
  return MAP[a] ?? null;
}

function unmapModel(m: string): string {
  const MAP: Record<string, string> = {
    'claude-3-5-sonnet': 'claude_3_5_sonnet',
    'claude-opus-4':     'claude_opus_4',
    'gpt-4o':            'gpt_4o',
    'gemini-1.5-pro':    'gemini_1_5_pro',
  };
  return MAP[m] ?? 'claude_3_5_sonnet';
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adId = searchParams.get('adId');

  const authCtx = await getAuthContext();

  if (authCtx.isDemo) {
    const fallback = adId ? mockVariations.filter(v => v.originalAdId === adId) : mockVariations;
    return NextResponse.json({ variations: fallback, source: 'mock' });
  }

  try {
    const dbVariations = await prisma.adVariation.findMany({
      where: {
        originalAd: { campaign: { workspaceId: authCtx.workspaceId } },
        ...(adId ? { originalAdId: adId } : {}),
      },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request) {
  const authCtx = await getAuthContext();

  if (authCtx.isDemo) {
    return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
  }

  try {
    const { originalAdId, variations } = await req.json();

    // Verify the source ad belongs to this workspace
    const dbAd = await prisma.ad.findFirst({
      where: { id: originalAdId, campaign: { workspaceId: authCtx.workspaceId } },
    });
    if (!dbAd) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    const created = await prisma.$transaction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (variations as any[]).map(v =>
        prisma.adVariation.create({
          data: {
            headline:            v.headline,
            description:         v.description,
            cta:                 v.cta,
            imageUrl:            v.imageUrl    || null,
            imagePrompt:         v.imagePrompt || null,
            predictedCTR:        v.predictedCTR,
            predictedCPC:        v.predictedCPC ?? null,
            predictedROAS:       v.predictedROAS,
            confidence:          v.confidence  ?? null,
            angle:               unmapAngle(v.angle) as never ?? null,
            recommendedPlatform: v.recommendedPlatform as never ?? null,
            status:              (v.status     || 'pending') as never,
            model:               unmapModel(v.model)          as never,
            rationale:           v.rationale,
            changeType:          (v.changeType || 'copy')     as never,
            originalAdId,
          },
          include: { originalAd: true },
        }),
      ),
    );

    await prisma.historyEntry.create({
      data: {
        type:        'variation',
        title:       `${created.length} variation${created.length > 1 ? 's' : ''} generated`,
        description: `Generated ${created.length} variation${created.length > 1 ? 's' : ''} for "${dbAd.name}"`,
        workspaceId: authCtx.workspaceId,
        relatedAdId: originalAdId,
      },
    });

    return NextResponse.json({ variations: created.map(mapVariation), source: 'db' });
  } catch (err) {
    console.error('[POST /api/variations]', err);
    return NextResponse.json({ error: 'Failed to save variations' }, { status: 500 });
  }
}
