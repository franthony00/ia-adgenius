export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';

// ─── GET /api/workspace/settings ─────────────────────────────────────────────
export async function GET() {
  const ctx = await getAuthContext();
  if (ctx.isDemo) {
    return NextResponse.json({ source: 'demo', settings: null });
  }

  try {
    const ws = await prisma.workspace.findUnique({
      where:  { id: ctx.workspaceId },
      select: {
        name:           true,
        timezone:       true,
        currency:       true,
        aiModel:        true,
        aiTemperature:  true,
        notifChannels:  true,
        notifEvents:    true,
        slackWebhookUrl: true,
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ source: 'db', settings: ws });
  } catch (err) {
    console.error('[GET /api/workspace/settings]', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

// ─── PUT /api/workspace/settings ─────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const ctx = await getAuthContext();
  if (ctx.isDemo) {
    return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
  }

  try {
    const body = await req.json() as {
      name?:           string;
      timezone?:       string;
      currency?:       string;
      aiModel?:        string;
      aiTemperature?:  number;
      notifChannels?:  Record<string, boolean>;
      notifEvents?:    Record<string, boolean>;
      slackWebhookUrl?: string;
    };

    const ws = await prisma.workspace.update({
      where: { id: ctx.workspaceId },
      data: {
        ...(body.name            !== undefined && { name: body.name }),
        ...(body.timezone        !== undefined && { timezone: body.timezone }),
        ...(body.currency        !== undefined && { currency: body.currency }),
        ...(body.aiModel         !== undefined && { aiModel: body.aiModel }),
        ...(body.aiTemperature   !== undefined && { aiTemperature: body.aiTemperature }),
        ...(body.notifChannels   !== undefined && { notifChannels: body.notifChannels }),
        ...(body.notifEvents     !== undefined && { notifEvents: body.notifEvents }),
        ...(body.slackWebhookUrl !== undefined && { slackWebhookUrl: body.slackWebhookUrl }),
      },
      select: {
        name: true, timezone: true, currency: true,
        aiModel: true, aiTemperature: true,
        notifChannels: true, notifEvents: true, slackWebhookUrl: true,
      },
    });

    return NextResponse.json({ source: 'db', settings: ws });
  } catch (err) {
    console.error('[PUT /api/workspace/settings]', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
