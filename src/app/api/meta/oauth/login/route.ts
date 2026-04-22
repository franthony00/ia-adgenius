import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET() {
  const appId       = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;
  const stateSecret = process.env.META_OAUTH_STATE_SECRET;

  if (!appId || !redirectUri || !stateSecret) {
    return NextResponse.json(
      { error: 'Missing META_APP_ID, META_REDIRECT_URI, or META_OAUTH_STATE_SECRET in environment' },
      { status: 500 },
    );
  }

  // Generate CSRF state token
  const state = `${Date.now()}_${crypto.randomUUID()}`;

  // Store state in HttpOnly cookie (10 min TTL)
  const cookieStore = await cookies();
  cookieStore.set('meta_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });

  const scopes = [
    'ads_read',
    'ads_management',
    'read_insights',
    'business_management',
  ].join(',');

  const oauthUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  oauthUrl.searchParams.set('client_id',    appId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('state',        state);
  oauthUrl.searchParams.set('scope',        scopes);
  oauthUrl.searchParams.set('response_type','code');

  return NextResponse.redirect(oauthUrl.toString());
}
