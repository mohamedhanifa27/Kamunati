import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('reviewId');

    const where: any = {};
    if (reviewId) where.reviewId = reviewId;

    const reports = await prisma.reviewReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, preferences: true } }
      }
    });

    const mapped = reports.map(r => {
      let displayName = 'Anonymous';
      if (r.reporter?.preferences) {
        try {
          const pref = JSON.parse(r.reporter.preferences);
          if (pref.displayName) displayName = pref.displayName;
        } catch(e) {}
      }
      return { ...r, reporterName: displayName };
    });

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error('GET /api/admin/review-reports error:', err);
    return NextResponse.json({ error: 'Failed to fetch review reports' }, { status: 500 });
  }
}
