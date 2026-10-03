import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';

// U2.10 Stubs — real logic arrives in Workstream F
export async function GET() {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}

export async function POST() {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}

export async function DELETE() {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}
