import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '../../../../../auth';
import { featureFlags } from '../../../../lib/featureFlags';

const prisma = new PrismaClient();

export async function GET() {
  if (!featureFlags.reviews) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const reviews = await prisma.review.findMany({
      where: { userId: session.user.id },
      include: {
        media: { select: { id: true, title: true, posterPath: true, backdropPath: true, releaseYear: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ reviews });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
