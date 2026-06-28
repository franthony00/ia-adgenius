import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken, exchangeForLongLivedToken, fetchMetaUserId } from '@/lib/meta/client';
import { upsertToken } from '@/lib/supabase/meta-repository';
import { getAuthContext } from '@/lib/auth';
import { hasFeature } from '@/lib/plan-gates';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext();
  if (!hasFeature(authCtx.planId, 'meta_connect')) {
    return NextResponse.redirect(
      new URL('/meta-connect?error=plan_required&requiredPlan=performance', request.url),
    );
  }
  const { searchParams } = request.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // ── User denied permission ──────────────────────────────────────────────────
  if (error) {
    const reason = searchParams.get('error_description') ?? error;
    return NextResponse.redirect(
      new URL(`/meta-connect?error=${encodeURIComponent(reason)}`, request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/meta-connect?error=missing_params', request.url));
  }

  // ── CSRF validation ─────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const savedState  = cookieStore.get('meta_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL('/meta-connect?error=invalid_state', request.url));
  }
  cookieStore.delete('meta_oauth_state');

  try {
    // ── Exchange code → short-lived token ────────────────────────────────────
    const shortToken = await exchangeCodeForToken(code);

    // ── Exchange short → long-lived token (~60 days) ─────────────────────────
    const longToken = await exchangeForLongLivedToken(shortToken.access_token);

    // ── Get Meta user ID ─────────────────────────────────────────────────────
    const metaUserId = await fetchMetaUserId(longToken.access_token);

    // ── Resolve ad account ID ─────────────────────────────────────────────────
    // Using the env var as default (single-tenant). In multi-tenant, store per user.
    const adAccountId = process.env.META_AD_ACCOUNT_ID;
    if (!adAccountId) {
      return NextResponse.redirect(new URL('/meta-connect?error=no_account_id', request.url));
    }

    // ── Token expires in ~60 days; store 59 to be safe ───────────────────────
    const expiresAt = new Date(Date.now() + 59 * 24 * 60 * 60 * 1000).toISOString();

    await upsertToken({
      ad_account_id: adAccountId,
      access_token:  longToken.access_token,
      expires_at:    expiresAt,
      scope:         'ads_read,ads_management,read_insights,business_management',
      meta_user_id:  metaUserId,
    });

    return NextResponse.redirect(new URL('/meta-connect?success=true', request.url));
  } catch (err) {
    console.error('[meta/callback]', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/meta-connect?error=${encodeURIComponent(msg)}`, request.url),
    );
  }
}
