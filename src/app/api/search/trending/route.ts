import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  
  try {
    // Basic Prisma aggregation to find popular searches in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Group by query and count
    const trending = await prisma.searchHistory.groupBy({
      by: ['queryDisplay'],
      where: {
        lastSearchedAt: { gte: sevenDaysAgo }
      },
      _count: {
        queryDisplay: true
      },
      orderBy: {
        _count: { queryDisplay: 'desc' }
      },
      take: 6
    });

    // In a real app we'd filter to "searched by at least 5 different users", 
    // but Prisma groupBy on distinct users is complex without raw SQL.
    // For this prototype, we'll return top 6 frequent queries.

    const results = trending.map((t: any) => ({ query: t.queryDisplay, count: t._count.queryDisplay }));

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 });
  }
}
