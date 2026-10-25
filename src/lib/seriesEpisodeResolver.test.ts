// [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES]
import { describe, it, expect } from 'vitest';
import {
  isSingleFileSeries,
  resolveSeriesEpisodesInSingleFile,
  getCurrentEpisodeAtTime,
  getEpisodePlaybackMetrics,
  formatTimeSec,
  formatDurationMinutes
} from './seriesEpisodeResolver';

describe('Series Episode Resolver for Single File TV Series', () => {
  it('correctly detects single file TV series when episodes do not have separate files', () => {
    const singleFileMedia = {
      type: 'SERIES',
      category: 'TV_SERIES',
      torrents: [{ infoHash: 'hash123', fileIndex: 0 }],
      seasons: [
        {
          seasonNumber: 1,
          episodes: [
            { id: 'ep-1', episodeNumber: 1, torrents: [] },
            { id: 'ep-2', episodeNumber: 2, torrents: [] },
            { id: 'ep-3', episodeNumber: 3, torrents: [] }
          ]
        }
      ]
    };

    expect(isSingleFileSeries(singleFileMedia, [{ name: 'series_complete.mkv', length: 3000000000 }])).toBe(true);

    const movieMedia = {
      type: 'MOVIE',
      category: 'MOVIE',
      torrents: [{ infoHash: 'moviehash', fileIndex: 0 }]
    };
    expect(isSingleFileSeries(movieMedia)).toBe(false);
  });

  it('maps episodes automatically from embedded chapters when present', () => {
    const episodes = [
      { id: 'ep-1', episodeNumber: 1, title: 'Pilot' },
      { id: 'ep-2', episodeNumber: 2, title: 'The Next Step' },
      { id: 'ep-3', episodeNumber: 3, title: 'The Finale' }
    ];

    const chapters = [
      { id: 0, title: 'Episode 1: Pilot', start: 0, end: 1500 },
      { id: 1, title: 'Episode 2: The Next Step', start: 1500, end: 3200 },
      { id: 2, title: 'Episode 3: The Finale', start: 3200, end: 4800 }
    ];

    const resolved = resolveSeriesEpisodesInSingleFile(episodes, chapters, 4800, 1);
    expect(resolved).toHaveLength(3);

    expect(resolved[0].startTimeSec).toBe(0);
    expect(resolved[0].endTimeSec).toBe(1500);
    expect(resolved[0].formattedStart).toBe('00:00');

    expect(resolved[1].startTimeSec).toBe(1500);
    expect(resolved[1].endTimeSec).toBe(3200);
    expect(resolved[1].formattedStart).toBe('25:00');

    expect(resolved[2].startTimeSec).toBe(3200);
    expect(resolved[2].endTimeSec).toBe(4800);
  });

  it('maps episodes proportionally when only total duration is known', () => {
    const episodes = [
      { id: 'ep-1', episodeNumber: 1, title: 'Part 1' },
      { id: 'ep-2', episodeNumber: 2, title: 'Part 2' },
      { id: 'ep-3', episodeNumber: 3, title: 'Part 3' },
      { id: 'ep-4', episodeNumber: 4, title: 'Part 4' }
    ];

    const totalDurationSec = 7200; // 2 hours
    const resolved = resolveSeriesEpisodesInSingleFile(episodes, undefined, totalDurationSec, 1);

    expect(resolved).toHaveLength(4);
    expect(resolved[0].startTimeSec).toBe(0);
    expect(resolved[0].endTimeSec).toBe(1800);
    expect(resolved[1].startTimeSec).toBe(1800);
    expect(resolved[1].endTimeSec).toBe(3600);
    expect(resolved[2].startTimeSec).toBe(3600);
    expect(resolved[2].endTimeSec).toBe(5400);
    expect(resolved[3].startTimeSec).toBe(5400);
    expect(resolved[3].endTimeSec).toBe(7200);
  });

  it('correctly detects active episode and computes relative playback metrics', () => {
    const episodes = [
      { id: 'ep-1', episodeNumber: 1, title: 'Part 1' },
      { id: 'ep-2', episodeNumber: 2, title: 'Part 2' }
    ];
    const resolved = resolveSeriesEpisodesInSingleFile(episodes, undefined, 3600, 1);

    // Current time at 2400 seconds (40 mins) -> should be Episode 2 (which spans 1800 to 3600)
    const activeEp = getCurrentEpisodeAtTime(resolved, 2400);
    expect(activeEp).not.toBeNull();
    expect(activeEp?.episodeNumber).toBe(2);

    // In Episode 2, 2400s is 600s (10m) into the episode
    const metrics = getEpisodePlaybackMetrics(activeEp!, 2400);
    expect(metrics.relativeCurrentTimeSec).toBe(600);
    expect(metrics.formattedRelativeCurrentTime).toBe('10:00');
    expect(metrics.formattedRelativeDuration).toBe('30:00');
    expect(metrics.progressPercent).toBeCloseTo((600 / 1800) * 100);
    expect(metrics.isNearEnd).toBe(false);

    // At 3590 seconds (10s before ep ends), isNearEnd should be true
    const nearEndMetrics = getEpisodePlaybackMetrics(activeEp!, 3590);
    expect(nearEndMetrics.isNearEnd).toBe(true);
  });

  it('formats time and durations accurately', () => {
    expect(formatTimeSec(65)).toBe('01:05');
    expect(formatTimeSec(3665)).toBe('01:01:05');
    expect(formatDurationMinutes(1800)).toBe('30m');
    expect(formatDurationMinutes(5400)).toBe('1h 30m');
  });
});
