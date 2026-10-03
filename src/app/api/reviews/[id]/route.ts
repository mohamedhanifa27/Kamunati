import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '../../../../../auth';
import { featureFlags } from '../../../../lib/featureFlags';

const prisma = new PrismaClient();

function sanitizeBody(text: string) {
  let clean = text.replace(/<[^>]*>?/gm, '');
  return clean.replace(/\s+/g, ' ').trim();
}

async function updateMediaAggregates(mediaId: string) {
  const agg = await prisma.review.aggregate({
    where: { mediaId, status: 'VISIBLE' },
    _count: true,
    _avg: { rating: true }
  });
  await prisma.media.update({
    where: { id: mediaId },
    data: {
      reviewCount: agg._count || 0,
      reviewAvgRating: agg._avg.rating || 0
    }
  });
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  if (!featureFlags.reviews) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  const params = await props.params;

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const review = await prisma.review.findUnique({ where: { id: params.id } });
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (review.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.review.delete({ where: { id: review.id } });
    await updateMediaAggregates(review.mediaId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  if (!featureFlags.reviews) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  const params = await props.params;

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const review = await prisma.review.findUnique({ where: { id: params.id } });
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (review.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Check block
    const activeBlock = await prisma.userRestriction.findFirst({
      where: {
        userId: session.user.id,
        type: 'REVIEW_BLOCK',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    if (activeBlock) return NextResponse.json({ error: 'REVIEW_RESTRICTED' }, { status: 403 });

    const { body, stars, isSpoiler } = await req.json();
    const cleanBody = sanitizeBody(body);
    if (cleanBody.length < 10 || cleanBody.length > 1500) return NextResponse.json({ error: 'Invalid length' }, { status: 400 });

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: {
        rating: Number(stars),
        body: cleanBody,
        containsSpoilers: Boolean(isSpoiler),
        editedAt: new Date()
      }
    });

    await updateMediaAggregates(review.mediaId);

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

