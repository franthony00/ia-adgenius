export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';

// ─── Demo seed data ────────────────────────────────────────────────────────────

const CAMPAIGNS = [
  {
    name: 'Summer Brand Awareness',
    objective: 'brand_awareness' as const,
    status: 'active' as const,
    platform: 'instagram' as const,
    dailyBudget: 120,
  },
  {
    name: 'Conversion Push — Google',
    objective: 'conversions' as const,
    status: 'active' as const,
    platform: 'google' as const,
    dailyBudget: 200,
  },
];

const ADS = [
  {
    name: 'FitLife Pro — Summer Special',
    headline: '🔥 Transform Your Body This Summer',
    description: 'Join 50,000+ members who achieved their fitness goals. First month FREE.',
    cta: 'Start Free Trial',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    platform: 'instagram' as const,
    format: 'image' as const,
    status: 'active' as const,
    aiScore: 88,
    spend: 1840, revenue: 9200, impressions: 124500, clicks: 3112, conversions: 184,
    ctr: 2.5, cpc: 0.59, roas: 5.0, cpm: 14.78,
    campaignIdx: 0,
  },
  {
    name: 'GlowLab Skincare — Natural Glow',
    headline: 'Clinically Proven. Naturally Beautiful.',
    description: 'Our bestselling serum with 12,000+ 5-star reviews. Free shipping over $50.',
    cta: 'Shop Now',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
    platform: 'facebook' as const,
    format: 'image' as const,
    status: 'active' as const,
    aiScore: 82,
    spend: 2600, revenue: 9100, impressions: 198000, clicks: 3564, conversions: 213,
    ctr: 1.8, cpc: 0.73, roas: 3.5, cpm: 13.13,
    campaignIdx: 0,
  },
  {
    name: 'NovaSole Running Shoes — Launch',
    headline: 'Run Faster. Feel Nothing. NovaSole.',
    description: 'Carbon fiber sole meets cloud cushioning. Limited launch pricing.',
    cta: 'Get 20% Off',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    platform: 'google' as const,
    format: 'image' as const,
    status: 'active' as const,
    aiScore: 91,
    spend: 3120, revenue: 12480, impressions: 280000, clicks: 4200, conversions: 312,
    ctr: 1.5, cpc: 0.74, roas: 4.0, cpm: 11.14,
    campaignIdx: 1,
  },
  {
    name: 'CaféModal — Morning Ritual',
    headline: 'Your Morning Deserves Better Coffee',
    description: 'Single-origin beans. Roasted weekly. Free tasting kit with first order.',
    cta: 'Try It Free',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    platform: 'instagram' as const,
    format: 'reel' as const,
    status: 'paused' as const,
    aiScore: 74,
    spend: 980, revenue: 1372, impressions: 87000, clicks: 870, conversions: 49,
    ctr: 1.0, cpc: 1.13, roas: 1.4, cpm: 11.26,
    campaignIdx: 0,
  },
  {
    name: 'TechFlow AI — B2B SaaS',
    headline: 'Cut Reporting Time by 80% with AI',
    description: 'Automated analytics for teams of 10+. 14-day free trial, no credit card.',
    cta: 'Start Free Trial',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    platform: 'google' as const,
    format: 'image' as const,
    status: 'active' as const,
    aiScore: 79,
    spend: 4200, revenue: 16800, impressions: 52000, clicks: 1560, conversions: 89,
    ctr: 3.0, cpc: 2.69, roas: 4.0, cpm: 80.77,
    campaignIdx: 1,
  },
];

const HISTORY_ENTRIES = [
  {
    type: 'analysis' as const,
    title: 'AI Analysis — FitLife Pro',
    description: 'Score 88/100 · Hook strength 92 · Recommend increasing budget',
    score: 88,
    model: 'claude_3_5_sonnet' as const,
    adIdx: 0,
  },
  {
    type: 'variation' as const,
    title: 'Variation generated — GlowLab Skincare',
    description: '3 copy variations created · Urgency angle · Predicted +14% CTR',
    model: 'claude_3_5_sonnet' as const,
    adIdx: 1,
  },
  {
    type: 'ad_added' as const,
    title: 'New ad added — NovaSole Running Shoes',
    description: 'Imported from Google Ads · Campaign: Conversion Push',
    adIdx: 2,
  },
  {
    type: 'analysis' as const,
    title: 'AI Analysis — TechFlow AI',
    description: 'Score 79/100 · Good CTR but landing page friction detected',
    score: 79,
    model: 'claude_3_5_sonnet' as const,
    adIdx: 4,
  },
  {
    type: 'metric_update' as const,
    title: 'Metrics synced — 5 ads updated',
    description: 'Last 7 days of performance data refreshed',
  },
];

// ─── POST /api/workspace/seed-demo ────────────────────────────────────────────

export async function POST() {
  const authCtx = await getAuthContext();

  // Demo mode — don't seed; no real workspace
  if (authCtx.isDemo) {
    return NextResponse.json(
      { error: 'Cannot seed in demo mode. Sign in to create your workspace.' },
      { status: 403 },
    );
  }

  const { workspaceId } = authCtx;

  // Guard: idempotent — only seed once
  const existingCount = await prisma.ad.count({
    where: { campaign: { workspaceId } },
  });

  if (existingCount > 0) {
    return NextResponse.json(
      { error: 'Workspace already has data. Seed skipped.', adsExisting: existingCount },
      { status: 409 },
    );
  }

  // ── Create campaigns ──────────────────────────────────────────────────────
  const campaigns = await Promise.all(
    CAMPAIGNS.map(c =>
      prisma.campaign.create({
        data: { ...c, workspaceId },
      }),
    ),
  );

  // ── Create ads ────────────────────────────────────────────────────────────
  const ads = await Promise.all(
    ADS.map(({ campaignIdx, ...adData }) =>
      prisma.ad.create({
        data: {
          ...adData,
          campaignId: campaigns[campaignIdx].id,
        },
      }),
    ),
  );

  // ── Create metric snapshots (last 7 days per ad) ──────────────────────────
  const now = Date.now();
  const snapshotData: {
    adId: string; date: Date; spend: number; revenue: number;
    impressions: number; clicks: number; conversions: number;
    ctr: number; cpc: number; roas: number;
  }[] = [];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(now - dayOffset * 86_400_000);
    const factor = 0.7 + Math.random() * 0.6; // 0.7–1.3 variance per day

    for (const ad of ads) {
      if (ad.status === 'paused' && dayOffset < 3) continue; // paused ads stop mid-week
      snapshotData.push({
        adId:        ad.id,
        date,
        spend:       +(ad.spend / 7 * factor).toFixed(2),
        revenue:     +(ad.revenue / 7 * factor).toFixed(2),
        impressions: Math.round(ad.impressions / 7 * factor),
        clicks:      Math.round(ad.clicks / 7 * factor),
        conversions: Math.round(ad.conversions / 7 * factor),
        ctr:         ad.ctr,
        cpc:         ad.cpc,
        roas:        ad.roas,
      });
    }
  }

  await prisma.metricSnapshot.createMany({ data: snapshotData });

  // ── Create history entries ────────────────────────────────────────────────
  await Promise.all(
    HISTORY_ENTRIES.map(({ adIdx, ...entry }) =>
      prisma.historyEntry.create({
        data: {
          ...entry,
          workspaceId,
          relatedAdId: adIdx !== undefined ? ads[adIdx]?.id : undefined,
          createdAt:   new Date(now - Math.floor(Math.random() * 6) * 86_400_000),
        },
      }),
    ),
  );

  return NextResponse.json({ success: true, adsCreated: ads.length });
}
