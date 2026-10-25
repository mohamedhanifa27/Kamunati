// [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES]
/**
 * Series Episode Resolver for Single-File Series Streams.
 * Automatically analyzes TV series metadata, embedded chapters, and video duration
 * to map and stream individual episodes contained within a single file.
 */

export interface EpisodeMetadata {
  id: string;
  episodeNumber: number;
  seasonNumber?: number;
  title?: string | null;
  overview?: string | null;
  stillPath?: string | null;
  duration?: number | null; // in minutes
  torrents?: any[];
}

export interface ChapterMetadata {
  id: number | string;
  title: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface ResolvedEpisode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview: string | null;
  stillPath: string | null;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  formattedStart: string;
  formattedEnd: string;
  formattedDuration: string;
  hasDistinctTorrent: boolean;
}

export function formatTimeSec(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatDurationMinutes(sec: number): string {
  const mins = Math.max(1, Math.round(sec / 60));
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  return `${mins}m`;
}

/**
 * Determines whether a media item is a series with multiple episodes contained in a single video file.
 */
export function isSingleFileSeries(media: any, torrentFiles?: any[]): boolean {
  if (!media) return false;
  const isSeriesType = media.type === 'SERIES' || media.category === 'TV_SERIES';
  if (!isSeriesType) return false;

  const seasons = media.seasons || [];
  const allEpisodes: any[] = [];
  seasons.forEach((s: any) => {
    if (Array.isArray(s.episodes)) allEpisodes.push(...s.episodes);
  });

  if (allEpisodes.length <= 1) return false;

  // Check if episodes have their own distinct torrent files
  const distinctTorrents = allEpisodes.filter(e => Array.isArray(e.torrents) && e.torrents.length > 0);
  if (distinctTorrents.length >= allEpisodes.length && allEpisodes.length > 1) {
    // Check if the distinct torrents have different file indexes or hashes
    const firstHash = distinctTorrents[0]?.torrents?.[0]?.infoHash;
    const firstIdx = distinctTorrents[0]?.torrents?.[0]?.fileIndex;
    const allSame = distinctTorrents.every(e => 
      e.torrents[0]?.infoHash === firstHash && (e.torrents[0]?.fileIndex || 0) === (firstIdx || 0)
    );
    if (!allSame) {
      return false; // Real multi-file or multi-torrent separate episodes
    }
  }

  // If torrent files listing is available and has only 1 primary video file, it's definitely a single-file series
  if (Array.isArray(torrentFiles) && torrentFiles.length > 0) {
    const videoFiles = torrentFiles.filter((f: any) => {
      const name = (f.name || f.path || '').toLowerCase();
      return name.endsWith('.mkv') || name.endsWith('.mp4') || name.endsWith('.avi') || name.endsWith('.ts');
    });
    if (videoFiles.length === 1) return true;
  }

  return true;
}

/**
 * Automatically maps all episodes of a TV series within a single video file.
 */
export function resolveSeriesEpisodesInSingleFile(
  episodes: EpisodeMetadata[],
  chapters?: ChapterMetadata[],
  totalDurationSec?: number,
  defaultSeasonNumber: number = 1
): ResolvedEpisode[] {
  if (!episodes || episodes.length === 0) return [];

  const sortedEpisodes = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
  const numEpisodes = sortedEpisodes.length;
  const duration = (totalDurationSec && totalDurationSec > 0) ? totalDurationSec : (numEpisodes * 45 * 60);

  // Strategy 1: Check if chapters match episodes
  const validChapters = (chapters || []).filter(c => c.end > c.start);
  let matchedByChapters = false;
  const chapterBounds: { start: number; end: number }[] = [];

  if (validChapters.length >= numEpisodes) {
    // Attempt pattern match: e.g. "Episode 1", "Ep. 01", "Chapter 1", etc.
    const epRegex = /(?:episode|ep|part|ch|chapter)\s*0?(\d+)/i;
    let matchCount = 0;

    const indexedChapters = new Map<number, ChapterMetadata>();
    validChapters.forEach((ch, idx) => {
      const m = ch.title.match(epRegex);
      if (m && m[1]) {
        const epNum = parseInt(m[1], 10);
        if (epNum > 0 && epNum <= numEpisodes && !indexedChapters.has(epNum)) {
          indexedChapters.set(epNum, ch);
          matchCount++;
        }
      }
    });

    if (matchCount >= Math.min(2, numEpisodes)) {
      // Use named chapter matches
      matchedByChapters = true;
      sortedEpisodes.forEach(ep => {
        const ch = indexedChapters.get(ep.episodeNumber);
        if (ch) {
          chapterBounds.push({ start: ch.start, end: ch.end });
        } else {
          // Interpolate
          const idx = ep.episodeNumber - 1;
          const start = (idx / numEpisodes) * duration;
          const end = ((idx + 1) / numEpisodes) * duration;
          chapterBounds.push({ start, end });
        }
      });
    } else if (validChapters.length === numEpisodes) {
      // Direct 1-to-1 chapter mapping
      matchedByChapters = true;
      validChapters.forEach(ch => {
        chapterBounds.push({ start: ch.start, end: ch.end });
      });
    }
  }

  // Strategy 2: Use episode.duration if provided (convert minutes to seconds)
  const hasMetadataDurations = !matchedByChapters && sortedEpisodes.every(e => typeof e.duration === 'number' && e.duration > 0);
  let totalMetadataSec = 0;
  if (hasMetadataDurations) {
    totalMetadataSec = sortedEpisodes.reduce((acc, e) => acc + (e.duration || 0) * 60, 0);
  }

  let accumulatedSec = 0;

  return sortedEpisodes.map((ep, idx) => {
    let startSec = 0;
    let endSec = 0;

    if (matchedByChapters && chapterBounds[idx]) {
      startSec = chapterBounds[idx].start;
      endSec = chapterBounds[idx].end;
    } else if (hasMetadataDurations && totalMetadataSec > 0) {
      // Scale metadata durations to actual probed video duration
      const scale = duration / totalMetadataSec;
      const epSec = (ep.duration || 45) * 60 * scale;
      startSec = accumulatedSec;
      endSec = Math.min(duration, accumulatedSec + epSec);
      accumulatedSec = endSec;
    } else {
      // Proportional equal division across episodes
      const segmentSec = duration / numEpisodes;
      startSec = idx * segmentSec;
      endSec = Math.min(duration, (idx + 1) * segmentSec);
    }

    const durationSec = Math.max(1, endSec - startSec);
    const seasonNumber = ep.seasonNumber || defaultSeasonNumber;
    const title = ep.title || `Episode ${ep.episodeNumber}`;

    return {
      id: ep.id,
      seasonNumber,
      episodeNumber: ep.episodeNumber,
      title,
      overview: ep.overview || null,
      stillPath: ep.stillPath || null,
      startTimeSec: Math.round(startSec * 10) / 10,
      endTimeSec: Math.round(endSec * 10) / 10,
      durationSec: Math.round(durationSec),
      formattedStart: formatTimeSec(startSec),
      formattedEnd: formatTimeSec(endSec),
      formattedDuration: formatDurationMinutes(durationSec),
      hasDistinctTorrent: Array.isArray(ep.torrents) && ep.torrents.length > 0
    };
  });
}

/**
 * Finds the active episode matching the given timestamp in the single video stream.
 */
export function getCurrentEpisodeAtTime(
  resolvedEpisodes: ResolvedEpisode[],
  currentTimeSec: number
): ResolvedEpisode | null {
  if (!resolvedEpisodes || resolvedEpisodes.length === 0) return null;

  const found = resolvedEpisodes.find(
    ep => currentTimeSec >= ep.startTimeSec && currentTimeSec < ep.endTimeSec
  );

  if (found) return found;

  // Edge cases: before start or past end
  if (currentTimeSec < resolvedEpisodes[0].startTimeSec) {
    return resolvedEpisodes[0];
  }
  return resolvedEpisodes[resolvedEpisodes.length - 1];
}

/**
 * Calculates current playback metrics relative to the current episode within the single file.
 */
export function getEpisodePlaybackMetrics(
  episode: ResolvedEpisode,
  totalCurrentTimeSec: number
) {
  const relativeSec = Math.max(0, Math.min(episode.durationSec, totalCurrentTimeSec - episode.startTimeSec));
  const percent = episode.durationSec > 0 ? (relativeSec / episode.durationSec) * 100 : 0;
  const isNearEnd = (episode.durationSec - relativeSec) <= 15; // 15 seconds before episode finish

  return {
    relativeCurrentTimeSec: relativeSec,
    relativeDurationSec: episode.durationSec,
    formattedRelativeCurrentTime: formatTimeSec(relativeSec),
    formattedRelativeDuration: formatTimeSec(episode.durationSec),
    progressPercent: Math.min(100, Math.max(0, percent)),
    isNearEnd
  };
}
