import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { mergeMedia, mergeAllDuplicates, findDuplicateGroups } from '@/lib/mediaMerge';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const groups = await findDuplicateGroups(prisma);
    const totalDuplicates = groups.reduce((acc, g) => acc + g.duplicates.length, 0);

    return NextResponse.json({
      duplicateGroups: groups,
      totalDuplicateCount: totalDuplicates
    });
  } catch (err: any) {
    console.error('GET /api/admin/media/merge-by-tmdb error:', err);
    return NextResponse.json({ error: 'Failed to scan for duplicate media' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Explicit source -> target merge
    if (body.sourceId && body.targetId) {
      const res = await mergeMedia(body.sourceId, body.targetId, prisma);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to merge media' }, { status: 400 });
      }
      return NextResponse.json({ success: true, result: res });
    }

    // 2. Specific TMDB ID merge
    if (body.tmdbId) {
      const parsedTmdbId = parseInt(body.tmdbId);
      if (isNaN(parsedTmdbId)) {
        return NextResponse.json({ error: 'Invalid TMDB ID' }, { status: 400 });
      }

      const mediaWithTmdb = await prisma.media.findMany({
        where: { tmdbId: parsedTmdbId },
        include: { torrents: true },
        orderBy: { createdAt: 'asc' }
      });

      if (mediaWithTmdb.length <= 1) {
        return NextResponse.json({ message: 'No duplicate media found for this TMDB ID', mergedCount: 0 });
      }

      const primary = mediaWithTmdb[0];
      const results = [];
      for (let i = 1; i < mediaWithTmdb.length; i++) {
        const res = await mergeMedia(mediaWithTmdb[i].id, primary.id, prisma);
        if (res.success) results.push(res);
      }

      return NextResponse.json({
        success: true,
        mergedCount: results.length,
        primaryId: primary.id,
        results
      });
    }

    // 3. Auto-scan and merge all duplicates (by same TMDB ID or clean title)
    const results = await mergeAllDuplicates(prisma);
    const totalTorrentsMoved = results.reduce((acc, r) => acc + (r.movedTorrentsCount || 0), 0);

    return NextResponse.json({
      success: true,
      mergedCount: results.length,
      movedTorrentsCount: totalTorrentsMoved,
      results
    });
  } catch (err: any) {
    console.error('POST /api/admin/media/merge-by-tmdb error:', err);
    return NextResponse.json({ error: 'Failed to merge duplicate media' }, { status: 500 });
  }
}
