import { createServerClient } from './client';
import type { NormalizedAd, NormalizedMetrics, MetaRawCampaign, MetaRawAdSet } from '../meta/types';

// ─── Tokens ───────────────────────────────────────────────────────────────────

export async function upsertToken(data: {
  ad_account_id: string;
  access_token: string;
  expires_at: string;
  scope: string;
  meta_user_id: string;
}) {
  const db = createServerClient();
  const { error } = await db.from('meta_tokens').upsert(data, { onConflict: 'ad_account_id' });
  if (error) throw new Error(`upsertToken: ${error.message}`);
}

export async function getToken(accountId: string): Promise<string | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from('meta_tokens')
    .select('access_token, expires_at')
    .eq('ad_account_id', accountId)
    .single();

  if (error || !data) return null;

  // Warn if token expires within 10 days
  if (data.expires_at) {
    const daysLeft = (new Date(data.expires_at).getTime() - Date.now()) / 86_400_000;
    if (daysLeft < 10) {
      console.warn(`[meta-repository] Token for ${accountId} expires in ${daysLeft.toFixed(1)} days`);
    }
    if (daysLeft <= 0) {
      console.error(`[meta-repository] Token for ${accountId} has EXPIRED`);
      return null;
    }
  }

  return data.access_token;
}

export async function getIntegrationStatus(accountId: string) {
  const db = createServerClient();
  const { data } = await db
    .from('meta_tokens')
    .select('ad_account_id, expires_at, meta_user_id, created_at')
    .eq('ad_account_id', accountId)
    .single();
  return data;
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export async function upsertCampaigns(campaigns: MetaRawCampaign[], accountId: string) {
  const db = createServerClient();
  const rows = campaigns.map(c => ({
    id:              c.id,
    ad_account_id:   accountId,
    name:            c.name,
    status:          c.status.toLowerCase(),
    objective:       c.objective ?? null,
    daily_budget:    c.daily_budget    ? parseFloat(c.daily_budget)    : null,
    lifetime_budget: c.lifetime_budget ? parseFloat(c.lifetime_budget) : null,
    start_time:      c.start_time  ?? null,
    stop_time:       c.stop_time   ?? null,
  }));

  const { error } = await db.from('campaigns').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`upsertCampaigns: ${error.message}`);
}

// ─── Ad Sets ──────────────────────────────────────────────────────────────────

export async function upsertAdSets(adSets: MetaRawAdSet[], accountId: string) {
  const db = createServerClient();
  const rows = adSets.map(s => ({
    id:              s.id,
    campaign_id:     s.campaign_id,
    ad_account_id:   accountId,
    name:            s.name,
    status:          s.status.toLowerCase(),
    daily_budget:    s.daily_budget    ? parseFloat(s.daily_budget)    : null,
    lifetime_budget: s.lifetime_budget ? parseFloat(s.lifetime_budget) : null,
  }));

  const { error } = await db.from('ad_sets').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`upsertAdSets: ${error.message}`);
}

// ─── Ads ──────────────────────────────────────────────────────────────────────

export async function upsertAds(ads: NormalizedAd[]) {
  if (ads.length === 0) return;
  const db = createServerClient();
  const { error } = await db.from('synced_ads').upsert(ads, { onConflict: 'id' });
  if (error) throw new Error(`upsertAds: ${error.message}`);
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function upsertMetrics(metrics: NormalizedMetrics[]) {
  if (metrics.length === 0) return;
  const db = createServerClient();
  const { error } = await db
    .from('ad_metrics')
    .upsert(metrics, { onConflict: 'ad_id,date_start,date_stop' });
  if (error) throw new Error(`upsertMetrics: ${error.message}`);
}

// ─── Sync log ─────────────────────────────────────────────────────────────────

export async function createSyncLog(accountId: string): Promise<string> {
  const db = createServerClient();
  const { data, error } = await db
    .from('sync_log')
    .insert({ ad_account_id: accountId, status: 'running' })
    .select('id')
    .single();
  if (error) throw new Error(`createSyncLog: ${error.message}`);
  return data.id;
}

export async function finishSyncLog(logId: string, adsSynced: number, errorMessage?: string) {
  const db = createServerClient();
  await db.from('sync_log').update({
    status:        errorMessage ? 'error' : 'success',
    ads_synced:    adsSynced,
    error_message: errorMessage ?? null,
    finished_at:   new Date().toISOString(),
  }).eq('id', logId);
}

// ─── Read ads from DB ─────────────────────────────────────────────────────────

export interface SyncedAdWithMetrics {
  id: string;
  name: string;
  campaign_name: string;
  ad_set_name: string;
  headline: string | null;
  body: string | null;
  image_url: string | null;
  destination_url: string | null;
  cta_type: string | null;
  platform: string;
  format: string | null;
  status: string;
  // latest metrics
  impressions: number;
  clicks: number;
  reach: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
  date_start: string | null;
  date_stop: string | null;
}

export async function listSyncedAds(accountId: string): Promise<SyncedAdWithMetrics[]> {
  const db = createServerClient();

  // Get ads with their latest metrics via a join
  const { data, error } = await db
    .from('synced_ads')
    .select(`
      id, name, campaign_name, ad_set_name,
      headline, body, image_url, destination_url, cta_type,
      platform, format, status,
      ad_metrics (
        impressions, clicks, reach, spend, ctr, cpc, cpm,
        date_start, date_stop
      )
    `)
    .eq('ad_account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listSyncedAds: ${error.message}`);

  return (data ?? []).map(ad => {
    // Pick the most recent metrics row
    const metricsArr = (ad.ad_metrics as any[]) ?? [];
    const latest = metricsArr.sort((a, b) =>
      new Date(b.date_stop).getTime() - new Date(a.date_stop).getTime()
    )[0] ?? {};

    return {
      id:              ad.id,
      name:            ad.name,
      campaign_name:   ad.campaign_name,
      ad_set_name:     ad.ad_set_name,
      headline:        ad.headline,
      body:            ad.body,
      image_url:       ad.image_url,
      destination_url: ad.destination_url,
      cta_type:        ad.cta_type,
      platform:        ad.platform,
      format:          ad.format,
      status:          ad.status,
      impressions:     latest.impressions ?? 0,
      clicks:          latest.clicks      ?? 0,
      reach:           latest.reach       ?? 0,
      spend:           latest.spend       ?? 0,
      ctr:             latest.ctr         ?? 0,
      cpc:             latest.cpc         ?? 0,
      cpm:             latest.cpm         ?? 0,
      date_start:      latest.date_start  ?? null,
      date_stop:       latest.date_stop   ?? null,
    };
  });
}
