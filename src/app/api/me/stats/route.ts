import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth'; 
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [user, titlesWatched, totalSeconds, listSize, reviewsWritten] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { createdAt: true } }),
      prisma.watchProgress.count({ where: { userId: session.user.id, isCompleted: true } }),
      prisma.watchProgress.aggregate({
        where: { userId: session.user.id },
        _sum: { timestampSec: true }
      }),
      prisma.watchlist.count({ where: { userId: session.user.id } }),
      prisma.review.count({ where: { userId: session.user.id } })
    ]);

    return NextResponse.json({
      memberSince: user?.createdAt,
      titlesWatched,
      hoursWatched: Math.round((totalSeconds._sum.timestampSec || 0) / 3600),
      listSize,
      reviewsWritten
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
