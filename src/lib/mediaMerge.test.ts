import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  mergeMedia, 
  normalizeTitle, 
  findDuplicateGroups, 
  mergeAllDuplicates 
} from './mediaMerge';

describe('Media Merge Utility', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      media: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      torrentSource: {
        update: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(),
      },
      season: {
        create: vi.fn(),
      },
      episode: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
      },
      watchProgress: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        delete: vi.fn(),
      },
      watchlist: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        delete: vi.fn(),
      },
      rating: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        delete: vi.fn(),
      },
      review: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        delete: vi.fn(),
      }
    };
  });

  describe('normalizeTitle', () => {
    it('cleans brackets, years, and special characters', () => {
      expect(normalizeTitle('Hotel Transylvania 3 Summer Vacation  [')).toBe('hotel transylvania 3 summer vacation');
      expect(normalizeTitle('Superbad (2007) [UNRATED] [1080p]')).toBe('superbad');
      expect(normalizeTitle('Iron Man 2 (2010) [1080p]')).toBe('iron man 2');
    });
  });

  describe('mergeMedia', () => {
    it('fails when sourceId equals targetId', async () => {
      const res = await mergeMedia('id-1', 'id-1', mockPrisma);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Cannot merge a title into itself');
    });

    it('moves unique torrent sources and drops duplicates', async () => {
      mockPrisma.media.findUnique
        .mockResolvedValueOnce({
          id: 'source-1',
          title: 'Hotel Transylvania 3 (720p)',
          torrents: [
            { id: 't-1', infoHash: 'hash-720', fileIndex: 0 },
            { id: 't-2', infoHash: 'hash-shared', fileIndex: 0 },
          ],
          seasons: []
        })
        .mockResolvedValueOnce({
          id: 'target-1',
          title: 'Hotel Transylvania 3 (1080p)',
          torrents: [
            { id: 't-3', infoHash: 'hash-shared', fileIndex: 0 },
          ],
          seasons: []
        });

      const res = await mergeMedia('source-1', 'target-1', mockPrisma);

      expect(res.success).toBe(true);
      expect(res.movedTorrentsCount).toBe(1);

      // t-1 moved
      expect(mockPrisma.torrentSource.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { mediaId: 'target-1' }
      });

      // t-2 is duplicate of t-3 -> deleted
      expect(mockPrisma.torrentSource.delete).toHaveBeenCalledWith({
        where: { id: 't-2' }
      });

      // source deleted
      expect(mockPrisma.media.delete).toHaveBeenCalledWith({
        where: { id: 'source-1' }
      });
    });

    it('copies missing metadata from source to target', async () => {
      mockPrisma.media.findUnique
        .mockResolvedValueOnce({
          id: 'source-1',
          title: 'Source Title',
          tmdbId: 400155,
          posterPath: 'https://image.tmdb.org/poster.jpg',
          overview: 'A great movie synopsis',
          torrents: [],
          seasons: []
        })
        .mockResolvedValueOnce({
          id: 'target-1',
          title: 'Target Title',
          tmdbId: null,
          posterPath: null,
          overview: null,
          torrents: [],
          seasons: []
        });

      await mergeMedia('source-1', 'target-1', mockPrisma);

      expect(mockPrisma.media.update).toHaveBeenCalledWith({
        where: { id: 'target-1' },
        data: expect.objectContaining({
          tmdbId: 400155,
          posterPath: 'https://image.tmdb.org/poster.jpg',
          overview: 'A great movie synopsis'
        })
      });
    });
  });

  describe('findDuplicateGroups', () => {
    it('detects duplicates by TMDB ID', async () => {
      mockPrisma.media.findMany.mockResolvedValue([
        { id: 'm1', title: 'Hotel Transylvania 3 (A)', tmdbId: 400155, torrents: [{ id: 't1' }] },
        { id: 'm2', title: 'Hotel Transylvania 3 (B)', tmdbId: 400155, torrents: [{ id: 't2' }] },
      ]);

      const groups = await findDuplicateGroups(mockPrisma);
      expect(groups.length).toBe(1);
      expect(groups[0].type).toBe('tmdbId');
      expect(groups[0].primary.id).toBe('m1');
      expect(groups[0].duplicates[0].id).toBe('m2');
    });

    it('detects duplicates by normalized title when tmdbId is null', async () => {
      mockPrisma.media.findMany.mockResolvedValue([
        { id: 'm1', title: 'Hotel Transylvania 3 Summer Vacation  [', tmdbId: null, torrents: [{ id: 't1' }] },
        { id: 'm2', title: 'Hotel Transylvania 3 Summer Vacation (2018)', tmdbId: null, torrents: [{ id: 't2' }] },
      ]);

      const groups = await findDuplicateGroups(mockPrisma);
      expect(groups.length).toBe(1);
      expect(groups[0].type).toBe('title');
      expect(groups[0].key).toContain('hotel transylvania 3 summer vacation');
    });
  });
});
