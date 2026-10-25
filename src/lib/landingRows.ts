import { PrismaClient } from '@prisma/client';

export type LandingRowType = 'RECENT' | 'TRENDING' | 'TOP_RATED' | 'GENRE' | 'CATEGORY' | 'CUSTOM';

export interface DefaultRowConfig {
  title: string;
  type: LandingRowType;
  genre?: string | null;
  category?: string | null;
  customMediaIds?: string | null;
  limit: number;
  sortOrder: number;
  isEnabled: boolean;
}

export const DEFAULT_LANDING_ROWS: DefaultRowConfig[] = [
  {
    title: 'Trending Now',
    type: 'TRENDING',
    genre: null,
    category: null,
    customMediaIds: null,
    limit: 20,
    sortOrder: 0,
    isEnabled: true
  },
  {
    title: 'Action & Adventure',
    type: 'GENRE',
    genre: 'Action',
    category: null,
    customMediaIds: null,
    limit: 20,
    sortOrder: 1,
    isEnabled: true
  },
  {
    title: 'Sci-Fi Masterpieces',
    type: 'GENRE',
    genre: 'Science Fiction',
    category: null,
    customMediaIds: null,
    limit: 20,
    sortOrder: 2,
    isEnabled: true
  },
  {
    title: 'Top Rated',
    type: 'TOP_RATED',
    genre: null,
    category: null,
    customMediaIds: null,
    limit: 20,
    sortOrder: 3,
    isEnabled: true
  },
  {
    title: 'Crime & Mystery',
    type: 'GENRE',
    genre: 'Crime',
    category: null,
    customMediaIds: null,
    limit: 20,
    sortOrder: 4,
    isEnabled: true
  }
];

export function mapMediaItem(m: any) {
  let ambientPalette;
  try {
    if (typeof m.ambientPalette === 'string') ambientPalette = JSON.parse(m.ambientPalette);
    else ambientPalette = m.ambientPalette;
  } catch (e) {}

  return {
    id: m.id || m.media?.id,
    title: m.title || m.media?.title,
    posterUrl: m.posterPath || m.backdropPath || m.media?.posterPath || m.media?.backdropPath || '/logo.svg',
    backdropUrl: m.backdropPath || m.posterPath || m.media?.backdropPath || m.media?.posterPath,
    qualityBadge: m.infoHash || m.media?.infoHash ? 'HD' : undefined,
    overview: m.overview || m.media?.overview,
    // [RECTIFICATION:PIXEL_FONT_DESCRIPTION_AND_TITLE_LOGO]
    logoUrl: m.logoPath || m.media?.logoPath || m.logoUrl || null,
    hoverBannerUrl: m.hoverBannerKey || m.media?.hoverBannerKey,
    hoverClipUrl: m.hoverClipKey || m.media?.hoverClipKey,
    hoverTagline: m.hoverTagline || m.media?.hoverTagline,
    ambientPalette: ambientPalette || (m.media?.ambientPalette ? JSON.parse(m.media.ambientPalette) : undefined),
    category: m.category || m.media?.category,
    releaseYear: m.releaseYear || m.media?.releaseYear,
    rating: m.rating || m.media?.rating,
    runtime: m.runtime || m.media?.runtime,
  };
}

/**
 * Ensures default landing rows exist in the database.
 */
export async function ensureDefaultLandingRows(prisma: PrismaClient) {
  const count = await prisma.landingRow.count();
  if (count === 0) {
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
  }
}

/**
 * Evaluates and fetches media items for a specific landing row.
 */
export async function fetchMediaForLandingRow(
  prisma: PrismaClient,
  row: {
    id: string;
    title: string;
    type: string;
    genre?: string | null;
    category?: string | null;
    customMediaIds?: string | null;
    limit: number;
  },
  pageCategory?: string
) {
  const take = Math.min(Math.max(row.limit || 20, 1), 50);

  // If a row specifies a category, prioritize that; otherwise use page category filter
  const targetCategory = row.category && row.category !== 'ALL' ? row.category : pageCategory;
  const categoryClause = targetCategory ? { category: targetCategory } : {};

  let rawItems: any[] = [];

  switch (row.type) {
    case 'CUSTOM': {
      let ids: string[] = [];
      try {
        if (row.customMediaIds) {
          ids = JSON.parse(row.customMediaIds);
        }
      } catch {}

      if (ids.length > 0) {
        const found = await prisma.media.findMany({
          where: {
            id: { in: ids },
            isPublished: true,
            ...categoryClause
          }
        });

        // Retain original curated order
        const map = new Map(found.map(item => [item.id, item]));
        rawItems = ids.map(id => map.get(id)).filter(Boolean);
      }
      break;
    }

    case 'TOP_RATED': {
      rawItems = await prisma.media.findMany({
        where: {
          isPublished: true,
          rating: { not: null },
          ...categoryClause
        },
        orderBy: { rating: 'desc' },
        take
      });
      break;
    }

    case 'GENRE': {
      if (row.genre) {
        rawItems = await prisma.media.findMany({
          where: {
            isPublished: true,
            genres: { contains: row.genre },
            ...categoryClause
          },
          orderBy: { createdAt: 'desc' },
          take
        });
      }
      break;
    }

    case 'CATEGORY': {
      const cat = row.category || pageCategory;
      if (cat && cat !== 'ALL') {
        rawItems = await prisma.media.findMany({
          where: {
            isPublished: true,
            category: cat
          },
          orderBy: { createdAt: 'desc' },
          take
        });
      }
      break;
    }

    case 'TRENDING':
    case 'RECENT':
    default: {
      rawItems = await prisma.media.findMany({
        where: {
          isPublished: true,
          ...categoryClause
        },
        orderBy: { createdAt: 'desc' },
        take
      });
      break;
    }
  }

  return rawItems.map(mapMediaItem);
}
