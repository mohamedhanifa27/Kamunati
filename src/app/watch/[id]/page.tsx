import React from 'react';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import WatchView from '../../../components/player/WatchView';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES]
export default async function WatchPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ episode?: string; season?: string; start?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  
  const media = await prisma.media.findUnique({
    where: { id },
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

  if (!media) {
    return notFound();
  }

  const directTorrents = media.torrents || [];
  const firstEpTorrents = media.seasons?.[0]?.episodes?.[0]?.torrents || [];
  const allTorrents = directTorrents.length > 0 ? directTorrents : firstEpTorrents;

  if (allTorrents.length === 0) {
    return notFound();
  }

  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  // In media with multiple torrents, rank by seeder health, streaming reliability, and reasonable file sizes (<5GB)
  // to avoid starting on dead or stalled torrents.
  const rankedTorrents = [...allTorrents].sort((a, b) => {
    // [RECTIFICATION:TORRENT_AVAILABILITY_AND_LOCAL_CACHE]
    // Prioritize torrents with verified local .torrent files on disk to prevent cold DHT stalls
    const fileA = fs.existsSync(path.join(process.cwd(), 'data/torrents', `${a.infoHash}.torrent`)) ? 1 : 0;
    const fileB = fs.existsSync(path.join(process.cwd(), 'data/torrents', `${b.infoHash}.torrent`)) ? 1 : 0;
    if (fileA !== fileB) return fileB - fileA;

    const seedersA = a.seeders || 0;
    const seedersB = b.seeders || 0;
    if (seedersA > 0 && seedersB === 0) return -1;
    if (seedersB > 0 && seedersA === 0) return 1;

    const sizeGbA = a.sizeInBytes ? Number(a.sizeInBytes) / 1e9 : 3;
    const sizeGbB = b.sizeInBytes ? Number(b.sizeInBytes) / 1e9 : 3;

    // Prefer moderate size releases that stream fast and buffer less (<= 4.5 GB)
    const smoothA = sizeGbA <= 4.5 ? 1 : 0;
    const smoothB = sizeGbB <= 4.5 ? 1 : 0;
    if (smoothA !== smoothB) return smoothB - smoothA;

    return seedersB - seedersA;
  });

  const torrent = rankedTorrents[0] || allTorrents[0];

  // Serialize BigInt values so Next.js doesn't throw serialization errors
  const serializedTorrents = rankedTorrents.map(t => ({
    ...t,
    sizeInBytes: t.sizeInBytes ? Number(t.sizeInBytes) : null
  }));

  const serializedMedia = {
    ...media,
    torrents: serializedTorrents,
    seasons: media.seasons?.map(s => ({
      ...s,
      episodes: s.episodes?.map(e => ({
        ...e,
        torrents: e.torrents?.map(t => ({
          ...t,
          sizeInBytes: t.sizeInBytes ? Number(t.sizeInBytes) : null
        }))
      }))
    }))
  };

  const title = (torrent.title || '').toLowerCase();
  const codec = (torrent.codec || '').toLowerCase();
  const container = (torrent.container || '').toLowerCase();
  const isHevc = title.includes('hevc') || title.includes('x265') || title.includes('h.265') || title.includes('h265') || codec.includes('hevc');
  const isMp4 = (container === 'mp4' || title.endsWith('.mp4')) && !isHevc;
  // [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES]
  // Calculate start offset if an episode or timestamp was requested in single-file series
  let initialStartSec = query?.start ? Math.max(0, parseInt(query.start, 10)) : 0;
  if (query?.episode && (media.type === 'SERIES' || media.category === 'TV_SERIES')) {
    const epNum = parseInt(query.episode, 10);
    const seasonNum = query?.season ? parseInt(query.season, 10) : 1;
    const season = media.seasons?.find(s => s.seasonNumber === seasonNum) || media.seasons?.[0];
    const eps = season?.episodes || [];
    if (eps.length > 0 && epNum > 1) {
      // Proportional offset calculation for single-file series URL entry
      const totalSec = (media.runtime || eps.length * 45) * 60;
      initialStartSec = Math.floor(((epNum - 1) / eps.length) * totalSec);
    }
  }

  const streamUrl = isMp4
    ? `/api/v1/stream/${torrent.infoHash}?fileIndex=${torrent.fileIndex || 0}`
    : `/api/v1/stream/${torrent.infoHash}/play?fileIndex=${torrent.fileIndex || 0}&start=${initialStartSec}`;

  // Helper to filter out non-movie categories/genres such as music
  const filterMovieGenres = (genresList: string[]) => 
    genresList.filter(g => {
      const lower = g.trim().toLowerCase();
      return lower !== 'music' && lower !== 'musical';
    });

  // Parse genres for similarity matching
  let mediaGenres: string[] = [];
  try {
    if (typeof media.genres === 'string') {
      const parsed = JSON.parse(media.genres);
      if (Array.isArray(parsed)) mediaGenres = filterMovieGenres(parsed.map((g: any) => String(g).toLowerCase()));
    } else if (Array.isArray(media.genres)) {
      mediaGenres = filterMovieGenres((media.genres as any[]).map((g: any) => String(g).toLowerCase()));
    }
  } catch {}

  // Fetch similar candidates
  const candidates = await prisma.media.findMany({
    where: {
      isPublished: true,
      id: { not: media.id }
    },
    include: {
      torrents: {
        select: {
          resolution: true,
          seeders: true
        }
      }
    },
    take: 60
  });

  // Score candidate movies for accurate recommendations
  const scored = candidates.map(c => {
    let score = 0;
    // Category match
    if (c.category && media.category && c.category === media.category) {
      score += 15;
    }

    // Genre overlap
    let cGenres: string[] = [];
    try {
      if (typeof c.genres === 'string') {
        const parsed = JSON.parse(c.genres);
        if (Array.isArray(parsed)) cGenres = filterMovieGenres(parsed.map((g: any) => String(g)));
      } else if (Array.isArray(c.genres)) {
        cGenres = filterMovieGenres((c.genres as any[]).map((g: any) => String(g)));
      }
    } catch {}

    const overlap = cGenres.filter(g => mediaGenres.includes(g.toLowerCase())).length;
    score += overlap * 10;

    // Rating contribution
    if (c.rating) {
      score += Math.min(10, c.rating);
    }

    const bestTorrent = c.torrents?.[0];
    const resolution = bestTorrent?.resolution || 'HD';

    return {
      id: c.id,
      title: c.title,
      category: c.category || 'MOVIE',
      genres: cGenres,
      releaseYear: c.releaseYear,
      rating: c.rating,
      runtime: c.runtime,
      overview: c.overview,
      posterPath: c.posterPath,
      backdropPath: c.backdropPath,
      resolution,
      score
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const similarMovies = scored.slice(0, 24);

  return (
    <WatchView 
      media={serializedMedia}
      torrents={serializedTorrents}
      streamUrl={streamUrl}
      initialInfoHash={torrent.infoHash}
      similarMovies={similarMovies}
    />
  );
}
