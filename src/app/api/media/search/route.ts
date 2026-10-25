export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const category = searchParams.get('category')?.trim();

  if (!q && !category) {
    return NextResponse.json({ results: [] });
  }

  try {
    const categoryFilter = category && category !== 'ALL' ? { category } : {};
    const lowerQ = q ? q.toLowerCase() : '';

    let results: any[] = [];

    if (lowerQ === 'trending' || lowerQ === 'trending now') {
      results = await prisma.media.findMany({
        where: {
          isPublished: true,
          ...categoryFilter
        },
        orderBy: { createdAt: 'desc' },
        take: 40
      });
    } else if (lowerQ === 'top rated') {
      results = await prisma.media.findMany({
        where: {
          isPublished: true,
          rating: { not: null },
          ...categoryFilter
        },
        orderBy: { rating: 'desc' },
        take: 40
      });
    } else if (lowerQ === 'all') {
      results = await prisma.media.findMany({
        where: {
          isPublished: true,
          ...categoryFilter
        },
        orderBy: { createdAt: 'desc' },
        take: 40
      });
    } else {
      results = await prisma.media.findMany({
        where: {
          isPublished: true,
          ...categoryFilter,
          ...(q ? {
            OR: [
              { title: { contains: q } },
              { originalTitle: { contains: q } },
              { overview: { contains: q } },
              { genres: { contains: q } },
              { category: { contains: q } },
              { cast: { contains: q } },
              { directors: { contains: q } }
            ]
          } : {})
        },
        orderBy: { createdAt: 'desc' },
        take: 40
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
