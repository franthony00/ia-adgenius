import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ── User ──────────────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: 'demo@adgenius.ai' },
    update: {},
    create: {
      id: 'user_demo',
      email: 'demo@adgenius.ai',
      name: 'Alex Rivera',
      avatarUrl: null,
    },
  });

  // ── Workspace ─────────────────────────────────────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'adgenius-demo' },
    update: {},
    create: {
      id: 'ws_demo',
      name: 'AdGenius Demo',
      slug: 'adgenius-demo',
    },
  });

  // ── WorkspaceMember ───────────────────────────────────────────────────────
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: 'owner',
    },
  });

  // ── Subscription ──────────────────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      planId: 'pro',
      status: 'active',
      currentPeriodStart: new Date('2026-05-01T00:00:00Z'),
      currentPeriodEnd: new Date('2026-06-01T00:00:00Z'),
    },
  });

  // ── ConnectedAccount ──────────────────────────────────────────────────────
  const metaAccount = await prisma.connectedAccount.upsert({
    where: { id: 'ca_meta_demo' },
    update: {},
    create: {
      id: 'ca_meta_demo',
      workspaceId: workspace.id,
      platform: 'meta',
      name: 'AdGenius Demo · Meta Business',
      externalAccountId: 'act_827461930',
      status: 'connected',
      connectedAt: new Date('2026-02-14T10:00:00Z'),
      lastSyncAt: new Date('2026-05-06T06:00:00Z'),
      tokenExpiresAt: new Date('2026-07-04T10:00:00Z'),
      adsImported: 24,
      campaignsImported: 4,
      currency: 'USD',
      timezone: 'America/New_York',
    },
  });

  // ── SyncHistory ───────────────────────────────────────────────────────────
  const syncRecords = [
    { id: 'sync1', status: 'success' as const, adsImported: 24, campaignsImported: 4, startedAt: new Date('2026-05-06T06:00:00Z'), finishedAt: new Date('2026-05-06T06:02:41Z') },
    { id: 'sync2', status: 'success' as const, adsImported: 21, campaignsImported: 4, startedAt: new Date('2026-04-29T06:00:00Z'), finishedAt: new Date('2026-04-29T06:01:58Z') },
    { id: 'sync3', status: 'error' as const, adsImported: 0, campaignsImported: 0, startedAt: new Date('2026-04-22T07:30:00Z'), finishedAt: new Date('2026-04-22T07:30:08Z'), note: 'Rate limit reached — retried automatically after 2 hours' },
    { id: 'sync4', status: 'success' as const, adsImported: 19, campaignsImported: 3, startedAt: new Date('2026-04-15T06:00:00Z'), finishedAt: new Date('2026-04-15T06:01:44Z') },
  ];
  for (const s of syncRecords) {
    await prisma.syncHistory.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, connectedAccountId: metaAccount.id },
    });
  }

  // ── Campaigns ─────────────────────────────────────────────────────────────
  const campaigns = [
    { id: 'c1', name: 'Q1 Brand Awareness',      objective: 'brand_awareness' as const, platform: 'facebook' as const, status: 'active' as const,    dailyBudget: 500,  totalBudget: 15000, startDate: new Date('2026-01-01') },
    { id: 'c2', name: 'Spring Conversion Push',   objective: 'conversions' as const,     platform: 'google' as const,   status: 'active' as const,    dailyBudget: 830,  totalBudget: 25000, startDate: new Date('2026-03-01') },
    { id: 'c3', name: 'TikTok Gen-Z Launch',      objective: 'traffic' as const,         platform: 'tiktok' as const,   status: 'paused' as const,    dailyBudget: 267,  totalBudget: 8000,  startDate: new Date('2026-02-01') },
    { id: 'c4', name: 'LinkedIn B2B Leads',       objective: 'lead_generation' as const, platform: 'linkedin' as const, status: 'active' as const,    dailyBudget: 250,  totalBudget: 7500,  startDate: new Date('2026-03-15') },
  ];
  for (const c of campaigns) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, workspaceId: workspace.id },
    });
  }

  // ── Ads ───────────────────────────────────────────────────────────────────
  const FITNESS_IMG = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80';
  const COFFEE_IMG  = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80';
  const SHOE_IMG    = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80';
  const SKIN_IMG    = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80';
  const TECH_IMG    = 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80';
  const TRAVEL_IMG  = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80';
  const FOOD_IMG    = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80';
  const FASHION_IMG = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80';

  const ads = [
    {
      id: 'ad1', name: 'FitLife — Pain Point Hero',
      headline: 'Stop Wasting Hours at the Gym — Real Results in 30 Days',
      description: '94% of our users see measurable progress in their first month. AI-powered coaching. 30-day money-back guarantee.',
      cta: 'Start Free Trial', imageUrl: FITNESS_IMG, format: 'image' as const,
      platform: 'facebook' as const, status: 'active' as const, aiScore: 91, campaignId: 'c1',
      spend: 18240, revenue: 128900, impressions: 432000, clicks: 19440,
      conversions: 312, ctr: 4.5, cpc: 0.94, cpm: 42.22, cpa: 58.46, roas: 7.07, reach: 398000, frequency: 1.09,
    },
    {
      id: 'ad2', name: 'BrewHaven — Morning Ritual',
      headline: 'Your Morning Deserves Better Than Grocery Store Coffee',
      description: 'Single-origin beans, roasted to order, delivered to your door in 48 hours. Taste the difference from the very first cup.',
      cta: 'Shop Now', imageUrl: COFFEE_IMG, format: 'image' as const,
      platform: 'instagram' as const, status: 'active' as const, aiScore: 78, campaignId: 'c2',
      spend: 12800, revenue: 50688, impressions: 298000, clicks: 9567,
      conversions: 184, ctr: 3.21, cpc: 1.34, cpm: 42.95, cpa: 69.57, roas: 3.96, reach: 276000, frequency: 1.08,
    },
    {
      id: 'ad3', name: 'NovaSole — Speed vs Style',
      headline: 'Built for PRs. Worn at Brunch.',
      description: 'The performance shoe that doesn\'t compromise on style. 12,000+ five-star reviews. Free returns for 30 days.',
      cta: 'Shop the Drop', imageUrl: SHOE_IMG, format: 'image' as const,
      platform: 'tiktok' as const, status: 'active' as const, aiScore: 87, campaignId: 'c3',
      spend: 7200, revenue: 36720, impressions: 166000, clicks: 9462,
      conversions: 142, ctr: 5.70, cpc: 0.76, cpm: 43.37, cpa: 50.70, roas: 5.10, reach: 152000, frequency: 1.09,
    },
    {
      id: 'ad4', name: 'GlowLab — Before/After Authority',
      headline: 'Dermatologist-Developed Skincare That Actually Works',
      description: 'See visible results in 21 days or your money back. No harsh chemicals. No empty promises. Just science that works.',
      cta: 'Try Risk-Free', imageUrl: SKIN_IMG, format: 'image' as const,
      platform: 'instagram' as const, status: 'active' as const, aiScore: 95, campaignId: 'c2',
      spend: 6400, revenue: 52480, impressions: 145000, clicks: 10298,
      conversions: 290, ctr: 7.10, cpc: 0.62, cpm: 44.14, cpa: 22.07, roas: 8.20, reach: 134000, frequency: 1.08,
    },
    {
      id: 'ad5', name: 'Nexus AI — B2B Efficiency',
      headline: 'Cut Operational Costs 40% with AI — Without Replacing Your Team',
      description: 'Nexus AI integrates with your existing tools. No migration. No downtime. Enterprise clients report 40% cost reduction in under 90 days.',
      cta: 'Book a Demo', imageUrl: TECH_IMG, format: 'image' as const,
      platform: 'linkedin' as const, status: 'active' as const, aiScore: 82, campaignId: 'c4',
      spend: 7500, revenue: 67500, impressions: 89000, clicks: 1958,
      conversions: 47, ctr: 2.20, cpc: 3.83, cpm: 84.27, cpa: 159.57, roas: 9.00, reach: 85000, frequency: 1.05,
    },
    {
      id: 'ad6', name: 'Wanderlux — Scarcity Escape',
      headline: 'Only 12 Spots Left — Private Bali Villa, June 14–21',
      description: 'Curated luxury escapes for the discerning traveller. All-inclusive. Boutique capacity. Experiences you won\'t find on booking sites.',
      cta: 'Reserve My Spot', imageUrl: TRAVEL_IMG, format: 'image' as const,
      platform: 'facebook' as const, status: 'paused' as const, aiScore: 73, campaignId: 'c1',
      spend: 9800, revenue: 42140, impressions: 185000, clicks: 14469,
      conversions: 68, ctr: 7.82, cpc: 0.68, cpm: 52.97, cpa: 144.12, roas: 4.30, reach: 172000, frequency: 1.08,
    },
    {
      id: 'ad7', name: 'TasteLab — UGC Recipe Hook',
      headline: 'I Made a Restaurant-Quality Dinner in 15 Minutes (Here\'s How)',
      description: 'TasteLab sends you chef-designed meal kits with pre-prepped ingredients. 15-minute recipes. Zero grocery runs. First box 60% off.',
      cta: 'Claim 60% Off', imageUrl: FOOD_IMG, format: 'video' as const,
      platform: 'tiktok' as const, status: 'draft' as const, aiScore: undefined, campaignId: 'c2',
      spend: 0, revenue: 0, impressions: 0, clicks: 0,
      conversions: 0, ctr: 0, cpc: 0, roas: 0,
    },
    {
      id: 'ad8', name: 'LuxeThread — Minimalist CTA',
      headline: 'Wear Less. Mean More.',
      description: 'Premium minimalist wardrobe essentials. Sustainably sourced. Designed to outlast trends. New arrivals every Thursday.',
      cta: 'Shop New Arrivals', imageUrl: FASHION_IMG, format: 'image' as const,
      platform: 'instagram' as const, status: 'completed' as const, aiScore: 68, campaignId: 'c1',
      spend: 14800, revenue: 59200, impressions: 312000, clicks: 8424,
      conversions: 148, ctr: 2.70, cpc: 1.76, cpm: 47.44, cpa: 100.00, roas: 4.00, reach: 296000, frequency: 1.05,
    },
  ];

  for (const { campaignId, aiScore, ...ad } of ads) {
    await prisma.ad.upsert({
      where: { id: ad.id },
      update: {},
      create: {
        ...ad,
        aiScore: aiScore ?? null,
        campaignId,
      },
    });
  }

  // ── MetricSnapshots (one per active/paused/completed ad) ──────────────────
  const snapshots = [
    { adId: 'ad1', spend: 18240, revenue: 128900, impressions: 432000, clicks: 19440, conversions: 312, ctr: 4.5,  cpc: 0.94, cpm: 42.22, cpa: 58.46,  roas: 7.07, reach: 398000, frequency: 1.09 },
    { adId: 'ad2', spend: 12800, revenue: 50688,  impressions: 298000, clicks: 9567,  conversions: 184, ctr: 3.21, cpc: 1.34, cpm: 42.95, cpa: 69.57,  roas: 3.96, reach: 276000, frequency: 1.08 },
    { adId: 'ad3', spend: 7200,  revenue: 36720,  impressions: 166000, clicks: 9462,  conversions: 142, ctr: 5.70, cpc: 0.76, cpm: 43.37, cpa: 50.70,  roas: 5.10, reach: 152000, frequency: 1.09 },
    { adId: 'ad4', spend: 6400,  revenue: 52480,  impressions: 145000, clicks: 10298, conversions: 290, ctr: 7.10, cpc: 0.62, cpm: 44.14, cpa: 22.07,  roas: 8.20, reach: 134000, frequency: 1.08 },
    { adId: 'ad5', spend: 7500,  revenue: 67500,  impressions: 89000,  clicks: 1958,  conversions: 47,  ctr: 2.20, cpc: 3.83, cpm: 84.27, cpa: 159.57, roas: 9.00, reach: 85000,  frequency: 1.05 },
    { adId: 'ad6', spend: 9800,  revenue: 42140,  impressions: 185000, clicks: 14469, conversions: 68,  ctr: 7.82, cpc: 0.68, cpm: 52.97, cpa: 144.12, roas: 4.30, reach: 172000, frequency: 1.08 },
    { adId: 'ad8', spend: 14800, revenue: 59200,  impressions: 312000, clicks: 8424,  conversions: 148, ctr: 2.70, cpc: 1.76, cpm: 47.44, cpa: 100.00, roas: 4.00, reach: 296000, frequency: 1.05 },
  ];
  for (const snap of snapshots) {
    await prisma.metricSnapshot.create({ data: { ...snap, date: new Date('2026-05-06T06:00:00Z') } });
  }

  // ── AIAnalyses ────────────────────────────────────────────────────────────
  const analyses = [
    {
      id: 'ana1', adId: 'ad1', model: 'claude_3_5_sonnet' as const,
      overallScore: 91, copyScore: 94, visualScore: 87, audienceScore: 92, hookStrength: 96,
      estimatedCTR: 4.9, estimatedROAS: 7.1,
      strengths: [
        'Hook directly addresses a universal pain point ("wasting hours") — triggers immediate emotional resonance',
        'Social proof number (94%) is specific and believable — vague % claims often feel fabricated',
        'Money-back guarantee removes the primary purchase objection before it forms',
        'Call-to-action "Start Free Trial" lowers commitment friction to near-zero',
      ],
      weaknesses: [
        'Image shows generic gym stock photo — a real user transformation would outperform 3x',
        'Description lacks a specific time-to-result claim beyond "30 days"',
        'No mention of the AI element in the headline — missed differentiation opportunity',
      ],
      recommendations: [
        'Replace stock image with before/after UGC transformation photo — test with real user consent',
        'Add "in just 20 minutes/day" to headline for specificity: "Stop Wasting Hours at the Gym — 20 min is enough"',
        'Test a curiosity variant: "The 20-Minute Workout Secret 50,000 Athletes Use"',
        'Add a subtle countdown or limited-offer element to test urgency lift',
      ],
      patterns: [
        { name: 'Pain-Point Hook', description: 'Opens with user frustration before the solution', impact: 'positive', confidence: 97, frequency: 12 },
        { name: 'Specific Social Proof', description: 'Uses precise % instead of round numbers', impact: 'positive', confidence: 89, frequency: 8 },
        { name: 'Risk Reversal', description: 'Money-back guarantee in body copy', impact: 'positive', confidence: 94, frequency: 6 },
        { name: 'Generic Visual', description: 'Stock image without human transformation', impact: 'negative', confidence: 82, frequency: 15 },
      ],
      sentiment: 'positive' as const, predictedPerformance: 'high' as const,
      createdAt: new Date('2026-04-10T14:32:00Z'),
    },
    {
      id: 'ana2', adId: 'ad4', model: 'claude_opus_4' as const,
      overallScore: 95, copyScore: 97, visualScore: 93, audienceScore: 91, hookStrength: 94,
      estimatedCTR: 6.2, estimatedROAS: 7.8,
      strengths: [
        '"Dermatologist-Developed" establishes authority in first two words — crucial for skeptical skincare buyers',
        '"Actually Works" disarms cynicism by acknowledging the category\'s credibility problem',
        '21-day specificity creates a mental commitment window — users can visualize the journey',
        '"No harsh chemicals. No empty promises." two-punch objection handler with rhythm',
      ],
      weaknesses: [
        'CTA "Try Risk-Free" is slightly generic — "Start My 21-Day Trial" would reinforce the time-frame hook',
        'Missing influencer or dermatologist name for face-to-claim association',
      ],
      recommendations: [
        'Test CTA: "Start My 21-Day Transformation" — reinforces body copy timeline',
        'Add a dermatologist name to headline: "Dr. Chen\'s Lab-Proven Formula"',
        'Create a carousel variant: each slide addresses one objection visually',
      ],
      patterns: [
        { name: 'Authority Credentialing', description: 'Professional backing stated upfront', impact: 'positive', confidence: 98, frequency: 7 },
        { name: 'Cynicism Disarmer', description: 'Acknowledges category skepticism head-on', impact: 'positive', confidence: 91, frequency: 4 },
        { name: 'Objection Pre-emption', description: 'Handles objections before they form', impact: 'positive', confidence: 95, frequency: 9 },
        { name: 'Timeline Specificity', description: 'Concrete days instead of vague "fast results"', impact: 'positive', confidence: 88, frequency: 6 },
      ],
      sentiment: 'positive' as const, predictedPerformance: 'high' as const,
      createdAt: new Date('2026-04-14T09:15:00Z'),
    },
    {
      id: 'ana3', adId: 'ad3', model: 'gpt_4o' as const,
      overallScore: 87, copyScore: 89, visualScore: 85, audienceScore: 90, hookStrength: 88,
      estimatedCTR: 5.5, estimatedROAS: 5.3,
      strengths: [
        'Dual-identity positioning ("PRs & brunch") targets a real audience tension — athletes who value aesthetics',
        'TikTok-native language ("the drop") signals platform awareness and Gen-Z fluency',
        'Review count (12K+) lends credible weight without being overwhelming',
      ],
      weaknesses: [
        'Semicolon in headline creates a reading pause — TikTok copy should flow unbroken',
        'Price anchor missing — Gen-Z converts better when they know cost upfront',
        'Video hook (first 1.5s) needs a physical action or pattern interrupt',
      ],
      recommendations: [
        'Rewrite headline removing semicolon: "Fast Enough for PRs. Clean Enough for Brunch." (periods work better)',
        'Add price to description: "Starts at $129 — free 30-day returns"',
        'Open video with a 0.5s split-screen: race track / coffee shop transition',
      ],
      patterns: [
        { name: 'Dual-Identity Hook', description: 'Product works for two opposing use-cases', impact: 'positive', confidence: 92, frequency: 3 },
        { name: 'Platform-Native Language', description: 'Copy uses platform-specific slang correctly', impact: 'positive', confidence: 86, frequency: 8 },
        { name: 'Missing Price Anchor', description: 'No price mention when audience expects transparency', impact: 'negative', confidence: 79, frequency: 11 },
      ],
      sentiment: 'positive' as const, predictedPerformance: 'high' as const,
      createdAt: new Date('2026-03-28T16:45:00Z'),
    },
  ];

  for (const { patterns, ...ana } of analyses) {
    await prisma.aIAnalysis.upsert({
      where: { id: ana.id },
      update: {},
      create: { ...ana, patterns },
    });
  }

  // ── AdVariations ──────────────────────────────────────────────────────────
  const variations = [
    {
      id: 'var1', originalAdId: 'ad1', model: 'claude_3_5_sonnet' as const,
      headline: 'The 20-Minute Workout Secret 50,000 Athletes Swear By',
      description: 'Stop spending 2 hours at the gym and getting worse results. Our AI coach designs your perfect short session — personalized to your body, goals, and schedule.',
      cta: 'Build My Workout',
      imagePrompt: 'Split-screen: left shows frustrated person in crowded gym, right shows confident athlete finishing 20-min home workout, bright natural light, authentic UGC style',
      imageUrl: FITNESS_IMG,
      predictedCTR: 5.4, predictedCPC: 0.82, predictedROAS: 7.8, confidence: 87,
      angle: 'curiosidad' as const, recommendedPlatform: 'facebook' as const,
      status: 'testing' as const,
      rationale: 'Curiosity hook replaces pain-point — tests whether aspiration outperforms frustration framing for this audience.',
      changeType: 'both' as const, createdAt: new Date('2026-04-11T10:00:00Z'),
    },
    {
      id: 'var2', originalAdId: 'ad1', model: 'claude_3_5_sonnet' as const,
      headline: 'Stop Wasting Hours at the Gym — 20 Minutes Is All You Need',
      description: '94% of our users see real results in 30 days. If you don\'t, you pay nothing. Your AI coach is waiting.',
      cta: 'Start Free Trial',
      imagePrompt: 'Real person doing home workout, sweating authentically, natural morning light, no stock-photo feel, phone showing workout app on floor beside them',
      imageUrl: FITNESS_IMG,
      predictedCTR: 5.1, predictedCPC: 0.88, predictedROAS: 7.2, confidence: 91,
      angle: 'directa' as const, recommendedPlatform: 'facebook' as const,
      status: 'approved' as const,
      rationale: 'Adds time specificity to headline while keeping proven pain-point structure. Low-risk, high-confidence test.',
      changeType: 'copy' as const, createdAt: new Date('2026-04-11T10:02:00Z'),
    },
    {
      id: 'var3', originalAdId: 'ad4', model: 'claude_opus_4' as const,
      headline: 'Start My 21-Day Skin Transformation',
      description: 'Dermatologist-formulated. 98% see visible results. No harsh chemicals — just the science your skin has been waiting for.',
      cta: 'Claim My Free Sample',
      imagePrompt: 'Clean flatlay of skincare products with subtle before/after skin texture cards, clinical but warm aesthetic, pastel laboratory backdrop',
      imageUrl: SKIN_IMG,
      predictedCTR: 6.8, predictedCPC: 0.71, predictedROAS: 8.1, confidence: 88,
      angle: 'oferta' as const, recommendedPlatform: 'instagram' as const,
      status: 'pending' as const,
      rationale: 'Moves CTA copy into headline as action-first hook. Free sample offer lowers barrier vs. risk-free purchase.',
      changeType: 'both' as const, createdAt: new Date('2026-04-15T08:30:00Z'),
    },
    {
      id: 'var4', originalAdId: 'ad2', model: 'gpt_4o' as const,
      headline: 'Your Coffee Was Roasted 48 Hours Ago. Most Aren\'t.',
      description: 'Single-origin beans. Roasted to order. At your door before you can finish your current bag.',
      cta: 'Get Fresh Coffee',
      imagePrompt: 'Close-up of coffee beans being poured, warm amber light, steam rising, artisan roastery feel, golden hour tones',
      imageUrl: COFFEE_IMG,
      predictedCTR: 4.1, predictedCPC: 1.28, predictedROAS: 5.2, confidence: 76,
      angle: 'directa' as const, recommendedPlatform: 'instagram' as const,
      status: 'approved' as const,
      rationale: 'Contrast hook — creates implicit comparison that makes competitor staleness visceral without naming them.',
      changeType: 'copy' as const, createdAt: new Date('2026-04-12T14:20:00Z'),
    },
  ];

  for (const v of variations) {
    await prisma.adVariation.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    });
  }

  // ── HistoryEntries ────────────────────────────────────────────────────────
  const historyEntries = [
    { id: 'h1', type: 'analysis' as const,      title: 'AI Analysis Completed',  description: 'GlowLab Before/After Authority analysed — Score: 95/100', relatedAdId: 'ad4', model: 'claude_opus_4' as const,      score: 95, createdAt: new Date('2026-04-14T09:15:00Z') },
    { id: 'h2', type: 'variation' as const,     title: 'Variations Generated',   description: '2 new variations created for FitLife — Pain Point Hero',  relatedAdId: 'ad1', model: 'claude_3_5_sonnet' as const, score: undefined, createdAt: new Date('2026-04-11T10:02:00Z') },
    { id: 'h3', type: 'analysis' as const,      title: 'AI Analysis Completed',  description: 'FitLife Pain Point Hero analysed — Score: 91/100',         relatedAdId: 'ad1', model: 'claude_3_5_sonnet' as const, score: 91, createdAt: new Date('2026-04-10T14:32:00Z') },
    { id: 'h4', type: 'ad_added' as const,      title: 'New Ad Added',           description: 'TasteLab UGC Recipe Hook added as draft',                 relatedAdId: 'ad7', model: undefined, score: undefined,              createdAt: new Date('2026-04-16T08:00:00Z') },
    { id: 'h5', type: 'variation' as const,     title: 'Variation Approved',     description: 'BrewHaven contrast hook variant approved for testing',     relatedAdId: 'ad2', model: 'gpt_4o' as const,            score: undefined, createdAt: new Date('2026-04-12T14:20:00Z') },
    { id: 'h6', type: 'analysis' as const,      title: 'AI Analysis Completed',  description: 'NovaSole Speed vs Style analysed — Score: 87/100',        relatedAdId: 'ad3', model: 'gpt_4o' as const,            score: 87, createdAt: new Date('2026-03-28T16:45:00Z') },
    { id: 'h7', type: 'metric_update' as const, title: 'Metrics Synced',         description: 'All active ads refreshed from platform APIs',             relatedAdId: undefined, model: undefined, score: undefined,          createdAt: new Date('2026-04-17T06:00:00Z') },
    { id: 'h8', type: 'variation' as const,     title: 'Variation Generated',    description: 'GlowLab 21-Day Transformation variant ready for review',  relatedAdId: 'ad4', model: 'claude_opus_4' as const,      score: undefined, createdAt: new Date('2026-04-15T08:30:00Z') },
  ];

  for (const { score, model, relatedAdId, ...h } of historyEntries) {
    await prisma.historyEntry.upsert({
      where: { id: h.id },
      update: {},
      create: {
        ...h,
        workspaceId: workspace.id,
        score: score ?? null,
        model: model ?? null,
        relatedAdId: relatedAdId ?? null,
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log(`   Users:        1`);
  console.log(`   Workspaces:   1`);
  console.log(`   Campaigns:    ${campaigns.length}`);
  console.log(`   Ads:          ${ads.length}`);
  console.log(`   Snapshots:    ${snapshots.length}`);
  console.log(`   Analyses:     ${analyses.length}`);
  console.log(`   Variations:   ${variations.length}`);
  console.log(`   History:      ${historyEntries.length}`);
  console.log(`   Sync records: ${syncRecords.length}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
