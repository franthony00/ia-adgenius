export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/nova/feedback — saves user feedback on a Nova message
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();

    // In demo mode accept silently — nothing to persist
    if (ctx.isDemo) {
      return NextResponse.json({ ok: true, demo: true });
    }

    const body = await req.json() as {
      messageId:    string;
      messageText:  string;
      feedback:     string;
      userMessage?: string;
    };

    // Map string → FeedbackType enum value (only accepted values)
    const validFeedback = ['useful', 'not_useful', 'used', 'saved', 'winner', 'failed'] as const;
    type ValidFeedback = typeof validFeedback[number];
    const feedback = validFeedback.includes(body.feedback as ValidFeedback)
      ? (body.feedback as ValidFeedback)
      : 'useful';

    await prisma.novaFeedback.create({
      data: {
        messageId:   String(body.messageId  ?? '').slice(0, 100),
        messageText: String(body.messageText ?? '').slice(0, 2000),
        feedback,
        userMessage: body.userMessage ? String(body.userMessage).slice(0, 500) : null,
        workspaceId: ctx.workspaceId,
        userId:      ctx.userId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[nova/feedback]', err);
    // Always ok — feedback failure must never break UX
    return NextResponse.json({ ok: true });
  }
}
