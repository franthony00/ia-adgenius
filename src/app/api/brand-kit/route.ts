export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';

export async function GET() {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ brandKit: null, source: 'demo' });
  }
  try {
    const brandKit = await prisma.brandKit.findUnique({
      where: { workspaceId: authCtx.workspaceId },
    });
    return NextResponse.json({ brandKit, source: 'db' });
  } catch (err) {
    console.error('[GET /api/brand-kit]', err);
    return NextResponse.json({ brandKit: null, source: 'error' });
  }
}

export async function PUT(req: Request) {
  const authCtx = await getAuthContext();
  if (authCtx.isDemo) {
    return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const {
      businessName, logoUrl, primaryColor, secondaryColor,
      businessType, services, phone, whatsapp, address,
      instagram, facebook, tone, targetAudience, visualStyle,
      frequentOffers, preferredCTAs,
    } = body;

    const brandKit = await prisma.brandKit.upsert({
      where: { workspaceId: authCtx.workspaceId },
      create: {
        workspaceId: authCtx.workspaceId,
        businessName, logoUrl, primaryColor, secondaryColor,
        businessType, services: services ?? [], phone, whatsapp, address,
        instagram, facebook, tone, targetAudience, visualStyle,
        frequentOffers: frequentOffers ?? [], preferredCTAs: preferredCTAs ?? [],
      },
      update: {
        businessName, logoUrl, primaryColor, secondaryColor,
        businessType, services: services ?? [], phone, whatsapp, address,
        instagram, facebook, tone, targetAudience, visualStyle,
        frequentOffers: frequentOffers ?? [], preferredCTAs: preferredCTAs ?? [],
      },
    });
    return NextResponse.json({ brandKit, source: 'db' });
  } catch (err) {
    console.error('[PUT /api/brand-kit]', err);
    return NextResponse.json({ error: 'Failed to save Brand Kit' }, { status: 500 });
  }
}
