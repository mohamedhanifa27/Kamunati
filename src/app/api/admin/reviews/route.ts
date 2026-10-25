// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdminSession } from '@/lib/authGuard';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  // [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT] Admin authorization guard
  const { errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get('mediaId');
    const status = searchParams.get('status'); // VISIBLE, HIDDEN, REMOVED

    const where: any = {};
    if (mediaId) where.mediaId = mediaId;
    if (status && status !== 'ALL') where.status = status;

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, role: true, preferences: true } },
        media: { select: { title: true, id: true } },
        _count: { select: { reports: true } }
      },
      take: 100 // pagination could be added later
    });

    // Map display names
    const mapped = reviews.map(r => {
      let displayName = 'Anonymous';
      if (r.user?.preferences) {
        try {
          const pref = JSON.parse(r.user.preferences);
          if (pref.displayName) displayName = pref.displayName;
        } catch(e) {}
      }
      return {
        ...r,
        displayName: r.isEditorial ? r.authorLabel || 'Editor' : displayName
      };
    });

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error('GET /api/admin/reviews error:', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
