/**
 * U2.9 Shared Zod Schemas
 * All new schemas for the Space Gradients Edition update pack.
 * These are the source-of-truth contracts used by both frontend and backend.
 */
import { z } from 'zod';

// ─── AMBIENT PALETTE ──────────────────────────────────────────────────────────

export const AmbientColourSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid #RRGGBB hex colour'),
  weight: z.number().min(0).max(1),
});

export const AmbientPaletteSchema = z
  .array(AmbientColourSchema)
  .min(1)
  .max(3);

export type AmbientColour = z.infer<typeof AmbientColourSchema>;
export type AmbientPalette = z.infer<typeof AmbientPaletteSchema>;

// ─── TITLE / MEDIA ────────────────────────────────────────────────────────────

export const TitleCategorySchema = z.enum(['MOVIE', 'TV_SERIES', 'ANIME']);
export type TitleCategory = z.infer<typeof TitleCategorySchema>;

export const TitleSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  type: z.string(),
  category: TitleCategorySchema.nullable().optional(),
  posterPath: z.string().nullable().optional(),
  backdropPath: z.string().nullable().optional(),
  releaseYear: z.number().nullable().optional(),
  rating: z.number().nullable().optional(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  hoverTagline: z.string().max(120).nullable().optional(),
  ambientPalette: AmbientPaletteSchema.nullable().optional(),
  reviewCount: z.number().default(0),
  reviewAvgRating: z.number().nullable().optional(),
});

export const TitleDetailSchema = TitleSummarySchema.extend({
  overview: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  originalTitle: z.string().nullable().optional(),
  runtime: z.number().nullable().optional(),
  genres: z.string(), // JSON array string
  voteCount: z.number().nullable().optional(),
  hoverBannerKey: z.string().nullable().optional(),
  hoverBannerFocal: z.string().nullable().optional(),
  hoverClipKey: z.string().nullable().optional(),
  hoverClipDurationSec: z.number().nullable().optional(),
  ambientPaletteSource: z.enum(['AUTO', 'MANUAL']).default('AUTO'),
});

export type TitleSummary = z.infer<typeof TitleSummarySchema>;
export type TitleDetail = z.infer<typeof TitleDetailSchema>;

// ─── OTP / PASSWORD CHANGE ────────────────────────────────────────────────────

export const PasswordOtpRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
});

export const PasswordOtpVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
});

export const PasswordChangeSchema = z.object({
  changeToken: z.string().min(1),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password is too long'),
});

export type PasswordOtpRequest = z.infer<typeof PasswordOtpRequestSchema>;
export type PasswordOtpVerify = z.infer<typeof PasswordOtpVerifySchema>;
export type PasswordChange = z.infer<typeof PasswordChangeSchema>;

// ─── SEARCH HISTORY ───────────────────────────────────────────────────────────

export const SearchHistoryItemSchema = z.object({
  id: z.string(),
  queryDisplay: z.string().max(80),
  count: z.number(),
  lastSearchedAt: z.string().datetime(),
});

export const SearchSuggestionTypeSchema = z.enum([
  'HISTORY',
  'TITLE',
  'GENRE',
  'PERSON',
  'SIMILAR',
]);

export const SearchSuggestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: SearchSuggestionTypeSchema,
  titleId: z.string().nullable().optional(),
  posterPath: z.string().nullable().optional(),
});

export type SearchHistoryItem = z.infer<typeof SearchHistoryItemSchema>;
export type SearchSuggestion = z.infer<typeof SearchSuggestionSchema>;

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export const ReviewStatusSchema = z.enum(['VISIBLE', 'HIDDEN', 'REMOVED']);

export const ReviewSchema = z.object({
  id: z.string(),
  mediaId: z.string(),
  userId: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(1500),
  containsSpoilers: z.boolean().default(false),
  status: ReviewStatusSchema.default('VISIBLE'),
  isEditorial: z.boolean().default(false),
  authorLabel: z.string().nullable().optional(),
  isPinned: z.boolean().default(false),
  editedAt: z.string().datetime().nullable().optional(),
  moderationNote: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ReviewCreateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10, 'Review must be at least 10 characters').max(1500, 'Review is too long'),
  containsSpoilers: z.boolean().default(false),
});

export const ReviewUpdateSchema = ReviewCreateSchema.partial();

export const ReviewReportReasonSchema = z.enum([
  'SPAM',
  'ABUSE',
  'SPOILER',
  'OFF_TOPIC',
  'OTHER',
]);

export const ReviewReportSchema = z.object({
  reason: ReviewReportReasonSchema,
  details: z.string().max(500).optional(),
});

export type Review = z.infer<typeof ReviewSchema>;
export type ReviewCreate = z.infer<typeof ReviewCreateSchema>;
export type ReviewUpdate = z.infer<typeof ReviewUpdateSchema>;
export type ReviewReport = z.infer<typeof ReviewReportSchema>;

// ─── USER RESTRICTIONS ────────────────────────────────────────────────────────

export const RestrictionTypeSchema = z.enum(['WATCH_BLOCK', 'REVIEW_BLOCK']);

export const UserRestrictionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: RestrictionTypeSchema,
  reason: z.string().min(5).max(500),
  expiresAt: z.string().datetime().nullable().optional(),
  createdById: z.string(),
  createdAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable().optional(),
  revokeNote: z.string().nullable().optional(),
});

export const RestrictionCreateSchema = z.object({
  type: RestrictionTypeSchema,
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
  expiresAt: z.string().datetime().nullable().optional(),
  internalNote: z.string().max(1000).optional(),
});

export type UserRestriction = z.infer<typeof UserRestrictionSchema>;
export type RestrictionCreate = z.infer<typeof RestrictionCreateSchema>;

// ─── ADMIN USER MANAGEMENT ────────────────────────────────────────────────────

export const AdminCreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  sendInvite: z.boolean().default(true),
  requirePasswordChange: z.boolean().default(true),
});

export const AdminDeleteUserSchema = z.object({
  userId: z.string(),
  confirmEmail: z.string().email(), // must match the user's email
  reason: z.string().min(10, 'Please provide a reason for deletion'),
});

export type AdminCreateUser = z.infer<typeof AdminCreateUserSchema>;
export type AdminDeleteUser = z.infer<typeof AdminDeleteUserSchema>;

// ─── MY LIST / CONTINUE WATCHING ─────────────────────────────────────────────

export const MyListOrderSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

export const ContinueWatchingActionSchema = z.object({
  action: z.enum(['hide', 'mark-watched', 'reset']),
  mediaId: z.string(),
  episodeId: z.string().nullable().optional(),
});

export type MyListOrder = z.infer<typeof MyListOrderSchema>;
export type ContinueWatchingAction = z.infer<typeof ContinueWatchingActionSchema>;

// ─── APPEARANCE PREFERENCES (extended) ───────────────────────────────────────

export const AmbientModeSchema = z.enum(['live', 'calm', 'static', 'off']);
export const SoundsPrefsSchema = z.object({
  enabled: z.boolean().default(true),
  volume: z.number().min(0).max(1).default(0.35),
  onHover: z.boolean().default(true),
  onScroll: z.boolean().default(true),
  haptics: z.boolean().default(false),
});
export const MyListPrefsSchema = z.object({
  view: z.enum(['grid', 'list']).default('grid'),
  sort: z.enum(['manual', 'recent', 'az', 'year']).default('recent'),
});

export const AppearancePrefsV2Schema = z.object({
  version: z.literal(2).default(2),
  ambient: z.object({ mode: AmbientModeSchema.default('live') }).default(() => ({ mode: 'live' as const })),
  sounds: SoundsPrefsSchema.default(() => ({
    enabled: true, volume: 0.35, onHover: true, onScroll: true, haptics: false,
  })),
  myList: MyListPrefsSchema.default(() => ({ view: 'grid' as const, sort: 'recent' as const })),
});

export type AmbientMode = z.infer<typeof AmbientModeSchema>;
export type SoundsPrefs = z.infer<typeof SoundsPrefsSchema>;
export type MyListPrefs = z.infer<typeof MyListPrefsSchema>;
export type AppearancePrefsV2 = z.infer<typeof AppearancePrefsV2Schema>;
