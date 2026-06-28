export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    enabled: true,
    mode: hasKey ? 'live' : 'demo',
    hasAnthropicKey: hasKey,
    message: hasKey ? 'Nova is running live' : 'Nova is running in demo mode — add ANTHROPIC_API_KEY to enable live AI',
  });
}
