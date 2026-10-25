export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_LANDING_ROWS } from '@/lib/landingRows';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Delete all current landing rows
    await prisma.landingRow.deleteMany({});

    // Re-seed default rows
    for (const def of DEFAULT_LANDING_ROWS) {
      await prisma.landingRow.create({
        data: {
          title: def.title,
          type: def.type,
          genre: def.genre || null,
          category: def.category || null,
          customMediaIds: def.customMediaIds || null,
          limit: def.limit,
          sortOrder: def.sortOrder,
          isEnabled: def.isEnabled
        }
      });
    }

    const resetRows = await prisma.landingRow.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json({ success: true, rows: resetRows });
  } catch (err: any) {
    console.error('POST /api/admin/landing-rows/reset error:', err);
    return NextResponse.json({ error: 'Failed to reset rows', details: err.message }, { status: 500 });
  }
}
