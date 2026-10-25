export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ensureDefaultLandingRows, fetchMediaForLandingRow } from '../../../../lib/landingRows';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;

    await ensureDefaultLandingRows(prisma);

    const rows = await prisma.landingRow.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' }
    });

    const evaluatedRows = await Promise.all(
      rows.map(async (row) => {
        const items = await fetchMediaForLandingRow(prisma, row, category);
        return {
          id: row.id,
          title: row.title,
          type: row.type,
          genre: row.genre,
          category: row.category,
          limit: row.limit,
          sortOrder: row.sortOrder,
          items
        };
      })
    );

    // Only return rows that have matching media items
    const nonEmptyRows = evaluatedRows.filter(r => r.items.length > 0);

    return NextResponse.json(nonEmptyRows);
  } catch (err: any) {
    console.error('GET /api/landing/rows error:', err);
    return NextResponse.json({ error: 'Failed to fetch landing rows', details: err.message }, { status: 500 });
  }
}
