import { NextRequest, NextResponse } from 'next/server';
import { fetchCampaigns, fetchAdSets, fetchAds, fetchInsights } from '@/lib/meta/client';
import { buildCampaignMap, buildAdSetMap, normalizeAd, normalizeInsight } from '@/lib/meta/normalizer';
import {
  getToken, upsertCampaigns, upsertAdSets, upsertAds, upsertMetrics,
  createSyncLog, finishSyncLog,
} from '@/lib/supabase/meta-repository';

import { getAuthContext } from '@/lib/auth';
import { hasFeature } from '@/lib/plan-gates';

export const runtime    = 'nodejs';
export const maxDuration = 300; // 5 min timeout for large accounts

export async function POST(_request: NextRequest) {
  const authCtx = await getAuthContext();
  if (!hasFeature(authCtx.planId, 'meta_connect')) {
    return NextResponse.json(
      { error: 'Meta Ads sync requires Performance plan or higher.', requiredPlan: 'performance' },
      { status: 403 },
    );
  }

  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!accountId) {
    return NextResponse.json({ error: 'META_AD_ACCOUNT_ID not configured' }, { status: 500 });
  }

  // Strip "act_" prefix if present — Meta API accepts both but we store with prefix
  const rawId = accountId.replace(/^act_/, '');

  // ── Get stored token ────────────────────────────────────────────────────────
  const token = await getToken(accountId);
  if (!token) {
    return NextResponse.json(
      { error: 'No valid token found. Please reconnect your Meta account.' },
      { status: 401 },
    );
  }

  const logId = await createSyncLog(accountId);

  try {
    console.log(`[meta/sync] Starting sync for account ${accountId}`);

    // ── 1. Fetch campaigns & ad sets (for name resolution) ──────────────────
    const [campaigns, adSets] = await Promise.all([
      fetchCampaigns(rawId, token),
      fetchAdSets(rawId, token),
    ]);

    console.log(`[meta/sync] Fetched ${campaigns.length} campaigns, ${adSets.length} ad sets`);

    // ── 2. Upsert campaigns & ad sets first (FK deps) ───────────────────────
    await upsertCampaigns(campaigns, accountId);
    await upsertAdSets(adSets, accountId);

    // ── 3. Fetch raw ads ─────────────────────────────────────────────────────
    const rawAds = await fetchAds(rawId, token);
    console.log(`[meta/sync] Fetched ${rawAds.length} ads`);

    // ── 4. Normalize ads ──────────────────────────────────────────────────────
    const campaignMap  = buildCampaignMap(campaigns);
    const adSetMap     = buildAdSetMap(adSets);
    const normalizedAds = rawAds.map(ad => normalizeAd(ad, accountId, campaignMap, adSetMap));

    // ── 5. Upsert ads ─────────────────────────────────────────────────────────
    await upsertAds(normalizedAds);

    // ── 6. Fetch insights (metrics) ───────────────────────────────────────────
    const rawInsights = await fetchInsights(rawId, token, 'last_30d');
    console.log(`[meta/sync] Fetched ${rawInsights.length} insight rows`);

    // ── 7. Only keep metrics for ads we successfully synced ───────────────────
    const syncedAdIds = new Set(normalizedAds.map(a => a.id));
    const normalizedMetrics = rawInsights
      .filter(i => syncedAdIds.has(i.ad_id))
      .map(normalizeInsight);

    // ── 8. Upsert metrics ─────────────────────────────────────────────────────
    await upsertMetrics(normalizedMetrics);

    await finishSyncLog(logId, normalizedAds.length);

    return NextResponse.json({
      success:        true,
      ads_synced:     normalizedAds.length,
      metrics_synced: normalizedMetrics.length,
      campaigns:      campaigns.length,
      ad_sets:        adSets.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[meta/sync] Error:', msg);
    await finishSyncLog(logId, 0, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET returns last sync status
export async function GET() {
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!accountId) return NextResponse.json({ connected: false });

  const { createServerClient } = await import('@/lib/supabase/client');
  const db = createServerClient();

  const { data } = await db
    .from('sync_log')
    .select('status, ads_synced, error_message, started_at, finished_at')
    .eq('ad_account_id', accountId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ connected: !!data, last_sync: data ?? null });
}
