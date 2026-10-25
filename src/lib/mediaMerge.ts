import { PrismaClient } from '@prisma/client';

export interface MergeResult {
  success: boolean;
  movedTorrentsCount?: number;
  targetId?: string;
  sourceTitle?: string;
  targetTitle?: string;
  error?: string;
}

export interface DuplicateGroup {
  type: 'tmdbId' | 'title';
  key: string;
  primary: {
    id: string;
    title: string;
    tmdbId: number | null;
    type: string;
    releaseYear: number | null;
    posterPath: string | null;
    torrentCount: number;
  };
  duplicates: Array<{
    id: string;
    title: string;
    tmdbId: number | null;
    type: string;
    releaseYear: number | null;
    posterPath: string | null;
    torrentCount: number;
  }>;
}

/**
 * Merges a source media into a target media:
 * - Moves all direct TorrentSource records from source to target (avoiding identical infoHash+fileIndex duplicates).
 * - Copies any missing metadata (poster, backdrop, overview, runtime, etc.) from source to target.
 * - Merges seasons/episodes and moves their torrent sources if TV Series.
 * - Transfers watch progress, watchlists, ratings, and reviews (safely avoiding unique constraint conflicts).
 * - Deletes the source media record.
 */
export async function mergeMedia(sourceId: string, targetId: string, prisma: PrismaClient): Promise<MergeResult> {
  if (sourceId === targetId) {
    return { success: false, error: 'Cannot merge a title into itself' };
  }

  try {
    const source = await prisma.media.findUnique({
      where: { id: sourceId },
      include: {
        torrents: true,
        seasons: {
          include: {
            episodes: {
              include: { torrents: true }
            }
          }
        }
      }
    });

    const target = await prisma.media.findUnique({
      where: { id: targetId },
      include: {
        torrents: true,
        seasons: {
          include: {
            episodes: {
              include: { torrents: true }
            }
          }
        }
      }
    });

    if (!source) return { success: false, error: `Source media ${sourceId} not found` };
    if (!target) return { success: false, error: `Target media ${targetId} not found` };

    let movedTorrentsCount = 0;
    const existingTargetTorrents = [...target.torrents];

    // 1. Move direct torrent sources
    for (const t of source.torrents) {
      const alreadyHas = existingTargetTorrents.some(
        tt => tt.infoHash.toLowerCase() === t.infoHash.toLowerCase() && tt.fileIndex === t.fileIndex
      );

      if (!alreadyHas) {
        await prisma.torrentSource.update({
          where: { id: t.id },
          data: { mediaId: targetId }
        });
        existingTargetTorrents.push(t);
        movedTorrentsCount++;
      } else {
        await prisma.torrentSource.delete({ where: { id: t.id } });
      }
    }

    // 2. Move season/episode torrents if TV Series
    if (source.seasons && source.seasons.length > 0) {
      for (const sourceSeason of source.seasons) {
        let targetSeason: any = target.seasons?.find(s => s.seasonNumber === sourceSeason.seasonNumber);
        if (!targetSeason) {
          targetSeason = await prisma.season.create({
            data: {
              mediaId: targetId,
              seasonNumber: sourceSeason.seasonNumber,
              name: sourceSeason.name,
              overview: sourceSeason.overview,
              posterPath: sourceSeason.posterPath,
              airDate: sourceSeason.airDate
            }
          });
        }

        // Fetch target episodes fresh for this season
        const currentTargetEpisodes: any[] = await prisma.episode.findMany({
          where: { seasonId: targetSeason.id },
          include: { torrents: true }
        });

        for (const sourceEp of sourceSeason.episodes) {
          let targetEp: any = currentTargetEpisodes.find(e => e.episodeNumber === sourceEp.episodeNumber);
          if (!targetEp) {
            targetEp = await prisma.episode.create({
              data: {
                seasonId: targetSeason.id,
                episodeNumber: sourceEp.episodeNumber,
                title: sourceEp.title,
                overview: sourceEp.overview,
                stillPath: sourceEp.stillPath,
                airDate: sourceEp.airDate,
                duration: sourceEp.duration
              },
              include: { torrents: true }
            });
            currentTargetEpisodes.push(targetEp);
          }

          for (const epTorrent of sourceEp.torrents) {
            const alreadyHasEpTorrent = targetEp.torrents?.some(
              et => et.infoHash.toLowerCase() === epTorrent.infoHash.toLowerCase() && et.fileIndex === epTorrent.fileIndex
            );

            if (!alreadyHasEpTorrent) {
              await prisma.torrentSource.update({
                where: { id: epTorrent.id },
                data: { episodeId: targetEp.id, mediaId: null }
              });
              movedTorrentsCount++;
            } else {
              await prisma.torrentSource.delete({ where: { id: epTorrent.id } });
            }
          }
        }
      }
    }

    // 3. Move WatchProgress
    const sourceProgress = await prisma.watchProgress.findMany({ where: { mediaId: sourceId } });
    for (const wp of sourceProgress) {
      const existingWP = await prisma.watchProgress.findFirst({
        where: { userId: wp.userId, mediaId: targetId, episodeId: wp.episodeId }
      });
      if (!existingWP) {
        await prisma.watchProgress.update({
          where: { id: wp.id },
          data: { mediaId: targetId }
        });
      } else {
        await prisma.watchProgress.delete({ where: { id: wp.id } });
      }
    }

    // 4. Move Watchlists
    const sourceWatchlists = await prisma.watchlist.findMany({ where: { mediaId: sourceId } });
    for (const wl of sourceWatchlists) {
      const existingWL = await prisma.watchlist.findUnique({
        where: { userId_mediaId: { userId: wl.userId, mediaId: targetId } }
      });
      if (!existingWL) {
        await prisma.watchlist.update({
          where: { id: wl.id },
          data: { mediaId: targetId }
        });
      } else {
        await prisma.watchlist.delete({ where: { id: wl.id } });
      }
    }

    // 5. Move Ratings
    const sourceRatings = await prisma.rating.findMany({ where: { mediaId: sourceId } });
    for (const r of sourceRatings) {
      const existingR = await prisma.rating.findUnique({
        where: { userId_mediaId: { userId: r.userId, mediaId: targetId } }
      });
      if (!existingR) {
        await prisma.rating.update({
          where: { id: r.id },
          data: { mediaId: targetId }
        });
      } else {
        await prisma.rating.delete({ where: { id: r.id } });
      }
    }

    // 6. Move Reviews
    const sourceReviews = await prisma.review.findMany({ where: { mediaId: sourceId } });
    for (const rev of sourceReviews) {
      if (rev.userId) {
        const existingRev = await prisma.review.findUnique({
          where: { mediaId_userId: { mediaId: targetId, userId: rev.userId } }
        });
        if (!existingRev) {
          await prisma.review.update({
            where: { id: rev.id },
            data: { mediaId: targetId }
          });
        } else {
          await prisma.review.delete({ where: { id: rev.id } });
        }
      } else {
        await prisma.review.update({
          where: { id: rev.id },
          data: { mediaId: targetId }
        });
      }
    }

    // 7. Enrich target with any missing metadata that source has
    const targetUpdates: any = {};
    if (!target.tmdbId && source.tmdbId) targetUpdates.tmdbId = source.tmdbId;
    if (!target.imdbId && source.imdbId) targetUpdates.imdbId = source.imdbId;
    if (!target.posterPath && source.posterPath) targetUpdates.posterPath = source.posterPath;
    if (!target.backdropPath && source.backdropPath) targetUpdates.backdropPath = source.backdropPath;
    if (!target.logoPath && source.logoPath) targetUpdates.logoPath = source.logoPath;
    if (!target.overview && source.overview) targetUpdates.overview = source.overview;
    if (!target.tagline && source.tagline) targetUpdates.tagline = source.tagline;
    if (!target.runtime && source.runtime) targetUpdates.runtime = source.runtime;
    if (!target.releaseYear && source.releaseYear) targetUpdates.releaseYear = source.releaseYear;
    if (!target.rating && source.rating) targetUpdates.rating = source.rating;
    if (!target.voteCount && source.voteCount) targetUpdates.voteCount = source.voteCount;
    if ((!target.genres || target.genres === '[]') && source.genres && source.genres !== '[]') {
      targetUpdates.genres = source.genres;
    }
    if ((!target.cast || target.cast === '[]') && source.cast && source.cast !== '[]') {
      targetUpdates.cast = source.cast;
    }
    if ((!target.directors || target.directors === '[]') && source.directors && source.directors !== '[]') {
      targetUpdates.directors = source.directors;
    }

    if (Object.keys(targetUpdates).length > 0) {
      await prisma.media.update({
        where: { id: targetId },
        data: targetUpdates
      });
    }

    // 8. Remove the redundant source media record
    await prisma.media.delete({ where: { id: sourceId } });

    return {
      success: true,
      movedTorrentsCount,
      targetId,
      sourceTitle: source.title,
      targetTitle: target.title
    };
  } catch (err: any) {
    console.error('mergeMedia error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Normalizes title for loose comparison (removes brackets, year, special chars).
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(19\d\d|20\d\d)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Scans the database and finds groups of duplicate media (by TMDB ID or normalized title).
 * Does NOT perform any writes; safe for previewing.
 */
export async function findDuplicateGroups(prisma: PrismaClient): Promise<DuplicateGroup[]> {
  const allMedia = await prisma.media.findMany({
    include: { torrents: true },
    orderBy: { createdAt: 'asc' }
  });

  const duplicateGroups: DuplicateGroup[] = [];
  const claimedIds = new Set<string>();

  // 1. Group by TMDB ID
  const byTmdbId = new Map<number, typeof allMedia>();
  for (const m of allMedia) {
    if (m.tmdbId) {
      const list = byTmdbId.get(m.tmdbId) || [];
      list.push(m);
      byTmdbId.set(m.tmdbId, list);
    }
  }

  for (const [tmdbId, group] of Array.from(byTmdbId.entries())) {
    if (group.length > 1) {
      // Pick best primary: one with highest torrent count, or has posters
      const sorted = group.slice().sort((a, b) => {
        if (a.posterPath && !b.posterPath) return -1;
        if (!a.posterPath && b.posterPath) return 1;
        return (b.torrents?.length || 0) - (a.torrents?.length || 0);
      });
      const primary = sorted[0];
      const duplicates = sorted.slice(1);

      claimedIds.add(primary.id);
      duplicates.forEach(d => claimedIds.add(d.id));

      duplicateGroups.push({
        type: 'tmdbId',
        key: `TMDB ID: ${tmdbId}`,
        primary: {
          id: primary.id,
          title: primary.title,
          tmdbId: primary.tmdbId,
          type: primary.type,
          releaseYear: primary.releaseYear,
          posterPath: primary.posterPath,
          torrentCount: primary.torrents?.length || 0
        },
        duplicates: duplicates.map(d => ({
          id: d.id,
          title: d.title,
          tmdbId: d.tmdbId,
          type: d.type,
          releaseYear: d.releaseYear,
          posterPath: d.posterPath,
          torrentCount: d.torrents?.length || 0
        }))
      });
    }
  }

  // 2. Group by Normalized Clean Title (for media not already claimed)
  const byTitle = new Map<string, typeof allMedia>();
  for (const m of allMedia) {
    if (claimedIds.has(m.id)) continue;
    const clean = normalizeTitle(m.title);
    if (clean.length > 2) {
      const list = byTitle.get(clean) || [];
      list.push(m);
      byTitle.set(clean, list);
    }
  }

  for (const [cleanTitle, group] of Array.from(byTitle.entries())) {
    if (group.length > 1) {
      const sorted = group.slice().sort((a, b) => {
        if (a.tmdbId && !b.tmdbId) return -1;
        if (!a.tmdbId && b.tmdbId) return 1;
        if (a.posterPath && !b.posterPath) return -1;
        if (!a.posterPath && b.posterPath) return 1;
        return (b.torrents?.length || 0) - (a.torrents?.length || 0);
      });
      const primary = sorted[0];
      const duplicates = sorted.slice(1);

      claimedIds.add(primary.id);
      duplicates.forEach(d => claimedIds.add(d.id));

      duplicateGroups.push({
        type: 'title',
        key: `Title: "${cleanTitle}"`,
        primary: {
          id: primary.id,
          title: primary.title,
          tmdbId: primary.tmdbId,
          type: primary.type,
          releaseYear: primary.releaseYear,
          posterPath: primary.posterPath,
          torrentCount: primary.torrents?.length || 0
        },
        duplicates: duplicates.map(d => ({
          id: d.id,
          title: d.title,
          tmdbId: d.tmdbId,
          type: d.type,
          releaseYear: d.releaseYear,
          posterPath: d.posterPath,
          torrentCount: d.torrents?.length || 0
        }))
      });
    }
  }

  return duplicateGroups;
}

/**
 * Scans the database for duplicate media entries and merges all torrents into the primary entry.
 */
export async function mergeAllDuplicates(prisma: PrismaClient): Promise<MergeResult[]> {
  const duplicateGroups = await findDuplicateGroups(prisma);
  const mergedResults: MergeResult[] = [];

  for (const group of duplicateGroups) {
    for (const dup of group.duplicates) {
      const res = await mergeMedia(dup.id, group.primary.id, prisma);
      if (res.success) {
        mergedResults.push(res);
      }
    }
  }

  return mergedResults;
}
