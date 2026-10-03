import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '../../../../../../auth';
import { featureFlags } from '../../../../../lib/featureFlags';

const prisma = new PrismaClient();

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  if (!featureFlags.reviews) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  const params = await props.params;

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const review = await prisma.review.findUnique({ where: { id: params.id } });
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (review.userId === session.user.id) return NextResponse.json({ error: 'Cannot report own review' }, { status: 400 });

    const existingReport = await prisma.reviewReport.findFirst({
      where: { reviewId: review.id, reporterUserId: session.user.id }
    });
    if (existingReport) return NextResponse.json({ error: 'Already reported' }, { status: 409 });

    const { reason } = await req.json();
    const validReasons = ['SPAM', 'ABUSE', 'SPOILER', 'OFF_TOPIC', 'OTHER'];
    if (!validReasons.includes(reason)) return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });

    const report = await prisma.reviewReport.create({
      data: {
        reviewId: review.id,
        reporterUserId: session.user.id,
        reason
      }
    });

    return NextResponse.json({ success: true, report });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to report' }, { status: 500 });
  }
}

