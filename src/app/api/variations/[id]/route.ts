export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';
import { mapVariation } from '@/lib/services/mappers';
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
  }
  try {
    const { status } = await req.json();
    // Verify variation belongs to this workspace
    const existing = await prisma.adVariation.findFirst({
      where: { id, originalAd: { campaign: { workspaceId: authCtx.workspaceId } } },
      include: { originalAd: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }
    const updated = await prisma.adVariation.update({
      where:   { id },
      data:    { status: status as never },
      include: { originalAd: true },
    });
    await prisma.historyEntry.create({
      data: {
        type:        'status_change',
        title:       `Variation ${status}`,
        description: `Variation of "${existing.originalAd.name}" marked as ${status}`,
        workspaceId: authCtx.workspaceId,
        relatedAdId: existing.originalAdId,
      },
    });
    return NextResponse.json({ variation: mapVariation(updated), source: 'db' });
  } catch (err) {
    console.error(`[PATCH /api/variations/${id}]`, err);
    return NextResponse.json({ error: 'Failed to update variation' }, { status: 500 });
  }
}
