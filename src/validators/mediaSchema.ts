import { z } from 'zod';

export const importTmdbSchema = z.object({
  tmdbId: z.number().int().positive(),
  type: z.enum(['MOVIE', 'SERIES']),
  isPublished: z.boolean().optional().default(false),
});

export const manualMediaSchema = z.object({
  title: z.string().min(1),
  originalTitle: z.string().optional(),
  type: z.enum(['MOVIE', 'SERIES']),
  slug: z.string().min(1),
  overview: z.string().optional(),
  tagline: z.string().optional(),
  posterPath: z.string().optional(),
  backdropPath: z.string().optional(),
  releaseYear: z.number().int().optional(),
  runtime: z.number().int().optional(),
  rating: z.number().optional(),
  voteCount: z.number().int().optional(),
  genres: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const updateMediaSchema = manualMediaSchema.partial();

export const torrentAttachSchema = z.object({
  mediaId: z.string().uuid().optional(),
  episodeId: z.string().uuid().optional(),
  title: z.string().min(1),
  magnetUri: z.string().min(1),
  fileIndex: z.number().int().min(0),
  resolution: z.enum(['RES_4K', 'RES_1080P', 'RES_720P', 'RES_480P']),
  codec: z.string().optional(),
  container: z.string().optional(),
  sizeInBytes: z.number().int().positive().optional(),
}).refine(data => data.mediaId || data.episodeId, {
  message: "Must provide either mediaId or episodeId",
  path: ["mediaId", "episodeId"],
});
