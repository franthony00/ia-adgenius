export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';

const MOCK_INSIGHTS = {
  source: 'mock' as const,
  scoreAverages: { overall: 79, copy: 82, visual: 74, audience: 81, hookStrength: 77, totalAnalyses: 12 },
  topAngles: [
    { angle: 'emocional',         avgCTR: 3.2, avgROAS: 4.8, count: 8 },
    { angle: 'urgencia',          avgCTR: 2.9, avgROAS: 4.1, count: 6 },
    { angle: 'social_proof',      avgCTR: 2.6, avgROAS: 3.9, count: 5 },
    { angle: 'problema_solucion', avgCTR: 2.3, avgROAS: 3.5, count: 4 },
    { angle: 'oferta',            avgCTR: 2.1, avgROAS: 3.2, count: 3 },
    { angle: 'curiosidad',        avgCTR: 1.8, avgROAS: 2.8, count: 2 },
  ],
  platformPerformance: [
    { platform: 'instagram', avgCTR: 3.1, avgROAS: 4.5, count: 14 },
    { platform: 'google',    avgCTR: 2.8, avgROAS: 4.2, count: 9  },
    { platform: 'facebook',  avgCTR: 2.4, avgROAS: 3.8, count: 11 },
    { platform: 'tiktok',    avgCTR: 3.8, avgROAS: 3.2, count: 5  },
  ],
  topStrengths: [
    { text: 'Strong hook in the first 3 seconds', count: 8 },
    { text: 'Clear value proposition', count: 7 },
    { text: 'Social proof elements (reviews, users)', count: 6 },
    { text: 'Urgent and action-oriented CTA', count: 5 },
    { text: 'High visual contrast and readability', count: 4 },
    { text: 'Specific benefit quantification', count: 3 },
  ],
  topWeaknesses: [
    { text: 'CTA could be more specific', count: 6 },
    { text: 'Missing social proof elements', count: 5 },
    { text: 'Description too long for mobile', count: 4 },
    { text: 'No urgency or scarcity trigger', count: 4 },
    { text: 'Headline lacks emotional hook', count: 3 },
    { text: 'Image does not match copy angle', count: 2 },
  ],
  topRecommendations: [
    { text: 'Add a countdown or limited-time offer', count: 7 },
    { text: 'Test a shorter headline (under 6 words)', count: 6 },
    { text: 'Include a customer testimonial or star rating', count: 5 },
    { text: 'Increase budget during peak hours (7–9pm)', count: 4 },
    { text: 'A/B test the CTA button color', count: 3 },
    { text: 'Try video format for higher CTR on Instagram', count: 2 },
  ],
  sentimentBreakdown: { positive: 7, neutral: 3, negative: 2 },
  changeTypeBreakdown: [
    { type: 'both',   count: 4,  avgCTR: 3.4 },
    { type: 'cta',    count: 6,  avgCTR: 3.1 },
    { type: 'copy',   count: 18, avgCTR: 2.8 },
    { type: 'visual', count: 9,  avgCTR: 2.4 },
  ],
  winRate: 34,
  totalVariations: 32,
};

function avg(nums: (number | null)[]): number {
  const valid = nums.filter((n): n is number => n !== null);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((s, n) => s + n, 0) / valid.length);
}

function freqMap(arr: string[][]): Array<{ text: string; count: number }> {
  const map = new Map<string, number>();
  for (const list of arr) {
    for (const item of list) {
      map.set(item, (map.get(item) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export async function GET() {
  const authCtx = await getAuthContext();

  if (authCtx.isDemo) {
    return NextResponse.json(MOCK_INSIGHTS);
  }

  const [analyses, variations] = await Promise.all([
    prisma.aIAnalysis.findMany({
      where: { ad: { campaign: { workspaceId: authCtx.workspaceId } } },
      select: {
        overallScore: true, copyScore: true, visualScore: true,
        audienceScore: true, hookStrength: true, strengths: true,
        weaknesses: true, recommendations: true, sentiment: true,
      },
    }),
    prisma.adVariation.findMany({
      where: { originalAd: { campaign: { workspaceId: authCtx.workspaceId } } },
      select: {
        angle: true, predictedCTR: true, predictedROAS: true,
        recommendedPlatform: true, changeType: true, status: true,
      },
    }),
  ]);

  if (analyses.length === 0 && variations.length === 0) {
    return NextResponse.json(MOCK_INSIGHTS);
  }

  type AnalysisRow = {
    overallScore: number | null; copyScore: number | null; visualScore: number | null;
    audienceScore: number | null; hookStrength: number | null;
    strengths: string[]; weaknesses: string[]; recommendations: string[];
    sentiment: string | null;
  };
  type VariationRow = {
    angle: string | null; predictedCTR: number | null; predictedROAS: number | null;
    recommendedPlatform: string | null; changeType: string | null; status: string | null;
  };
  const typedAnalyses = analyses as AnalysisRow[];
  const typedVariations = variations as VariationRow[];

  // Score averages
  const scoreAverages = {
    overall:      avg(typedAnalyses.map((a: AnalysisRow) => a.overallScore)),
    copy:         avg(typedAnalyses.map((a: AnalysisRow) => a.copyScore)),
    visual:       avg(typedAnalyses.map((a: AnalysisRow) => a.visualScore)),
    audience:     avg(typedAnalyses.map((a: AnalysisRow) => a.audienceScore)),
    hookStrength: avg(typedAnalyses.map((a: AnalysisRow) => a.hookStrength)),
    totalAnalyses: typedAnalyses.length,
  };

  // Top angles
  const angleMap = new Map<string, { ctrs: number[]; roases: number[]; count: number }>();
  for (const v of typedVariations) {
    if (!v.angle) continue;
    const key = String(v.angle);
    const entry = angleMap.get(key) ?? { ctrs: [], roases: [], count: 0 };
    if (v.predictedCTR  !== null) entry.ctrs.push(v.predictedCTR);
    if (v.predictedROAS !== null) entry.roases.push(v.predictedROAS);
    entry.count++;
    angleMap.set(key, entry);
  }
  const topAngles = [...angleMap.entries()]
    .map(([angle, { ctrs, roases, count }]) => ({
      angle,
      avgCTR:  +( ctrs.reduce((s: number, n: number) => s+n, 0) / (ctrs.length||1)).toFixed(2),
      avgROAS: +(roases.reduce((s: number, n: number) => s+n, 0) / (roases.length||1)).toFixed(2),
      count,
    }))
    .sort((a, b) => b.avgCTR - a.avgCTR);

  // Platform performance
  const platMap = new Map<string, { ctrs: number[]; roases: number[]; count: number }>();
  for (const v of typedVariations) {
    if (!v.recommendedPlatform) continue;
    const key = String(v.recommendedPlatform);
    const entry = platMap.get(key) ?? { ctrs: [], roases: [], count: 0 };
    if (v.predictedCTR  !== null) entry.ctrs.push(v.predictedCTR);
    if (v.predictedROAS !== null) entry.roases.push(v.predictedROAS);
    entry.count++;
    platMap.set(key, entry);
  }
  const platformPerformance = [...platMap.entries()]
    .map(([platform, { ctrs, roases, count }]) => ({
      platform,
      avgCTR:  +( ctrs.reduce((s: number, n: number) => s+n, 0) / (ctrs.length||1)).toFixed(2),
      avgROAS: +(roases.reduce((s: number, n: number) => s+n, 0) / (roases.length||1)).toFixed(2),
      count,
    }))
    .sort((a, b) => b.avgCTR - a.avgCTR);

  // Strengths / weaknesses / recommendations frequency
  const topStrengths      = freqMap(typedAnalyses.map((a: AnalysisRow) => a.strengths));
  const topWeaknesses     = freqMap(typedAnalyses.map((a: AnalysisRow) => a.weaknesses));
  const topRecommendations = freqMap(typedAnalyses.map((a: AnalysisRow) => a.recommendations));

  // Sentiment
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  for (const a of typedAnalyses) {
    const s = String(a.sentiment ?? 'neutral') as keyof typeof sentimentBreakdown;
    if (s in sentimentBreakdown) sentimentBreakdown[s]++;
  }

  // Change type breakdown
  const ctMap = new Map<string, { count: number; ctrs: number[] }>();
  for (const v of typedVariations) {
    const key = String(v.changeType ?? 'copy');
    const entry = ctMap.get(key) ?? { count: 0, ctrs: [] };
    entry.count++;
    if (v.predictedCTR !== null) entry.ctrs.push(v.predictedCTR);
    ctMap.set(key, entry);
  }
  const changeTypeBreakdown = [...ctMap.entries()]
    .map(([type, { count, ctrs }]) => ({
      type,
      count,
      avgCTR: +( ctrs.reduce((s: number, n: number) => s+n, 0) / (ctrs.length||1)).toFixed(2),
    }))
    .sort((a, b) => b.avgCTR - a.avgCTR);

  // Win rate
  const approved = typedVariations.filter((v: VariationRow) => String(v.status) === 'approved').length;
  const winRate  = typedVariations.length > 0 ? Math.round((approved / typedVariations.length) * 100) : 0;

  return NextResponse.json({
    source: 'db' as const,
    scoreAverages,
    topAngles,
    platformPerformance,
    topStrengths,
    topWeaknesses,
    topRecommendations,
    sentimentBreakdown,
    changeTypeBreakdown,
    winRate,
    totalVariations: variations.length,
  });
}
