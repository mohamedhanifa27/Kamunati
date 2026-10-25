# Kamunati — Detailed Project Report

**Repo:** `torrent-stream-engine` · **Branch:** `chore/halo-indigo-cleanup`
**Report date:** 10 October 2026
**Method:** static inspection (read-only) + typecheck + test run. No source, config, test or git state was modified to produce this document.

---

## 1. Executive summary

Kamunati is a Netflix-style, torrent-backed streaming platform: a Next.js 16 viewer app, a Fastify engine that seeds/leeches via `torrent-stream` and proxies or transcodes to the browser, a Prisma/SQLite data layer, and an admin console currently being rebuilt to the "Live Admin Console Edition" spec in `AGENTS.md`.

**Headline state:** the *viewer* product and the *data model* are in good shape; the *admin rebuild* is roughly one third delivered; and the working tree currently contains **three corrupted source files, two deleted tests, and an unauthenticated admin API surface**. `next.config.mjs` hides much of this from production builds by setting `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`.

| Area | Verdict |
|---|---|
| Viewer app (browse/watch/search/settings/reviews) | Feature-complete, behind flags |
| Data model & migrations | Additive, healthy — but 1 migration for 27 models and 5 uncommitted columns |
| Admin realtime (W2/W3) | Implemented and honest (server-side only metrics) |
| Admin shell / dock / Add Media V2 / alerts / presence | Not started — flags hard-coded `false` |
| Data integrity rules (AGENTS §6) | **Violated on the dashboard chart; enforcement tests deleted** |
| Security | **15 of 20 admin API routes have no auth check** |
| Typecheck / lint / tests | **335 TS errors; no lint config at all; 4 of 6 test suites fail** |
| Repo hygiene | 199 dirty entries, ~50 root-level `fix*.js` scripts, torrent payloads untracked |

---

## 2. Architecture

**Processes** (from `package.json`):

- `dev:ui` / `build:ui` — Next.js 16.3.8 App Router, port 3000
- `dev:engine` / `start:engine` — Fastify + `torrent-stream`, port 3001 (`src/server.ts`)
- `telegram-bot` — `node-telegram-bot-api` (`telegram/bot.ts`, 278 lines)
- `npm run dev` runs all three via `concurrently`

**Stack:** React 19.3 · Tailwind 3.4 (with `@tailwindcss/postcss` 4.x also pinned — mixed major versions) · Zustand · SWR · Framer Motion / `motion` · Recharts · Zod 4 · NextAuth v5 beta (credentials + JWT) · Prisma 5.22 on **SQLite** (`file:./dev.db`) · `fluent-ffmpeg` + `ffmpeg-static` · Three.js **0.186.1** with a `three128` alias pinned to **0.128.0** for the vendored dock (AGENTS §7.6 satisfied).

**Scale:** 239 `.ts/.tsx` files under `src`, ~39,925 lines. `src/app` 88 files, `src/components` 50, `src/features` 27, `src/vendor/threeui` 74 files (incl. shaders).

**Routing inventory:** 30 viewer/admin pages; 51 API route handlers; 5 Fastify route modules (`stream`, `stats`, `inspect`, `admin/media`, plus `middleware`).

**Notable mismatch:** `docker-compose.yml` builds `apps/backend` + `apps/frontend` against **Postgres 16 and Redis** — a completely different topology from the actual single-repo SQLite + Fastify setup. `README.md` still advertises `docker-compose up --build` as a supported path; it is stale, as is `Kamunati_Project_Report.md` ("PostgreSQL (assumed)", "Next.js 14+").

---

## 3. Data layer

27 Prisma models: `User`, `Media`, `Season`, `Episode`, `TorrentSource`, `WatchProgress`, `Watchlist`, `Rating`, `SearchHistory`, `OtpChallenge`, `PasswordChangeGrant`, `Review`, `ReviewReport`, `UserRestriction`, `DeletedUserTombstone`, `MediaActivity`, `AdminAlert`, `AdminAlertRead`, `AdminAlertPref`, `Notification`, `NotificationRecipient`, `UserPresence`, `TorrentHealthSample`, `TelegramPost`, `UserAuthMethod`, `AdminEventLog`, `DashboardMetricSample`.

- **One migration exists:** `prisma/migrations/20261004_y3_admin_overhaul`. Everything before it was applied with `db push`.
- **Uncommitted schema change:** 5 new `Media` columns (`maturityRating`, `logoPath`, `cast`, `directors`, `tmdbReviews`) with **no accompanying migration** — AGENTS §3 forbids editing migrations but requires adding them.
- SQLite ⇒ no native enums; every enum-like field is a `String`.

---

## 4. Feature flags

`src/lib/featureFlags.ts`: env-driven, ON in development, OFF in production.

| Enabled via env | Hard-coded `false` (feature not built) |
|---|---|
| `adminRealtime`, `adminLiveCards`, `adminTorrentLive`, `cardSounds`, `hoverBanner`, `newBottomNav`, `singleProfile`, `searchCard`, `reviews`, `adminUserTools`, `settingsPage`, `profilePage` | `adminRedesign`, `adminDock`, `adminAlerts`, `adminBroadcast`, `adminTelegram`, `adminAddMediaV2`, `adminActivityBar`, `adminUserAccess`, `adminPresence`, `closedSignup`, `dualLogin`, `ambientBackground`, `categoryNav` |

Note: `adminUserAccess` is hard-off, so `/api/admin/users` returns **501** in every environment — the Users page cannot function until that flag is flipped, and when it is, the route is open to anyone (see §7 finding 1).

---

## 5. Progress against AGENTS.md §2

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | New admin UI (black/violet) | ⚠️ Partial | `src/app/admin/layout.tsx` restyled with Halo tabs; header still renders a hard-coded "System Healthy" chip |
| 2 | Vertical Sable Dock | ❌ Not built | `adminDock: false`; fork scaffolding exists in `FORKS.md` + `src/features/admin/ui/threeui/` (2,030 lines) but the sidebar is plain HaloTabs |
| 3 | Live torrent health graph, TMDB/name search | ✅ Done | `TorrentHealthDashboard.tsx` (272 l), `/admin/torrents`, `/api/admin/torrents/health/live` |
| 4 | Read-only cards from real data | ⚠️ Half | `LiveDashboardCards` + `getDashboardMetrics()` are clean; the **views chart below them is fabricated** (§7) |
| 5 | Admin alerts for app changes | ❌ Not built | `adminAlerts: false`; `AdminAlert*` models exist, **zero writers** |
| 6 | Broadcast to users | ❌ Not built | `adminBroadcast: false`; `Notification` / `NotificationRecipient` models unused |
| 7 | Add Media V2 + overview card | ❌ Not built | `adminAddMediaV2: false`; current flow still shows rights attestation per `ADMIN_GUIDE.md` |
| 8 | Activity bar | ❌ Not built | `adminActivityBar: false` |
| 9 | User add/remove/ban/unban | ⚠️ Code exists, flag off | `UsersTable.tsx` + `/api/admin/users` (501) |
| 10 | Dual login | ❌ Not built | `dualLogin: false`; `auth.ts` is credentials-only, no OAuth provider, no signup screen removal |
| 11 | Presence + current media id | ⚠️ Partial | `UserPresence` is read by `torrentHealth.ts`; no heartbeat client, `adminPresence: false` |
| 12 | ThreeUI integration | ⚠️ Partial | 74 vendored files, `scripts/verify-threeui.mjs` + `docs/threeui-manifest.json`; **font verification deliberately skipped** (documented in `PROGRESS.md`), **no CI exists to run it** |

Workstreams per `PROGRESS.md`: U1–U3, A–H complete; Y1–Y3 complete; W2, W3 complete; **Y4, W1, W4–W8 pending**.

---

## 6. Realtime & data-integrity implementation

Both SSE endpoints (`/api/admin/metrics/live`, `/api/admin/torrents/health/live`) follow the required shape: a full `snapshot` carrying `seq`, then 5-second updates, produced by the *same* server function (`getDashboardMetrics` / `getTorrentHealthSnapshot`) that seeded the page.

Deviations from AGENTS §6:

- **6.4 not met:** the "delta" is a full recomputed snapshot, not a small delta; the client comment admits it — and the `lastSeq` comparison in `LiveDashboardCards.tsx` sits inside a `[]` effect, so the closure's `lastSeq` never advances and the missed-sequence → snapshot-refetch path can never trigger.
- **6.6 and 6.7 deleted:** `scripts/verify-dashboard-integrity.js` (the CI literal / `Math.random` / `setInterval` gate) and `src/features/admin/metrics.test.ts` (the DB-vs-card integrity test) are **deleted in the working tree**, while `npm run test:integrity` still points at the removed script. This is exactly the "never delete a test" rule in §3.5.
- `Math.random` itself is absent from admin code (present only in `IntroGate`, `SoundEngine`, ambient blobs — non-metric uses).

---

## 7. Findings, ranked

### Critical

1. **Unauthenticated admin API.** `src/middleware.ts` matcher is `['/admin/:path*', '/settings/:path*']` — it never covers `/api/admin/*`, and **0 of 20 admin route handlers call `auth()`**. 15 of 20 have neither an auth check nor a feature-flag guard: `POST/GET /api/admin/titles`, `/api/admin/media`, `/api/admin/upload`, `/api/admin/tmdb`, both `review-reports` routes, all four `reviews` routes, `titles/[id]/media/{add,replace,[torrentId]}`, `titles/[id]/reviews`, and `users/[id]/restrictions*`. Anyone who can reach the origin can create, modify and delete media and issue restrictions.
2. **Fabricated dashboard data.** `src/app/admin/page.tsx:42` renders `value="4,250"`, `description="+12% from last week"` and a literal 7-day `data` array — a direct breach of §6 rules 1, 2 and 3, and it sits directly beneath the honest KPI cards.
3. **Three corrupted source files** (invalid control bytes; `tsc` reports 335 errors, all syntax-level):
   - `src/routes/stream.ts` — UTF-8 BOM, **NUL at lines 41 and 76**, `BEL` at line 139 (31 errors); git now classifies it as binary so diffs are unreviewable. Protected zone.
   - `src/components/player/VideoPlayer.tsx` — **`BEL` at line 40** cascading into 299 errors. HEAD version is clean, so this happened in the working tree.
   - `src/engine/ffprobe.ts` — untracked new file, line 6 reads `` const cacheKey = \\\-\\; `` where a template literal belongs.

   The pattern (backticks / `${}` mangled into backslashes plus control characters) points at a botched string-escaping edit script — the same class of bug as the ~50 root-level `fix*.js` files.

### High

4. **Existing tests deleted** in the worktree (`metrics.test.ts`, `verify-dashboard-integrity.js`) without approval.
5. **Protected zones modified without approval:** `src/engine/torrentEngine.ts` (local `.torrent` lookup + 15 s metadata timeout), `src/engine/transcoder.ts` (`.mkv` no longer transcoded; `videoCodec` switched from `copy` to `libx264` — a real CPU and behavior change), `src/routes/stream.ts`, `src/routes/stats.ts`, `telegram/bot.ts`.
6. **Admin layout self-authorizes:** `setIsAuthorized(true); // Auto-authorizing for demo purposes` in `src/app/admin/layout.tsx`. Middleware currently compensates, but the client gate is decorative.
7. **Build hides failure:** `typescript.ignoreBuildErrors: true` + `eslint.ignoreDuringBuilds: true` + **no ESLint config and no `lint` script anywhere** — so §5.4's "run lint, typecheck and tests" has no tooling behind it.

### Medium

8. **Test suite red:** 4 failed / 2 passed (6 files), 5 tests passed. Three component suites fail on `Cannot find module '…\next\link' imported from next-view-transitions` (Next 16 resolution change); one failure is `dist/engine/torrentEngine.test.js` — a compiled artifact being picked up because `dist/` isn't excluded from the Vitest include pattern.
9. **Missing migration** for the 5 new `Media` columns (§3).
10. **Dead navigation:** the admin sidebar links to `/admin/settings`, which does not exist → 404.
11. **No rate limiting / audit logging:** `AdminEventLog` has zero writers; only the OTP request endpoint is rate-limited. §10 requires both for every new endpoint.
12. **Docs drift:** `ADMIN_GUIDE.md` still mandates the rights-attestation step that requirement 7 removes; README claims Next.js 15 (actual 16.3.8) and Docker support that doesn't match the compose file.

### Low / hygiene

13. 199 dirty git entries, 155 untracked paths; `tmp/torrent-stream/**` and `data/torrents/**` (real media payloads) are **not gitignored** — `git status` already throws "Filename too long" warnings on them. `.env` is ignored but present locally with `AUTH_SECRET`, `DATABASE_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`.
14. 50 `fix*.js` files at repo root + 17 more under `scripts/`, plus `.docx`, `Art/`, `intro/` — no `.github/`, so no CI exists for `verify-threeui.mjs` despite AGENTS §7.2 requiring it.

---

## 8. What could not be verified

- **No lint run** — no ESLint config or `lint` script exists in the project.
- **No `next build` / `start:engine` boot** — `build:ui` would mask the 335 TS errors anyway, and starting the engine would touch torrent state (protected zone).
- **No browser checks** — the render / hover / keyboard / three-width verification demanded by §7.9 was not performed.
- `.env` values were not read.

---

## 9. Recommended order of work

1. Repair the three corrupted files (recover `stream.ts` intent from HEAD + the current diff, rebuild the `ffprobe` cache key, restore VideoPlayer line 40) until `tsc` is clean.
2. Add `auth()` role guards to all 20 admin API routes and extend the middleware matcher to `/api/admin/:path*`.
3. Restore the two deleted integrity tests (or get explicit approval), and either restore `scripts/verify-dashboard-integrity.js` or drop the `test:integrity` script.
4. Replace the fabricated views chart with a real query, or remove it.
5. Turn off `ignoreBuildErrors` / `ignoreDuringBuilds`, add an ESLint config and `lint` script, exclude `dist/` from Vitest, and add a `.github` workflow running `tsc`, `vitest`, `verify-threeui.mjs`.
6. Commit or revert the protected-zone engine edits, add the missing migration, gitignore `tmp/` and `data/`.

---

## Appendix — Verification evidence

Commands were run from the project root on 10 October 2026. All were read-only (`--noEmit`, test run); no files were written by them.

### A. Typecheck

```
npx tsc --noEmit -p tsconfig.json --incremental false
```

**Result: exit 2 — 335 errors across 3 files.**

| File | Errors |
|---|---|
| `src/components/player/VideoPlayer.tsx` | 299 |
| `src/routes/stream.ts` | 31 |
| `src/engine/ffprobe.ts` | 5 |

All are syntax-level diagnostics (`TS1127 Invalid character`, `TS1005`, `TS1128`, `TS1135`), not type errors — i.e. the files are structurally damaged rather than merely mistyped.

### B. Control-byte scan

A byte scan of every `.ts/.tsx/.js/.mjs/.css/.json` under `src/`, `telegram/` and `scripts/` for bytes outside `9..13`:

```
src\components\player\VideoPlayer.tsx  ctrl=1
src\routes\stream.ts                   ctrl=3
scripts\fix_bot_magnet.js              ctrl=3
scripts\write_bot.js                   ctrl=1
```

Precise locations:

- `src/components/player/VideoPlayer.tsx:40:16` — `BEL (0x07)` inside the track-id expression
- `src/routes/stream.ts:41:26` — `NUL (0x00)` inside `args.push('-map', …)`
- `src/routes/stream.ts:76:16` — `NUL (0x00)` inside the subtitle `-map` argument
- `src/routes/stream.ts:139:38` — `BEL (0x08)` inside the `Content-Range` header value
- `src/engine/ffprobe.ts:6` — `` const cacheKey = \-\; `` (mangled template literal); file also carries a UTF-8 BOM

Confirmed `src/engine/ffprobe.ts` does **not** exist in `HEAD` (new, untracked, born corrupted), and `git show HEAD:src/components/player/VideoPlayer.tsx` has **0** control bytes — so the corruption was introduced in the current working tree.

### C. Test run

```
npx vitest run
```

**Result: `Test Files 4 failed | 2 passed (6)` · `Tests 5 passed (5)`**

- ✓ `src/features/sound/SoundEngine.test.ts` (3 tests)
- ✓ `src/engine/torrentEngine.test.ts` (2 tests)
- ✗ `dist/engine/torrentEngine.test.js` — `Vitest cannot be imported in a CommonJS module using require()` (compiled output not excluded from the include glob)
- ✗ `src/components/browse/MediaRow.test.tsx`
- ✗ `src/components/layout/Navbar.test.tsx`
- ✗ `src/components/ui/FloatingNavDock.test.tsx` — all three fail identically with `Cannot find module '…\next\link' imported from node_modules\next-view-transitions\dist\index.js` (Next 16 module-resolution change)

`--reporter=basic` is not a valid reporter in the installed Vitest 5 and fails at startup; the plain `npx vitest run` invocation above is the correct one.

### D. Not run

`npm run lint` (no such script, no ESLint config), `next build`, `start:engine`, browser verification.
