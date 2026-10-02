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
    const { mediaId, score } = await req.json();

    if (typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json({ error: 'Score must be between 1 and 5' }, { status: 400 });
    }

    const rating = await prisma.rating.upsert({
      where: {
        userId_mediaId: {
          userId: session.user.id,
          mediaId
        }
      },
      update: { score },
      create: {
        userId: session.user.id,
        mediaId,
        score
      }
    });

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get('mediaId');

  if (!mediaId) {
    return NextResponse.json({ error: 'mediaId required' }, { status: 400 });
  }

  try {
    const rating = await prisma.rating.findUnique({
      where: {
        userId_mediaId: {
          userId: session.user.id,
          mediaId
        }
      }
    });
    
    return NextResponse.json({ score: rating?.score || null });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rating' }, { status: 500 });
  }
}
