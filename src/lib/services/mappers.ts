/**
 * Maps Prisma model instances → UI types used across the app.
 * All enum values are translated from DB identifiers to UI-friendly strings.
 */

import type {
  Ad, AIAnalysis, AdVariation, HistoryEntry, Campaign,
  Platform, AdStatus, AIModel, SalesAngle, VariationStatus,
} from '@/lib/types';

// ─── Enum maps ────────────────────────────────────────────────────────────────

export function mapModel(m: string | null | undefined): AIModel {
  const MAP: Record<string, AIModel> = {
    claude_3_5_sonnet: 'claude-3-5-sonnet',
    claude_opus_4:     'claude-opus-4',
    gpt_4o:            'gpt-4o',
    gemini_1_5_pro:    'gemini-1.5-pro',
  };
  return MAP[m ?? ''] ?? 'claude-3-5-sonnet';
}

export function mapAngle(a: string | null | undefined): SalesAngle | undefined {
  if (!a) return undefined;
  const MAP: Record<string, SalesAngle> = {
    emocional:         'Emocional',
    directa:           'Directa',
    urgencia:          'Urgencia',
    oferta:            'Oferta',
    autoridad:         'Autoridad',
    problema_solucion: 'Problema/Solución',
    curiosidad:        'Curiosidad',
    social_proof:      'Social Proof',
    ugc:               'UGC',
  };
  return MAP[a];
}

function mapFormat(f: string): Ad['format'] {
  if (f === 'video')   return 'video';
  if (f === 'carousel' || f === 'reel') return 'carousel';
  return 'image';
}

function mapObjective(o: string): Ad['objective'] {
  if (o === 'conversions')   return 'conversions';
  if (o === 'traffic')       return 'traffic';
  if (o === 'lead_generation') return 'leads';
  if (o === 'reach')         return 'awareness';
  return 'awareness';
}

// ─── Ad ──────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAd(a: any): Ad {
  return {
    id:          a.id,
    name:        a.name,
    platform:    a.platform as Platform,
    status:      a.status  as AdStatus,
    imageUrl:    a.imageUrl ?? '',
    headline:    a.headline,
    description: a.description,
    cta:         a.cta,
    campaign:    a.campaign?.name ?? '',
    campaignId:  a.campaignId,
    createdAt:   a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    updatedAt:   a.updatedAt instanceof Date ? a.updatedAt.toISOString() : String(a.updatedAt),
    aiScore:     a.aiScore ?? undefined,
    tags:        [],
    budget:      a.campaign?.totalBudget ?? 0,
    format:      mapFormat(a.format),
    objective:   mapObjective(a.campaign?.objective ?? 'brand_awareness'),
    metrics: {
      spend:       a.spend       ?? 0,
      revenue:     a.revenue     ?? 0,
      impressions: a.impressions ?? 0,
      clicks:      a.clicks      ?? 0,
      conversions: a.conversions ?? 0,
      ctr:         a.ctr         ?? 0,
      cpc:         a.cpc         ?? 0,
      cpm:         a.cpm         ?? 0,
      cpa:         a.cpa         ?? 0,
      roas:        a.roas        ?? 0,
      reach:       a.reach       ?? 0,
      frequency:   a.frequency   ?? 0,
    },
  };
}

// ─── AIAnalysis ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAnalysis(a: any): AIAnalysis {
  return {
    id:                  a.id,
    adId:                a.adId,
    adName:              a.ad?.name ?? '',
    createdAt:           a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    model:               mapModel(a.model),
    overallScore:        a.overallScore,
    copyScore:           a.copyScore,
    visualScore:         a.visualScore,
    audienceScore:       a.audienceScore,
    hookStrength:        a.hookStrength,
    estimatedCTR:        a.estimatedCTR,
    estimatedROAS:       a.estimatedROAS,
    strengths:           Array.isArray(a.strengths) ? a.strengths : [],
    weaknesses:          Array.isArray(a.weaknesses) ? a.weaknesses : [],
    recommendations:     Array.isArray(a.recommendations) ? a.recommendations : [],
    patterns:            Array.isArray(a.patterns) ? a.patterns : [],
    sentiment:           a.sentiment as 'positive' | 'neutral' | 'negative',
    predictedPerformance: a.predictedPerformance as 'high' | 'medium' | 'low',
  };
}

// ─── AdVariation ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapVariation(v: any): AdVariation {
  return {
    id:                  v.id,
    originalAdId:        v.originalAdId,
    originalAdName:      v.originalAd?.name ?? '',
    createdAt:           v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
    headline:            v.headline,
    description:         v.description,
    cta:                 v.cta,
    imagePrompt:         v.imagePrompt ?? '',
    imageUrl:            v.imageUrl ?? '',
    predictedCTR:        v.predictedCTR,
    predictedCPC:        v.predictedCPC ?? undefined,
    predictedROAS:       v.predictedROAS,
    confidence:          v.confidence ?? undefined,
    angle:               mapAngle(v.angle),
    recommendedPlatform: v.recommendedPlatform as Platform | undefined,
    status:              v.status as VariationStatus,
    model:               mapModel(v.model),
    rationale:           v.rationale,
    changeType:          v.changeType as AdVariation['changeType'],
  };
}

// ─── HistoryEntry ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapHistory(h: any): HistoryEntry {
  return {
    id:            h.id,
    type:          h.type as HistoryEntry['type'],
    title:         h.title,
    description:   h.description,
    createdAt:     h.createdAt instanceof Date ? h.createdAt.toISOString() : String(h.createdAt),
    relatedAdId:   h.relatedAdId ?? undefined,
    relatedAdName: h.relatedAd?.name ?? undefined,
    model:         h.model ? mapModel(h.model) : undefined,
    score:         h.score ?? undefined,
  };
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCampaign(c: any): Campaign {
  const spend = (c.ads ?? []).reduce((s: number, a: any) => s + (a.spend ?? 0), 0);
  return {
    id:        c.id,
    name:      c.name,
    status:    c.status === 'draft' ? 'paused' : c.status as Campaign['status'],
    budget:    c.totalBudget ?? c.dailyBudget ?? 0,
    spend,
    startDate: c.startDate instanceof Date ? c.startDate.toISOString().split('T')[0] : (c.startDate ?? ''),
    endDate:   c.endDate instanceof Date ? c.endDate.toISOString().split('T')[0] : (c.endDate ?? undefined),
    adsCount:  (c.ads ?? []).length,
    platform:  c.platform as Platform,
    objective: c.objective,
  };
}
