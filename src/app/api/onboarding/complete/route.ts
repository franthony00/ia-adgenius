export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';

export async function POST(req: Request) {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) return NextResponse.json({ success: true });

  const body = await req.json() as {
    businessName?: string;
    businessType?: string;
    primaryColor?: string;
    targetAudience?: string;
    tone?: string;
    visualStyle?: string;
  };

  await prisma.brandKit.upsert({
    where: { workspaceId: authCtx.workspaceId },
    create: {
      workspaceId: authCtx.workspaceId,
      businessName: body.businessName || null,
      businessType: body.businessType || null,
      primaryColor: body.primaryColor || null,
      targetAudience: body.targetAudience || null,
      tone: body.tone || null,
      visualStyle: body.visualStyle || null,
    },
    update: {
      businessName: body.businessName || undefined,
      businessType: body.businessType || undefined,
      primaryColor: body.primaryColor || undefined,
      targetAudience: body.targetAudience || undefined,
      tone: body.tone || undefined,
      visualStyle: body.visualStyle || undefined,
    },
  });

  // Create a history entry (non-critical)
  try {
    await prisma.historyEntry.create({
      data: {
        type: 'ad_added',
        title: 'Workspace configured',
        description: `Brand setup complete${body.businessName ? ` for ${body.businessName}` : ''}`,
        workspaceId: authCtx.workspaceId,
      },
    });
  } catch {
    /* non-critical */
  }

  return NextResponse.json({ success: true });
}
