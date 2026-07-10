export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/nova/memory — returns workspace memories for context injection
export async function GET() {
  try {
    const ctx = await getAuthContext();

    if (ctx.isDemo) {
      return NextResponse.json({ memories: [] });
    }

    const memories = await prisma.novaMemory.findMany({
      where:   { workspaceId: ctx.workspaceId },
      orderBy: { updatedAt: 'desc' },
      take:    15,
      select:  { type: true, content: true, confidence: true },
    });

    return NextResponse.json({ memories });
  } catch (err) {
    console.error('[nova/memory GET]', err);
    return NextResponse.json({ memories: [] });
  }
}

// POST /api/nova/memory — saves a new memory for the workspace
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();

    if (ctx.isDemo) {
      return NextResponse.json({ ok: true, demo: true });
    }

    const body = await req.json() as {
      type:        string;
      content:     string;
      source?:     string;
      confidence?: number;
    };

    const validTypes = [
      'brand_preference', 'accepted_recommendation', 'rejected_recommendation',
      'winning_copy', 'winning_cta', 'preferred_style', 'preferred_platform',
      'campaign_goal', 'business_context', 'performance_insight',
    ] as const;
    type ValidType = typeof validTypes[number];
    const type = validTypes.includes(body.type as ValidType)
      ? (body.type as ValidType)
      : 'accepted_recommendation';

    const memory = await prisma.novaMemory.create({
      data: {
        type,
        content:    String(body.content ?? '').slice(0, 1000),
        source:     body.source ?? 'user_feedback',
        confidence: Number(body.confidence ?? 70),
        workspaceId: ctx.workspaceId,
        userId:      ctx.userId,
      },
    });

    return NextResponse.json({ ok: true, id: memory.id });
  } catch (err) {
    console.error('[nova/memory POST]', err);
    return NextResponse.json({ ok: true });
  }
}
