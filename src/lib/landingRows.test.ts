import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  DEFAULT_LANDING_ROWS, 
  ensureDefaultLandingRows, 
  fetchMediaForLandingRow, 
  mapMediaItem 
} from './landingRows';

describe('Landing Rows Service', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      landingRow: {
        count: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn()
      },
      media: {
        findMany: vi.fn()
      }
    };
  });

  it('should have standard default rows defined', () => {
    expect(DEFAULT_LANDING_ROWS.length).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_LANDING_ROWS[0].title).toBe('Trending Now');
    expect(DEFAULT_LANDING_ROWS[0].type).toBe('TRENDING');
  });

  it('should seed default rows when database table is empty', async () => {
    mockPrisma.landingRow.count.mockResolvedValue(0);
    mockPrisma.landingRow.create.mockResolvedValue({});

    await ensureDefaultLandingRows(mockPrisma);

    expect(mockPrisma.landingRow.create).toHaveBeenCalledTimes(DEFAULT_LANDING_ROWS.length);
  });

  it('should not seed rows if rows already exist', async () => {
    mockPrisma.landingRow.count.mockResolvedValue(5);

    await ensureDefaultLandingRows(mockPrisma);

    expect(mockPrisma.landingRow.create).not.toHaveBeenCalled();
  });

  it('should fetch genre-filtered media when row type is GENRE', async () => {
    mockPrisma.media.findMany.mockResolvedValue([
      { id: '1', title: 'SciFi Movie', genres: '["Science Fiction"]', isPublished: true }
    ]);

    const items = await fetchMediaForLandingRow(mockPrisma, {
      id: 'row-1',
      title: 'Sci-Fi Masterpieces',
      type: 'GENRE',
      genre: 'Science Fiction',
      limit: 10
    });

    expect(mockPrisma.media.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        isPublished: true,
        genres: { contains: 'Science Fiction' }
      }),
      take: 10
    }));
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('SciFi Movie');
  });

  it('should fetch custom curated media in the exact requested order', async () => {
    mockPrisma.media.findMany.mockResolvedValue([
      { id: 'b', title: 'Second Film', isPublished: true },
      { id: 'a', title: 'First Film', isPublished: true }
    ]);

    const items = await fetchMediaForLandingRow(mockPrisma, {
      id: 'row-2',
      title: 'Hand Picked',
      type: 'CUSTOM',
      customMediaIds: JSON.stringify(['a', 'b']),
      limit: 10
    });

    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('a');
    expect(items[1].id).toBe('b');
  });

  it('should map media item with fallback poster and parsed ambient palette', () => {
    const raw = {
      id: 'm1',
      title: 'Movie One',
      posterPath: null,
      backdropPath: null,
      ambientPalette: JSON.stringify([{ hex: '#ff0000', weight: 1 }])
    };

    const mapped = mapMediaItem(raw);
    expect(mapped.id).toBe('m1');
    expect(mapped.title).toBe('Movie One');
    expect(mapped.posterUrl).toBe('/logo.svg');
    expect(mapped.ambientPalette).toEqual([{ hex: '#ff0000', weight: 1 }]);
  });
});
