// ─── Raw Meta API Response Types ──────────────────────────────────────────────

export interface MetaCallToAction {
  type: string;          // LEARN_MORE | SHOP_NOW | SIGN_UP | BOOK_TRAVEL | etc.
  value?: { link?: string };
}

export interface MetaLinkData {
  message?: string;      // ad body / primary text
  name?: string;         // headline
  description?: string;
  link?: string;         // destination URL
  picture?: string;      // image CDN URL
  call_to_action?: MetaCallToAction;
  child_attachments?: MetaLinkData[]; // carousel cards
}

export interface MetaVideoData {
  message?: string;
  title?: string;
  call_to_action?: MetaCallToAction;
  image_url?: string;    // thumbnail
}

export interface MetaObjectStorySpec {
  page_id?: string;
  instagram_actor_id?: string;
  link_data?: MetaLinkData;
  video_data?: MetaVideoData;
  template_data?: MetaLinkData;
}

export interface MetaCreative {
  id: string;
  title?: string;
  body?: string;
  image_url?: string;
  thumbnail_url?: string;
  object_url?: string;
  object_story_spec?: MetaObjectStorySpec;
}

export interface MetaRawAd {
  id: string;
  name: string;
  status: string;         // ACTIVE | PAUSED | DELETED | ARCHIVED
  campaign_id: string;
  adset_id: string;
  creative?: MetaCreative;
  created_time?: string;
  updated_time?: string;
}

export interface MetaRawAdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface MetaRawCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaRawInsight {
  ad_id: string;
  ad_name: string;
  impressions: string;
  clicks: string;
  reach: string;
  spend: string;
  ctr: string;
  cpc: string;
  cpm: string;
  cpp?: string;
  actions?: MetaAction[];
  date_start: string;
  date_stop: string;
}

export interface MetaPaging {
  cursors?: { before: string; after: string };
  next?: string;
}

export interface MetaPagedResponse<T> {
  data: T[];
  paging?: MetaPaging;
}

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface MetaErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

// ─── Normalized internal types ─────────────────────────────────────────────────

export interface NormalizedAd {
  id: string;
  ad_account_id: string;
  campaign_id: string;
  ad_set_id: string;
  campaign_name: string;
  ad_set_name: string;
  name: string;
  status: string;
  headline: string;
  body: string;
  image_url: string;
  destination_url: string;
  cta_type: string;
  platform: 'facebook' | 'instagram';
  format: string;
  creative_id: string;
  created_time: string | null;
  updated_time: string | null;
}

export interface NormalizedMetrics {
  ad_id: string;
  date_start: string;
  date_stop: string;
  impressions: number;
  clicks: number;
  reach: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
  actions: MetaAction[] | null;
}
