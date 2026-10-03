import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';
import { auth } from '../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keep GET and POST as stubs for Workstream F as per plan, but implement DELETE for Workstream E
export async function GET() {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}

export async function POST() {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}

export async function DELETE() {
  // If the flag isn't specifically guarding DELETE, or if singleProfile implies it, we just do it.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.searchHistory.deleteMany({
      where: { userId: session.user.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear search history' }, { status: 500 });
  }
}
