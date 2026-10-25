// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';
import { getTorrentHealthSnapshot } from '@/lib/admin/torrentHealth';
import { requireAdminSession } from '@/lib/authGuard';

export async function GET(req: Request) {
  // [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT] Admin authorization guard
  const { errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  if (!featureFlags.adminTorrentLive) {
    return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? undefined;
  const tmdbIdRaw = searchParams.get('tmdbId');
  const tmdbId = tmdbIdRaw ? parseInt(tmdbIdRaw, 10) : undefined;

  try {
    const snapshot = await getTorrentHealthSnapshot({ search, tmdbId });
    return NextResponse.json(snapshot);
  } catch (err: any) {
    console.error('GET /api/admin/torrents/health error:', err);
    return NextResponse.json({ error: 'Failed to fetch torrent health' }, { status: 500 });
  }
}
