import { NextResponse } from 'next/server';
import { getIntegrationStatus } from '@/lib/supabase/meta-repository';

export const runtime = 'nodejs';

export async function GET() {
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!accountId) {
    return NextResponse.json({ connected: false, reason: 'META_AD_ACCOUNT_ID not configured' });
  }

  const status = await getIntegrationStatus(accountId);
  if (!status) {
    return NextResponse.json({ connected: false });
  }

  const expiresAt  = status.expires_at ? new Date(status.expires_at) : null;
  const daysLeft   = expiresAt ? Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000) : null;
  const isExpired  = daysLeft !== null && daysLeft <= 0;

  return NextResponse.json({
    connected:      !isExpired,
    ad_account_id:  status.ad_account_id,
    meta_user_id:   status.meta_user_id,
    expires_at:     status.expires_at,
    days_remaining: daysLeft,
    connected_since:status.created_at,
  });
}
