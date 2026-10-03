import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '../../../../../../auth';
import { featureFlags } from '../../../../../lib/featureFlags';

const prisma = new PrismaClient();

function sanitizeBody(text: string) {
  let clean = text.replace(/<[^>]*>?/gm, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  if (!featureFlags.reviews) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  const params = await props.params;

  const url = new URL(req.url);
  const sort = url.searchParams.get('sort') || 'newest';
  const filterStars = Number(url.searchParams.get('stars')) || 0;

  const session = await auth();
  const userId = session?.user?.id;

  try {
    const media = await prisma.media.findUnique({ where: { id: params.slug } });
    if (!media || !media.isPublished) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const whereClause: any = {
      mediaId: media.id,
      status: { not: 'REMOVED' }
    };
    if (filterStars > 0) whereClause.rating = filterStars;

    let orderByClause: any = { createdAt: 'desc' };
    if (sort === 'top') orderByClause = [{ rating: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'lowest') orderByClause = [{ rating: 'asc' }, { createdAt: 'desc' }];

    const allReviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, email: true, preferences: true } }
      },
      orderBy: orderByClause,
      take: 20
    });

    const mappedReviews = allReviews.map(r => {
      let prefs: any = {};
      try { if (r.user?.preferences) prefs = JSON.parse(r.user.preferences); } catch(e) {}
      return {
        ...r,
        user: r.user ? {
          id: r.user.id,
          displayName: prefs.displayName || r.user.email.split('@')[0],
          avatarUrl: prefs.avatar || null
        } : null
      };
    });
    const filteredReviews = mappedReviews.filter(r => {
        

      if (r.status === 'HIDDEN') return r.userId === userId;
      return true;
    });

    let userReview = null;
    if (userId) {
      userReview = filteredReviews.find(r => r.userId === userId) || null;
    }

    let restricted = null;
    if (userId) {
      const activeBlock = await prisma.userRestriction.findFirst({
        where: {
          userId,
          type: 'REVIEW_BLOCK',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });
      if (activeBlock) {
        restricted = { reason: activeBlock.reason, expiresAt: activeBlock.expiresAt };
      }
    }

    const distributionRaw = await prisma.review.groupBy({
      by: ['rating'],
      where: { mediaId: media.id, status: 'VISIBLE' },
      _count: { rating: true }
    });
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distributionRaw.forEach(d => {
      distribution[d.rating] = d._count.rating;
    });

    return NextResponse.json({
      summary: {
        count: media.reviewCount,
        avg: media.reviewAvgRating
      },
      distribution,
      reviews: filteredReviews.filter(r => r.userId !== userId),
      userReview,
      restricted
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: Request, props: { params: Promise<{ slug: string }> }) {
  if (!featureFlags.reviews) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  const params = await props.params;

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const media = await prisma.media.findUnique({ where: { id: params.slug } });
    if (!media || !media.isPublished) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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

    const existing = await prisma.review.findFirst({ where: { mediaId: media.id, userId: session.user.id } });
    if (existing) return NextResponse.json({ error: 'REVIEW_EXISTS' }, { status: 409 });

    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentCount = await prisma.review.count({
      where: { userId: session.user.id, createdAt: { gte: oneHourAgo } }
    });
    if (recentCount >= 5) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const { body, stars, isSpoiler } = await req.json();
    
    const cleanBody = sanitizeBody(body);
    if (cleanBody.length < 10 || cleanBody.length > 1500) return NextResponse.json({ error: 'Invalid length' }, { status: 400 });

    const newReview = await prisma.review.create({
      data: {
        mediaId: media.id,
        userId: session.user.id,
        rating: Number(stars),
        body: cleanBody,
        containsSpoilers: Boolean(isSpoiler),
        status: 'VISIBLE'
      }
    });

    const agg = await prisma.review.aggregate({
      where: { mediaId: media.id, status: 'VISIBLE' },
      _count: true,
      _avg: { rating: true }
    });
    await prisma.media.update({
      where: { id: media.id },
      data: {
        reviewCount: agg._count || 0,
        reviewAvgRating: agg._avg.rating || 0
      }
    });

    return NextResponse.json(newReview);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

