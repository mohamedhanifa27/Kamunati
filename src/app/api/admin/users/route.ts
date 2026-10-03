import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';

// U2.10 Stub — real logic arrives in Workstream H
export async function GET() {
  if (!featureFlags.adminUserTools) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}

export async function POST() {
  if (!featureFlags.adminUserTools) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}
