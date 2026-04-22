import type {
  MetaRawAd, MetaRawAdSet, MetaRawCampaign, MetaRawInsight,
  MetaCreative, NormalizedAd, NormalizedMetrics,
} from './types';

// ─── Creative field extraction with safe fallbacks ─────────────────────────────

function extractHeadline(creative?: MetaCreative): string {
  if (!creative) return '';
  return (
    creative.object_story_spec?.link_data?.name ??
    creative.object_story_spec?.video_data?.title ??
    creative.object_story_spec?.template_data?.name ??
    creative.title ??
    ''
  );
}

function extractBody(creative?: MetaCreative): string {
  if (!creative) return '';
  return (
    creative.object_story_spec?.link_data?.message ??
    creative.object_story_spec?.video_data?.message ??
    creative.object_story_spec?.template_data?.message ??
    creative.body ??
    ''
  );
}

function extractImageUrl(creative?: MetaCreative): string {
  if (!creative) return '';
  return (
    creative.object_story_spec?.link_data?.picture ??
    creative.object_story_spec?.video_data?.image_url ??
    creative.image_url ??
    creative.thumbnail_url ??
    ''
  );
}

function extractDestinationUrl(creative?: MetaCreative): string {
  if (!creative) return '';
  return (
    creative.object_story_spec?.link_data?.link ??
    creative.object_story_spec?.link_data?.call_to_action?.value?.link ??
    creative.object_story_spec?.video_data?.call_to_action?.value?.link ??
    creative.object_url ??
    ''
  );
}

function extractCtaType(creative?: MetaCreative): string {
  if (!creative) return '';
  return (
    creative.object_story_spec?.link_data?.call_to_action?.type ??
    creative.object_story_spec?.video_data?.call_to_action?.type ??
    ''
  );
}

function detectPlatform(creative?: MetaCreative): 'instagram' | 'facebook' {
  // Instagram ads have an instagram_actor_id in the object_story_spec
  if (creative?.object_story_spec?.instagram_actor_id) return 'instagram';
  return 'facebook';
}

function detectFormat(ad: MetaRawAd): string {
  const spec = ad.creative?.object_story_spec;
  if (!spec) return 'image';
  if (spec.video_data) return 'video';
  if (spec.link_data?.child_attachments?.length) return 'carousel';
  return 'image';
}

// ─── Build lookup maps from raw Meta data ──────────────────────────────────────

export function buildCampaignMap(campaigns: MetaRawCampaign[]): Map<string, MetaRawCampaign> {
  return new Map(campaigns.map(c => [c.id, c]));
}

export function buildAdSetMap(adSets: MetaRawAdSet[]): Map<string, MetaRawAdSet> {
  return new Map(adSets.map(s => [s.id, s]));
}

// ─── Normalize a single raw ad ─────────────────────────────────────────────────

export function normalizeAd(
  ad: MetaRawAd,
  accountId: string,
  campaignMap: Map<string, MetaRawCampaign>,
  adSetMap: Map<string, MetaRawAdSet>,
): NormalizedAd {
  const campaign = campaignMap.get(ad.campaign_id);
  const adSet    = adSetMap.get(ad.adset_id);

  return {
    id:               ad.id,
    ad_account_id:    accountId,
    campaign_id:      ad.campaign_id,
    ad_set_id:        ad.adset_id,
    campaign_name:    campaign?.name ?? `Campaign ${ad.campaign_id}`,
    ad_set_name:      adSet?.name    ?? `Ad Set ${ad.adset_id}`,
    name:             ad.name,
    status:           ad.status.toLowerCase(),
    headline:         extractHeadline(ad.creative),
    body:             extractBody(ad.creative),
    image_url:        extractImageUrl(ad.creative),
    destination_url:  extractDestinationUrl(ad.creative),
    cta_type:         extractCtaType(ad.creative),
    platform:         detectPlatform(ad.creative),
    format:           detectFormat(ad),
    creative_id:      ad.creative?.id ?? '',
    created_time:     ad.created_time ?? null,
    updated_time:     ad.updated_time ?? null,
  };
}

// ─── Normalize insights row ────────────────────────────────────────────────────

export function normalizeInsight(insight: MetaRawInsight): NormalizedMetrics {
  return {
    ad_id:       insight.ad_id,
    date_start:  insight.date_start,
    date_stop:   insight.date_stop,
    impressions: parseInt(insight.impressions) || 0,
    clicks:      parseInt(insight.clicks)      || 0,
    reach:       parseInt(insight.reach)       || 0,
    spend:       parseFloat(insight.spend)     || 0,
    ctr:         parseFloat(insight.ctr)       || 0,
    cpc:         parseFloat(insight.cpc)       || 0,
    cpm:         parseFloat(insight.cpm)       || 0,
    actions:     insight.actions ?? null,
  };
}
