import type { PlanId } from './types';

export type NovaTier = 'FREE' | 'PLUS' | 'PRO';

export interface NovaCapabilities {
  basicChat: boolean;
  improveCopy: boolean;
  generateIdeas: boolean;
  generateFullCampaign: boolean;
  copyVariations: boolean;
  campaignHistory: boolean;
  advancedAnalysis: boolean;
  smartRecommendations: boolean;
  learnFromHistory: boolean;
  maxMessagesPerMonth: number;
}

export const NOVA_TIER_MAP: Record<PlanId, NovaTier> = {
  starter:     'FREE',
  pro:         'PLUS',
  performance: 'PRO',
  agency:      'PRO',
  enterprise:  'PRO',
};

export const NOVA_CAPABILITIES: Record<NovaTier, NovaCapabilities> = {
  FREE: {
    basicChat: true,
    improveCopy: true,
    generateIdeas: true,
    generateFullCampaign: false,
    copyVariations: false,
    campaignHistory: false,
    advancedAnalysis: false,
    smartRecommendations: false,
    learnFromHistory: false,
    maxMessagesPerMonth: 30,
  },
  PLUS: {
    basicChat: true,
    improveCopy: true,
    generateIdeas: true,
    generateFullCampaign: true,
    copyVariations: true,
    campaignHistory: true,
    advancedAnalysis: false,
    smartRecommendations: false,
    learnFromHistory: false,
    maxMessagesPerMonth: 300,
  },
  PRO: {
    basicChat: true,
    improveCopy: true,
    generateIdeas: true,
    generateFullCampaign: true,
    copyVariations: true,
    campaignHistory: true,
    advancedAnalysis: true,
    smartRecommendations: true,
    learnFromHistory: true,
    maxMessagesPerMonth: 2000,
  },
};

export function getNovaCapabilities(planId: PlanId): NovaCapabilities {
  return NOVA_CAPABILITIES[NOVA_TIER_MAP[planId]];
}

export function getNovaTier(planId: PlanId): NovaTier {
  return NOVA_TIER_MAP[planId];
}

export const NOVA_QUICK_ACTIONS = [
  {
    id: 'improve_copy',
    label: 'Mejorar copy',
    prompt: 'Ayúdame a mejorar el copy de este anuncio para que sea más persuasivo.',
    icon: '✏️',
    requiredTier: 'FREE' as NovaTier,
  },
  {
    id: 'generate_idea',
    label: 'Idea de anuncio',
    prompt: 'Dame una idea creativa para un nuevo anuncio.',
    icon: '💡',
    requiredTier: 'FREE' as NovaTier,
  },
  {
    id: 'full_campaign',
    label: 'Campaña completa',
    prompt: 'Genera una campaña publicitaria completa con headline, copy, CTA y audiencia objetivo.',
    icon: '🚀',
    requiredTier: 'PLUS' as NovaTier,
  },
  {
    id: 'copy_variations',
    label: 'Variaciones de copy',
    prompt: 'Crea 3 variaciones de copy para A/B testing con diferentes ángulos persuasivos.',
    icon: '🔀',
    requiredTier: 'PLUS' as NovaTier,
  },
  {
    id: 'analyze_performance',
    label: 'Analizar rendimiento',
    prompt: 'Analiza el rendimiento de mis campañas y dime qué optimizar.',
    icon: '📊',
    requiredTier: 'PRO' as NovaTier,
  },
  {
    id: 'smart_recommendations',
    label: 'Recomendaciones IA',
    prompt: 'Basándote en mis campañas anteriores y métricas (CTR, ROAS), dame recomendaciones avanzadas de optimización.',
    icon: '🧠',
    requiredTier: 'PRO' as NovaTier,
  },
] as const;

const TIER_ORDER: NovaTier[] = ['FREE', 'PLUS', 'PRO'];

export function tierAtLeast(tier: NovaTier, minimum: NovaTier): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(minimum);
}
