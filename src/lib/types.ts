// ─── Platforms ───────────────────────────────────────────────────────────────
export type Platform = 'facebook' | 'instagram' | 'google' | 'tiktok' | 'linkedin';
export type AdStatus = 'active' | 'paused' | 'completed' | 'draft';
export type AIModel = 'claude-3-5-sonnet' | 'claude-opus-4' | 'gpt-4o' | 'gemini-1.5-pro';
export type PerformanceLevel = 'high' | 'medium' | 'low';
export type ImpactType = 'positive' | 'negative' | 'neutral';
export type VariationStatus = 'pending' | 'testing' | 'approved' | 'rejected' | 'draft';
export type SalesAngle =
  | 'Emocional' | 'Directa' | 'Urgencia' | 'Oferta'
  | 'Autoridad' | 'Problema/Solución' | 'Curiosidad'
  | 'Social Proof' | 'UGC';

// ─── Metrics ─────────────────────────────────────────────────────────────────
export interface AdMetrics {
  ctr: number;          // Click-through rate (%)
  cpc: number;          // Cost per click ($)
  cpm: number;          // Cost per 1,000 impressions ($)
  cpa: number;          // Cost per acquisition ($)
  roas: number;         // Return on ad spend (x)
  conversions: number;
  reach: number;
  impressions: number;
  clicks: number;
  spend: number;        // ($)
  revenue: number;      // ($)
  frequency: number;    // avg times shown per user
  videoViews?: number;
  videoViewRate?: number;
}

// ─── Ad ──────────────────────────────────────────────────────────────────────
export interface Ad {
  id: string;
  name: string;
  platform: Platform;
  status: AdStatus;
  imageUrl: string;
  headline: string;
  description: string;
  cta: string;
  campaign: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
  metrics: AdMetrics;
  aiScore?: number;     // 0-100 quality score
  tags: string[];
  budget: number;
  format: 'image' | 'video' | 'carousel' | 'collection';
  objective: 'awareness' | 'traffic' | 'conversions' | 'leads' | 'sales';
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────
export interface Pattern {
  name: string;
  description: string;
  impact: ImpactType;
  confidence: number;   // 0-100
  frequency: number;    // how many ads show this pattern
}

export interface AIAnalysis {
  id: string;
  adId: string;
  adName: string;
  createdAt: string;
  model: AIModel;
  overallScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  patterns: Pattern[];
  recommendations: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  predictedPerformance: PerformanceLevel;
  copyScore: number;    // 0-100
  visualScore: number;  // 0-100
  audienceScore: number;// 0-100
  hookStrength: number; // 0-100
  estimatedCTR: number;
  estimatedROAS: number;
}

// ─── Ad Variation ─────────────────────────────────────────────────────────────
export interface AdVariation {
  id: string;
  originalAdId: string;
  originalAdName: string;
  createdAt: string;
  headline: string;
  description: string;
  cta: string;
  imagePrompt: string;
  imageUrl: string;
  predictedCTR: number;
  predictedCPC?: number;
  predictedROAS: number;
  confidence?: number;           // 0–100
  angle?: SalesAngle;
  recommendedPlatform?: Platform;
  status: VariationStatus;
  model: AIModel;
  rationale: string;
  changeType: 'copy' | 'visual' | 'both' | 'cta';
}

// ─── Campaign ────────────────────────────────────────────────────────────────
export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spend: number;
  startDate: string;
  endDate?: string;
  adsCount: number;
  platform: Platform;
  objective: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalSpend: number;
  totalRevenue: number;
  avgROAS: number;
  avgCTR: number;
  totalConversions: number;
  totalImpressions: number;
  activeAds: number;
  analysesRun: number;
  variationsGenerated: number;
  topPerformingAd: string;
  spendTrend: number[];    // last 7 days
  revenueTrend: number[];
  ctaTrend: number[];
  // Extended KPIs
  campaignsRunning: number;
  variationsTested: number;
  winningAds: number;
  estimatedAvgROAS: number;
  realAvgROAS: number;
}

// ─── Platform Mix ─────────────────────────────────────────────────────────────
export interface PlatformMixItem {
  platform: Platform;
  spend: number;
  pct: number;
  roas: number;
  ctr: number;
}

// ─── Performance Loop ─────────────────────────────────────────────────────────
export type LoopStage = 'generate' | 'test' | 'measure' | 'learn' | 'improve';
export type RecommendationType =
  | 'scale' | 'pause' | 'test_cta' | 'test_copy'
  | 'duplicate' | 'monitor';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface PerformanceLoopEntry {
  id: string;
  adId: string;
  adName: string;
  stage: LoopStage;
  projectedCTR: number;
  realCTR?: number;
  projectedROAS: number;
  realROAS?: number;
  recommendation: string;
  recommendationType: RecommendationType;
  confidence: ConfidenceLevel;
  daysActive: number;
}

// ─── AI Recommendation ────────────────────────────────────────────────────────
export type RecommendationImpact = 'high' | 'medium' | 'low';

export interface AIRecommendation {
  id: string;
  adId?: string;
  adName?: string;
  type: RecommendationType;
  title: string;
  description: string;
  impact: RecommendationImpact;
  confidence: number;   // 0-100
  metric?: string;
  metricValue?: string;
}

// ─── Ad Platform Integrations ────────────────────────────────────────────────
export type AdIntegrationPlatform = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'pinterest';
export type PlatformConnectionStatus = 'connected' | 'disconnected' | 'error' | 'syncing';

export interface PlatformAccount {
  id: string;
  platform: AdIntegrationPlatform;
  name: string;
  accountId: string;
  connected: boolean;
  status: PlatformConnectionStatus;
  connectedSince?: string;
  lastSync?: string;
  tokenExpiresAt?: string;
  daysUntilExpiry?: number;
  adsImported: number;
  campaignsImported: number;
  currency: string;
  timezone: string;
}

export interface ImportedCampaign {
  id: string;
  platform: AdIntegrationPlatform;
  name: string;
  objective: string;
  status: 'active' | 'paused' | 'ended';
  dailyBudget: number;
  totalBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  estimatedROAS: number;
  adsCount: number;
  startDate: string;
  lastUpdated: string;
}

export interface PlatformSyncEvent {
  id: string;
  platform: AdIntegrationPlatform;
  status: 'success' | 'error' | 'running';
  adsImported: number;
  campaignsImported: number;
  startedAt: string;
  finishedAt?: string;
  note?: string;
}

export interface PlatformRecommendation {
  id: string;
  platform: AdIntegrationPlatform;
  campaignId?: string;
  campaignName?: string;
  type: 'scale' | 'pause' | 'budget_shift' | 'audience' | 'creative';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
}

// ─── Pricing Plans ────────────────────────────────────────────────────────────
export type PlanId     = 'starter' | 'pro' | 'performance' | 'agency' | 'enterprise';
export type PlanAction = 'current' | 'upgrade' | 'downgrade' | 'contact';

export interface PricingPlan {
  id: PlanId;
  name: string;
  priceMonthly: number | null;   // null = custom/contact
  priceLabel: string;            // e.g. "US$79/month" or "From US$599/month"
  shortDesc: string;
  badge?: string;                // "Current Plan" | "Most Recommended"
  badgeVariant?: 'emerald' | 'amber';
  features: string[];
  action: PlanAction;
  actionLabel: string;
}

// ─── History Entry ────────────────────────────────────────────────────────────
export interface HistoryEntry {
  id: string;
  type: 'analysis' | 'variation' | 'ad_added' | 'metric_update';
  title: string;
  description: string;
  createdAt: string;
  relatedAdId?: string;
  relatedAdName?: string;
  model?: AIModel;
  score?: number;
  status?: string;
}
