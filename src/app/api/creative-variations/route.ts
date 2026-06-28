export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { generateCreativePrompt } from '@/lib/ai-services';

export async function GET() {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ variations: [], source: 'demo' });
  }
  try {
    const variations = await prisma.creativeVariation.findMany({
      where: { workspaceId: authCtx.workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ variations, source: 'db' });
  } catch (err) {
    console.error('[GET /api/creative-variations]', err);
    return NextResponse.json({ variations: [], source: 'error' });
  }
}

export async function POST(req: Request) {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { title, description, format, style, objective, headline, copy, cta, phone, notes } = body;

    // Generate image prompt via AI service stub
    const imagePrompt = await generateCreativePrompt({
      format, style, objective, headline, copy,
    });

    const variation = await prisma.creativeVariation.create({
      data: {
        workspaceId: authCtx.workspaceId,
        title: title ?? 'Sin título',
        description,
        format: format ?? 'instagram_post',
        style: style ?? 'premium',
        objective: objective ?? 'awareness',
        headline,
        copy,
        cta,
        phone: phone || null,
        imagePrompt,
        status: 'ready',
        notes,
      },
    });
    return NextResponse.json({ variation, source: 'db' });
  } catch (err) {
    console.error('[POST /api/creative-variations]', err);
    return NextResponse.json({ error: 'Failed to create variation' }, { status: 500 });
  }
}
