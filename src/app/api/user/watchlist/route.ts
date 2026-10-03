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
    const { mediaId } = await req.json();

    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_mediaId: {
          userId: session.user.id,
          mediaId
        }
      }
    });

    if (existing) {
      await prisma.watchlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed', success: true });
    } else {
      await prisma.watchlist.create({
        data: {
          userId: session.user.id,
          mediaId
        }
      });
      return NextResponse.json({ action: 'added', success: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to toggle watchlist' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const list = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: 'desc' },
      include: { media: true }
    });
    
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

