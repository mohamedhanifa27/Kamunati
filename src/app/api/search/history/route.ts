import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';
import { auth } from '../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keep GET and POST as stubs for Workstream F as per plan, but implement DELETE for Workstream E
export async function GET() {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const results = await prisma.searchHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { lastSearchedAt: 'desc' },
      take: 20
    });
    return NextResponse.json({ results: results.map((r: any) => ({ ...r, query: r.queryDisplay })) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const queryDisplay = body.query?.trim();
    if (!queryDisplay || queryDisplay.length < 2) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });

    const queryNormalized = queryDisplay.toLowerCase().replace(/\s+/g, ' ');

    // Deduplicate: check if it exists (case-insensitive in DB)
    const existing = await prisma.searchHistory.findFirst({
      where: { 
        userId: session.user.id,
        queryNormalized
      }
    });

    if (existing) {
      await prisma.searchHistory.update({
        where: { id: existing.id },
        data: { 
          lastSearchedAt: new Date(),
          count: { increment: 1 }
        }
      });
    } else {
      // Create new
      await prisma.searchHistory.create({
        data: {
          userId: session.user.id,
          queryNormalized,
          queryDisplay,
          lastSearchedAt: new Date()
        }
      });

      // Enforce cap of 50
      const count = await prisma.searchHistory.count({ where: { userId: session.user.id } });
      if (count > 50) {
        const oldest = await prisma.searchHistory.findMany({
          where: { userId: session.user.id },
          orderBy: { lastSearchedAt: 'asc' },
          take: count - 50
        });
        if (oldest.length > 0) {
          await prisma.searchHistory.deleteMany({
            where: { id: { in: oldest.map((o: any) => o.id) } }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
  }
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
