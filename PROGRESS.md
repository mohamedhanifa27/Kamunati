# PROGRESS.md — Space Gradients Edition

## Status

| Workstream | Branch | Status | Notes |
|---|---|---|---|
| U1 Baseline | `chore/update-baseline` | ✅ Complete | Docs in `docs/update-baseline/` |
| U2 Data Model | `feat/u2-data-model` | ✅ Complete | See below |
| A Ambient | `feat/a-ambient-background` | ✅ Complete | WebGL2 + PI Controller |
| B Card Interactions | `feat/b-card-interactions` | ✅ Complete | Lift, banner and sound engine added |
| C Navigation | `feat/c-navigation` | ✅ Complete | Centered pill, Settings bottom nav |
| E Profile | `feat/e-profile` | ✅ Complete | Single profile dashboard, APIs |
| D Settings | — | ⏳ Pending | |
| F Search Card | — | ⏳ Pending | |
| G Reviews | — | ⏳ Pending | |
| H Admin Upgrades | — | ⏳ Pending | |

---

## U2 — Data Model, Contracts and Migrations

### New DB Tables (all additive)
| Table | Purpose |
|---|---|
| `SearchHistory` | Per-user search history, capped at 50, retained 180 days |
| `OtpChallenge` | OTP for password change — hashed, rate-limited |
| `PasswordChangeGrant` | Single-use grant issued after correct OTP |
| `Review` | User and editorial reviews per title |
| `ReviewReport` | User reports on reviews |
| `UserRestriction` | Admin-applied watch/review blocks with expiry |
| `DeletedUserTombstone` | Audit trail for permanently deleted users (no PII) |

### New Columns on Existing Tables (all nullable/default)
| Table | Column(s) |
|---|---|
| `User` | `mustChangePassword` |
| `Media` | `category`, `hoverBannerKey`, `hoverBannerFocal`, `hoverClipKey`, `hoverClipDurationSec`, `hoverTagline`, `ambientPalette`, `ambientPaletteSource`, `ambientPaletteUpdatedAt`, `reviewCount`, `reviewAvgRating` |
| `Episode` | `ambientPalette` |
| `WatchProgress` | `hiddenFromContinue`, `hiddenAt`, `watchedAt` |
| `Watchlist` | `sortOrder` |

### New Zod Schemas (src/lib/schemas/index.ts)
- `AmbientPaletteSchema`, `TitleCategorySchema`, `TitleSummarySchema`, `TitleDetailSchema`
- `PasswordOtpRequestSchema`, `PasswordOtpVerifySchema`, `PasswordChangeSchema`
- `SearchHistoryItemSchema`, `SearchSuggestionSchema`
- `ReviewSchema`, `ReviewCreateSchema`, `ReviewUpdateSchema`, `ReviewReportSchema`
- `UserRestrictionSchema`, `RestrictionCreateSchema`
- `AdminCreateUserSchema`, `AdminDeleteUserSchema`
- `MyListOrderSchema`, `ContinueWatchingActionSchema`
- `AppearancePrefsV2Schema`

### New API Route Stubs (all return 501 behind feature flags)
- `POST /api/account/password/otp`
- `POST /api/account/password/change`
- `GET/POST/DELETE /api/search/history`
- `GET /api/search/similar`
- `GET /api/search/trending`
- `GET/POST /api/reviews`
- `GET/POST /api/admin/users`

### Feature Flags
All flags now default ON in development, OFF in production.
Override via env: `FLAG_AMBIENT_BACKGROUND=true`, etc.

### Known Issues
- SQLite no native enums — String workaround used throughout.
- Pre-existing test failures from U1 still present (not touched).
