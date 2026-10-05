/**
 * Torrent Health Sampler — reads from the engine's public status accessors.
 * Never writes to or modifies the torrent engine. Read-only.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TorrentHealthSnapshot {
  id: string;
  infoHash: string;
  title: string;
  resolution: string;
  mediaTitle: string | null;
  tmdbId: number | null;
  mediaId: string | null;
  // Swarm stats from DB (last known)
  seeders: number;
  leechers: number;
  lastCheckedAt: string | null;
  // In-app viewers from UserPresence
  viewers: number;
}

/**
 * Fetches a full health snapshot of all torrents.
 * Swarm peers come from the TorrentSource table (seeders/leechers last written by the engine's check cycle).
 * Viewers come from UserPresence (users whose currentMediaAssetId maps to this torrent's media).
 */
export async function getTorrentHealthSnapshot(opts?: {
  search?: string;
  tmdbId?: number;
}): Promise<TorrentHealthSnapshot[]> {
  const where: any = {};

  if (opts?.tmdbId) {
    where.media = { tmdbId: opts.tmdbId };
  }

  if (opts?.search) {
    where.OR = [
      { title: { contains: opts.search, mode: 'insensitive' } },
      { media: { title: { contains: opts.search, mode: 'insensitive' } } }
    ];
  }

  const torrents = await prisma.torrentSource.findMany({
    where,
    include: {
      media: {
        select: { id: true, title: true, tmdbId: true }
      }
    },
    orderBy: { title: 'asc' }
  });

  // Get all active viewers grouped by mediaId
  const presences = await prisma.userPresence.groupBy({
    by: ['currentTitleId'],
    where: { state: 'ONLINE', currentTitleId: { not: null } },
    _count: { userId: true }
  });

  const viewerMap = new Map<string, number>();
  for (const p of presences) {
    if (p.currentTitleId) {
      viewerMap.set(p.currentTitleId, p._count.userId);
    }
  }

  return torrents.map(t => ({
    id: t.id,
    infoHash: t.infoHash,
    title: t.title,
    resolution: t.resolution,
    mediaTitle: t.media?.title ?? null,
    tmdbId: t.media?.tmdbId ?? null,
    mediaId: t.mediaId,
    seeders: t.seeders,
    leechers: t.leechers,
    lastCheckedAt: t.lastCheckedAt?.toISOString() ?? null,
    viewers: t.mediaId ? (viewerMap.get(t.mediaId) ?? 0) : 0
  }));
}
