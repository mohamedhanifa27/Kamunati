export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ensureDefaultLandingRows, DEFAULT_LANDING_ROWS, fetchMediaForLandingRow } from '../../../../lib/landingRows';

const prisma = new PrismaClient();

export async function GET() {
  try {
    await ensureDefaultLandingRows(prisma);

    const rows = await prisma.landingRow.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    // Compute live count of matching items for each row
    const rowsWithCounts = await Promise.all(
      rows.map(async (row) => {
        const items = await fetchMediaForLandingRow(prisma, row);
        return {
          ...row,
          itemCount: items.length
        };
      })
    );

    // Fetch distinct genres from published media
    const allMedia = await prisma.media.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, posterPath: true, releaseYear: true, category: true, genres: true }
    });

    const genreSet = new Set<string>();
    allMedia.forEach(m => {
      try {
        const parsed = JSON.parse(m.genres || '[]');
        if (Array.isArray(parsed)) {
          parsed.forEach(g => {
            if (typeof g === 'string' && g.trim()) genreSet.add(g.trim());
          });
        }
      } catch {}
    });

    // Standard fallback genres if DB genres are few
    const standardGenres = [
      'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
      'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
      'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
      'Thriller', 'War', 'Western'
    ];
    standardGenres.forEach(g => genreSet.add(g));

    return NextResponse.json({
      rows: rowsWithCounts,
      availableGenres: Array.from(genreSet).sort(),
      availableCategories: ['ALL', 'MOVIE', 'TV_SERIES', 'ANIME'],
      publishedMedia: allMedia.map(m => ({
        id: m.id,
        title: m.title,
        posterPath: m.posterPath,
        releaseYear: m.releaseYear,
        category: m.category
      }))
    });
  } catch (err: any) {
    console.error('GET /api/admin/landing-rows error:', err);
    return NextResponse.json({ error: 'Failed to fetch admin rows', details: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, type, genre, category, customMediaIds, limit, isEnabled } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const maxRow = await prisma.landingRow.findFirst({
      orderBy: { sortOrder: 'desc' }
    });
    const nextOrder = (maxRow?.sortOrder ?? -1) + 1;

    let stringifiedCustomIds = null;
    if (Array.isArray(customMediaIds)) {
      stringifiedCustomIds = JSON.stringify(customMediaIds);
    } else if (typeof customMediaIds === 'string') {
      stringifiedCustomIds = customMediaIds;
    }

    const created = await prisma.landingRow.create({
      data: {
        title: title.trim(),
        type: type || 'TRENDING',
        genre: genre || null,
        category: category && category !== 'ALL' ? category : null,
        customMediaIds: stringifiedCustomIds,
        limit: limit ? parseInt(limit, 10) : 20,
        sortOrder: nextOrder,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/landing-rows error:', err);
    return NextResponse.json({ error: 'Failed to create landing row', details: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { rows } = body;

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: 'Rows array required' }, { status: 400 });
    }

    // Reorder and update enabled states
    await prisma.$transaction(
      rows.map((r: { id: string; sortOrder: number; isEnabled?: boolean }) =>
        prisma.landingRow.update({
          where: { id: r.id },
          data: {
            sortOrder: r.sortOrder,
            ...(r.isEnabled !== undefined ? { isEnabled: Boolean(r.isEnabled) } : {})
          }
        })
      )
    );

    const updated = await prisma.landingRow.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json({ success: true, rows: updated });
  } catch (err: any) {
    console.error('PUT /api/admin/landing-rows error:', err);
    return NextResponse.json({ error: 'Failed to reorder landing rows', details: err.message }, { status: 500 });
  }
}
