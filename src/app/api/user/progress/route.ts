export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mediaId, episodeId, progressSeconds, totalDuration } = await req.json();
    
    // Auto-mark completed if past 90%
    const isCompleted = progressSeconds > (totalDuration * 0.9);

    // Using findFirst + update/create since Prisma compound unique with nullable fields behaves differently across DBs
    const existing = await prisma.watchProgress.findFirst({
      where: {
        userId: session.user.id,
        mediaId,
        episodeId: episodeId || null
      }
    });

    if (existing) {
      await prisma.watchProgress.update({
        where: { id: existing.id },
        data: { timestampSec: progressSeconds, isCompleted }
      });
    } else {
      await prisma.watchProgress.create({
        data: {
          userId: session.user.id,
          mediaId,
          episodeId: episodeId || null,
          timestampSec: progressSeconds,
          isCompleted
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync progress' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const progress = await prisma.watchProgress.findMany({
      where: { 
        userId: session.user.id, 
        isCompleted: false 
      },
      orderBy: { updatedAt: 'desc' },
      include: { media: true, episode: true },
      take: 20
    });
    
    return NextResponse.json(progress);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

