export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const existing = await prisma.creativeVariation.findFirst({
      where: { id, workspaceId: authCtx.workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const variation = await prisma.creativeVariation.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ variation, source: 'db' });
  } catch (err) {
    console.error('[PUT /api/creative-variations/:id]', err);
    return NextResponse.json({ error: 'Failed to update variation' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
  }
  try {
    const existing = await prisma.creativeVariation.findFirst({
      where: { id, workspaceId: authCtx.workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.creativeVariation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/creative-variations/:id]', err);
    return NextResponse.json({ error: 'Failed to delete variation' }, { status: 500 });
  }
}
