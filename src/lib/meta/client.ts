import type {
  MetaPagedResponse, MetaRawAd, MetaRawAdSet, MetaRawCampaign,
  MetaRawInsight, MetaTokenResponse, MetaErrorResponse,
} from './types';

const BASE = `https://graph.facebook.com/${process.env.META_API_VERSION ?? 'v21.0'}`;

// ─── Rate-limit header parser ──────────────────────────────────────────────────
interface UsageStats { call_count: number; total_time: number; total_cputime: number }

function parseUsage(headers: Headers): UsageStats | null {
  const raw = headers.get('x-app-usage') ?? headers.get('x-ad-account-usage');
  if (!raw) return null;
  try { return JSON.parse(raw) as UsageStats; } catch { return null; }
}

async function backoffIfNeeded(headers: Headers) {
  const usage = parseUsage(headers);
  if (!usage) return;
  const max = Math.max(usage.call_count, usage.total_time, usage.total_cputime);
  if (max >= 75) {
    const waitMs = (100 - max) * 2000;
    console.warn(`[meta/client] Rate limit at ${max}% — waiting ${waitMs}ms`);
    await new Promise(r => setTimeout(r, waitMs));
  }
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
async function metaFetch<T>(path: string, token: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  await backoffIfNeeded(res.headers);

  const json = await res.json();

  if (!res.ok || (json as MetaErrorResponse).error) {
    const err = (json as MetaErrorResponse).error;
    throw new Error(`[Meta API] ${err?.message ?? 'Unknown error'} (code ${err?.code})`);
  }

  return json as T;
}

// ─── Paginated fetch (follows cursor pagination automatically) ─────────────────
async function fetchAllPages<T>(path: string, token: string, params: Record<string, string> = {}): Promise<T[]> {
  const results: T[] = [];
  let after: string | undefined;

  do {
    const pageParams = { limit: '100', ...params, ...(after ? { after } : {}) };
    const page = await metaFetch<MetaPagedResponse<T>>(path, token, pageParams);
    results.push(...page.data);
    after = page.paging?.cursors?.after;
    // Stop if no next page
    if (!page.paging?.next) break;
  } while (after);

  return results;
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function fetchCampaigns(accountId: string, token: string): Promise<MetaRawCampaign[]> {
  return fetchAllPages<MetaRawCampaign>(
    `/act_${accountId}/campaigns`,
    token,
    { fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time' },
  );
}

export async function fetchAdSets(accountId: string, token: string): Promise<MetaRawAdSet[]> {
  return fetchAllPages<MetaRawAdSet>(
    `/act_${accountId}/adsets`,
    token,
    { fields: 'id,name,status,campaign_id,daily_budget,lifetime_budget' },
  );
}

export async function fetchAds(accountId: string, token: string): Promise<MetaRawAd[]> {
  return fetchAllPages<MetaRawAd>(
    `/act_${accountId}/ads`,
    token,
    {
      fields: [
        'id', 'name', 'status', 'campaign_id', 'adset_id',
        'created_time', 'updated_time',
        'creative{id,title,body,image_url,thumbnail_url,object_url,object_story_spec}',
      ].join(','),
    },
  );
}

export async function fetchInsights(accountId: string, token: string, datePreset = 'last_30d'): Promise<MetaRawInsight[]> {
  return fetchAllPages<MetaRawInsight>(
    `/act_${accountId}/insights`,
    token,
    {
      fields: 'ad_id,ad_name,impressions,clicks,reach,spend,ctr,cpc,cpm,actions,date_start,date_stop',
      level: 'ad',
      date_preset: datePreset,
    },
  );
}

// ─── Token exchange ────────────────────────────────────────────────────────────

export async function exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
  const url = new URL(`${BASE}/oauth/access_token`);
  url.searchParams.set('client_id',     process.env.META_APP_ID!);
  url.searchParams.set('client_secret', process.env.META_APP_SECRET!);
  url.searchParams.set('redirect_uri',  process.env.META_REDIRECT_URI!);
  url.searchParams.set('code',          code);

  const res  = await fetch(url.toString(), { method: 'POST', cache: 'no-store' });
  const json = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(json)}`);
  return json as MetaTokenResponse;
}

export async function exchangeForLongLivedToken(shortToken: string): Promise<MetaTokenResponse> {
  const url = new URL(`${BASE}/oauth/access_token`);
  url.searchParams.set('grant_type',       'fb_exchange_token');
  url.searchParams.set('client_id',        process.env.META_APP_ID!);
  url.searchParams.set('client_secret',    process.env.META_APP_SECRET!);
  url.searchParams.set('fb_exchange_token', shortToken);

  const res  = await fetch(url.toString(), { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok) throw new Error(`Long-lived token exchange failed: ${JSON.stringify(json)}`);
  return json as MetaTokenResponse;
}

export async function fetchMetaUserId(token: string): Promise<string> {
  const data = await metaFetch<{ id: string }>('/me', token, { fields: 'id' });
  return data.id;
}
