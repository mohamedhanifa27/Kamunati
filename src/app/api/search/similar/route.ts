import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';

export async function GET() {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}
