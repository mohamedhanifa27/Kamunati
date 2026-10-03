import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';

// U2.10 Stub — real logic arrives in Workstream G
export async function GET() {
  if (!featureFlags.reviews) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}

export async function POST() {
  if (!featureFlags.reviews) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}
