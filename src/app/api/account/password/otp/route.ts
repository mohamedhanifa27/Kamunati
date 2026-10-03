import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';

// U2.10 Stub — real logic arrives in Workstream D
export async function POST() {
  if (!featureFlags.settingsPage) {
    return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  }
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}
