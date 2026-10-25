# Update Pack: Space Gradients Edition

A change-request prompt pack for Google Antigravity (also works in Claude Code). It upgrades an existing streaming web app with a live "space gradients" background, card interactions, a new navigation layout, a Settings area, a Profile page, a Search card, reviews, and a much stronger admin side.

The pack is written so the agent can change a lot without breaking what already works: it audits first, builds behind feature flags, uses additive database migrations only, and proves with regression tests that nothing else moved.

Reference image palette (from your upload) is used in Appendix A.

---

## Table of contents

1. What this pack changes
2. How to run this pack in Antigravity
3. Interpretations and assumptions (read and correct these first)
4. Execution order
5. Variables to fill in
6. Prompt U0: Update Master Context (append to your existing rules)
7. Prompt U1: Audit and regression baseline (read only)
8. Prompt U2: Data model, contracts and migrations (additive only)
9. Workstream A: Ambient "space gradients" background
10. Workstream B: Card interactions, hover banner and interface sounds
11. Workstream C: Navigation restructure
12. Workstream D: Settings (password with OTP, My List, Continue Watching, logout)
13. Workstream E: Profile page and single profile per account
14. Workstream F: Search card
15. Workstream G: Reviews
16. Workstream H: Admin upgrades
17. Prompt U-QA: Full regression, performance, accessibility and security pass
18. Prompt U-FINAL: Flag cleanup and final report
19. Appendix A: Palette and tokens
20. Appendix B: Reference fragment shader
21. Appendix C: Sound engine parameters
22. Appendix D: New and changed API endpoints
23. Appendix E: Acceptance checklist
24. Appendix F: Regression checklist
25. Appendix G: Rollback plan and utility prompts

---

## 1. What this pack changes

| # | You asked for | Workstream |
|---|---|---|
| 1 | Pitch-black background with the image's colours moving inside it, about 35 percent colour and 65 percent black, live and interactive | A |
| 2 | When browsing cards, the card thumbnail's colour glows and swaps into the background | A and B |
| 3 | Same background behaviour on the admin side | A and H |
| 4 | Click sound as the cursor moves across cards, and the hovered card lifts slightly | B |
| 5 | Hover banner (hero-style pop-up) on card hover, fully admin controlled | B and H |
| 6 | Keep the bottom navigation, change its items to Home, Search, My List, Profile, Settings | C |
| 7 | Move the top navigation to the centre of the page, only for Movies, TV Series, Anime | C |
| 8 | Remove the profile from the top right corner | C |
| 9 | Settings: change password with email OTP, strong password suggestions, colour-gradient strength meter | D |
| 10 | Settings: customize My List, continue watching, logout | D |
| 11 | One profile per account | E |
| 12 | Profile page with a bin icon per category: My List, search history, watched list | E |
| 13 | Search card: recent searches with a cross each, clear all, similar-search suggestions | F |
| 14 | Reviews | G |
| 15 | Admin: edit everything about a title (description, torrent or magnet, thumbnail, hover banner, reviews, subtitles) | H |
| 16 | Admin: create users, permanently delete users, ban users from watching or reviewing | H |

---

## 2. How to run this pack in Antigravity

These notes assume Antigravity's agent-first workflow. Feature names vary by version, so use the closest equivalent in yours.

1. Put Prompt U0 into the workspace's persistent rules or instructions area, appended below your existing rules. Do not replace the old rules.
2. Run Prompt U1 first. It is read only. Review the audit and the baseline before anything changes.
3. Run each workstream as its own task. Ask the agent to produce an implementation plan and a task list first, read them, then approve execution. If your version has a review-before-run policy for plans or commands, turn it on for this project.
4. Never run two agents that touch the same files. Workstreams A, B, and C touch shared UI files, so run them one after another. Workstreams G and H can run in parallel with D, E, F only after U2 has landed and each agent has been told which folders it owns.
5. Ask the browser-driving agent (if your version has one) to verify visual work: open the app, hover cards, scroll rows, and capture screenshots at 360, 768, 1280 and 1920 px. Sound cannot be verified from screenshots, so those checks are unit tests plus a manual checklist.
6. After each workstream, ask for a walkthrough: what changed, which files, which flags, screenshots, and the regression results compared with the baseline from U1.
7. Commit after each workstream on its own branch. Merge only after the regression checklist (Appendix F) passes.

---

## 3. Interpretations and assumptions

Your message was written fast and a few phrases can be read two ways. The prompts below are built on these readings. Change any row you disagree with before you start.

| Topic | How this pack reads it |
|---|---|
| "35 percent colours and 65 percent pitch black" | Of all pixels on the background layer, about 35 percent show colour and about 65 percent are pure black (`#000000`). The pack defines a measurable rule and a self-correcting controller so this holds while things move. |
| "Click sound while scrolling across, move a little up while the cursor is hovering" | As the cursor moves from one card to the next, a soft tick plays and the hovered card lifts a few pixels. A tick also plays as cards cross the focus line while a row scrolls. |
| "Hero banner that pops up when hovering over a card" | A wide pop-up preview card that appears after a short hover pause. The admin uploads its image (and optional short clip). It is separate from the home page hero and the card thumbnail. |
| "Thumbnail" | The card art (poster). It also feeds the colour extraction for the background glow. |
| "Wishlist", "watchlist", "My List" | All the same feature. The UI label is "My List". |
| "Watched list" | History of titles and episodes the user finished. Different from Continue Watching, which is unfinished items. |
| "Top navigation in the centre, only categories" | A floating centred pill at the top containing exactly Movies, TV Series, Anime. Nothing else in the header except an existing logo if one is already there. |
| "Change admin into settings" in the bottom bar | The Admin item is replaced by Settings for everyone. Admin users reach the admin console from a card inside Settings. The admin routes themselves stay unchanged. |
| "Strength colours from green to orange to red" | Green means strong, orange means fair, red means weak. The bar's gradient runs red to orange to green from left to right, and more of it is revealed as the password gets stronger. The text label and a checklist also show strength so colour is never the only signal. |
| "One profile per account" | The existing Profile table stays, but each account has exactly one. The profile picker and "Who is watching" screens go away. Kids mode and maturity limit move to Settings. |
| "Anime" category | A new category. It can contain movies or series. The data model gets a `category` field next to the existing `type` field. |
| "Ban a user" | Two separate restrictions, each with a reason and an optional expiry: block watching, and block reviewing. Account suspension (already existing) stays separate. |
| "Create or delete a user's account permanently" | Admin can create an account and can hard delete one, removing all of that user's data, behind strong confirmation. |
| Admin background | Same live background, same palette swapping when hovering rows, thumbnails and previews. Dense data screens put content on glass panels so text stays readable. |

---

## 4. Execution order

```
U0  Update Master Context
U1  Audit and regression baseline
U2  Data model, contracts, migrations
A   Ambient background
B   Card interactions, hover banner, sounds
C   Navigation restructure
E   Profile page and single profile
D   Settings
F   Search card
G   Reviews
H   Admin upgrades
QA  Full regression, performance, accessibility, security
FIN Flag cleanup and final report
```

Why this order: A and B build the visual foundation everything else sits on. C changes the shell. E must come before D because Settings depends on the one-profile model. F, G and H extend features that need U2's data changes.

---

## 5. Variables to fill in

| Variable | Meaning | Default |
|---|---|---|
| `{{APP_NAME}}` | Your product name | (yours) |
| `{{AMBIENT_COLOR_RATIO}}` | Share of the background that shows colour | 0.35 |
| `{{AMBIENT_TOLERANCE}}` | Allowed drift around the ratio | 0.03 |
| `{{OTP_LENGTH}}` | Digits in the email code | 6 |
| `{{OTP_TTL_MINUTES}}` | Code lifetime | 10 |
| `{{SOUND_DEFAULT}}` | Interface sounds on first run | on, volume 0.35 |
| `{{ADMIN_CAN_HARD_DELETE}}` | Which roles may permanently delete users | SUPER_ADMIN and ADMIN (ADMIN cannot delete admins) |

---

## 6. Prompt U0: Update Master Context

Append this to your existing persistent rules. It adds rules; it does not replace the original Master Context.

~~~text
# UPDATE MASTER CONTEXT: SPACE GRADIENTS EDITION

This is an addendum to the existing project rules. Everything in the original Master Context still applies. Where this addendum conflicts with it, this addendum wins ONLY for the items listed in section 2 below. Everything else stays exactly as it is.

## 1. Mission

Upgrade the existing app with the changes listed in section 2 without breaking any existing feature. The most important success criterion is NOT how much we add. It is that every existing feature still works exactly as before, except where a change is explicitly requested.

## 2. Requested changes (the full list, nothing else is in scope)

1. A live, interactive "space gradients" background: pitch black base, about {{AMBIENT_COLOR_RATIO}} of the surface showing colour, the rest pure black. Colours come from the palette in Appendix A.
2. The colour of the card thumbnail being browsed glows on that card and swaps into the background.
3. The same ambient background on the admin side.
4. A soft click sound as the cursor moves across cards and as cards pass the focus line while a row scrolls. The hovered card lifts slightly.
5. A hover banner pop-up for cards, with image (and optional short clip) controlled by the admin.
6. Bottom navigation items become: Home, Search, My List, Profile, Settings. The Admin item is removed from it.
7. Top navigation moves to the horizontal centre of the page and contains only: Movies, TV Series, Anime.
8. The profile control in the top right corner is removed.
9. Settings page: change password with email OTP, strong password suggestions and a colour-gradient strength meter; customize My List; manage Continue Watching; log out.
10. One profile per account.
11. Profile page with a bin icon per category: My List, search history, watched list.
12. A Search card with recent searches (each removable with a cross, plus clear all) and similar-search suggestions.
13. Reviews by users, moderated by admins.
14. Admin upgrades: full title editing (description, torrent or magnet, thumbnail, hover banner, reviews, subtitles); create users; permanently delete users; ban users from watching or from reviewing.

Anything not on this list must not change in behavior, appearance, API shape, or data.

## 3. Protected zones (do not modify unless a workstream explicitly lists the file)

- The torrent engine and everything under the torrent folder.
- Stream, HLS, subtitle-serving and probe code, EXCEPT adding one restriction-check hook where Workstream H says so.
- Authentication core: token issuing, refresh rotation, cookie settings, CSRF. New OTP endpoints are added next to them, not inside them.
- Existing database migrations. Never edit one. Only add new migrations.
- Existing tests. Never delete, skip, or weaken a test to make it pass. If a test fails because a requested change makes it obsolete, STOP and ask me, naming the test and the reason.
- Player internals: keyboard shortcuts, seek logic, progress saving, subtitle handling. The player only gains: (a) the ambient background pausing while it is mounted, (b) the restriction overlay from Workstream H.
- Build, deploy and CI configuration, except adding new test steps.

If a change seems to require touching a protected zone, STOP, explain why, propose the smallest possible alternative, and wait for approval.

## 4. Change control protocol

Follow this for every workstream:

1. IMPACT ANALYSIS: before editing, list every file you plan to create or change, and for each changed file list the files and components that import it (use the real dependency graph, not a guess). Rate each change Low, Medium, or High risk. Wait for my approval of the plan.
2. FEATURE FLAGS: every new behavior ships behind a flag so the old behavior can be restored instantly. Flags are in a typed `featureFlags` module, read from env and site settings, default ON in development and ON in tests. Flag names: `ambientBackground`, `cardSounds`, `hoverBanner`, `categoryNav`, `newBottomNav`, `singleProfile`, `searchCard`, `reviews`, `adminUserTools`, `settingsPage`, `profilePage`. When a flag is OFF, the app must behave exactly as before the update.
3. ADDITIVE ONLY: add columns, tables, endpoints and components. Do not rename or remove existing ones. Replace by deprecating: keep the old thing working, mark it deprecated in a comment and in docs, and remove it only in the final cleanup step after I approve.
4. SMALL STEPS: one numbered step at a time. After each step run lint, typecheck and the relevant tests. Fix before continuing.
5. REGRESSION GATE: at the end of each workstream run the full regression comparison against the baseline from Prompt U1 (tests, route inventory, screenshots). Any unexplained difference blocks the workstream.
6. BRANCHES: one branch per workstream named `feat/<workstream-letter>-<short-name>`. Conventional Commits.
7. ASSUMPTIONS: if something is ambiguous, state the assumption in one line and continue, unless the ambiguity affects data loss, security, or a protected zone, in which case stop and ask.
8. PROGRESS.md: update it after every workstream: what changed, flags added, migrations added, new env vars, known issues.

## 5. Naming glossary (use these words consistently in code and UI)

- Thumbnail: the card art (poster). Source of the card's glow and of colour extraction.
- Hero billboard: the large featured banner on the home page. Unchanged by this update.
- Hover banner: the wide pop-up that appears when hovering a card. New. Admin controlled.
- Ambient background: the live space-gradients layer behind the whole app.
- Palette (title palette): 3 vivid colours extracted from, or set for, a title's thumbnail.
- My List: the user's saved titles. (Aliases used by the user: wishlist, watchlist.)
- Continue Watching: unfinished items with saved progress.
- Watched list: finished titles and episodes (history).
- Category: Movies, TV Series, or Anime. Stored in `Title.category`. Different from `Title.type` (MOVIE or SERIES), which controls structure.
- Restriction: an admin-applied block on watching or on reviewing, with reason and optional expiry.

## 6. Layering contract (prevents visual interference)

Define these tokens once in the design system and use only them for stacking:

```
--z-ambient: -1      fixed background canvas, pointer-events: none
--z-content: 0       normal page content
--z-sticky: 20       sticky headers
--z-top-nav: 40      centred category nav
--z-bottom-nav: 50   bottom navigation
--z-popover: 60      card hover banner, menus, tooltips
--z-modal: 70        dialogs, search card, drawers
--z-toast: 80        notifications
--z-player: 90       watch page player surface
```

Rules:
- The ambient canvas never receives pointer events, never captures focus, and never changes layout.
- Page content must stay readable on any frame of the background. Text sits on tokens-based glass surfaces or has enough contrast against the brightest ambient color (verified by the contrast tests in Workstream A).
- The ambient background is OFF (pure black, rendering stopped) on the watch page so it cannot affect video or battery.

## 7. Quality bar for every workstream

- TypeScript strict, zero lint errors, zero console errors or warnings.
- Everything keyboard accessible with visible focus. Everything works at 360, 768, 1280, 1920 px.
- Every new motion respects the existing motion levels (off, minimal, standard, expressive) and `prefers-reduced-motion`.
- No hardcoded colours, radii, fonts or durations: tokens only (the token lint rule must still pass).
- Every new endpoint: Zod validation, authorization, rate limiting where relevant, audit log for admin actions, tests, entry in the API docs.
- Every new user-facing string is plain, specific, and consistent with existing copy.
- Frontend-only fallback: if the backend for a feature does not exist in this repository, implement against the typed mock API (MSW) using the same shared Zod schemas, and note it in PROGRESS.md.

## 8. Stop conditions

Stop and report immediately if: a test fails and you are not sure why; a protected zone must change; a migration would be destructive; the regression comparison shows an unexplained difference; or a requirement conflicts with another requirement.

Acknowledge by replying: "Update Master Context loaded", then summarize in 10 lines what you will and will not touch.
~~~

---

## 7. Prompt U1: Audit and regression baseline (read only)

Run this before anything changes. It produces the safety net that every later workstream is measured against.

~~~text
PROMPT U1: AUDIT AND REGRESSION BASELINE

This is a READ-ONLY task. Do not modify any source file. You may create files only under `docs/update-baseline/` and a git branch named `chore/update-baseline`.

## 1. Detect which layers exist

Inspect the repository and report, with file paths as evidence:
1. Is there a frontend? Framework, router, state library, styling approach, animation library, test setup.
2. Is there a real backend? Framework, ORM, database, auth approach, queue, torrent engine.
3. Is there a mock API (MSW or similar)? Where, and which endpoints.
4. Which of these exist already: theming engine and tokens, motion provider, appearance settings, player, watch progress, My List, search, ratings, admin area, torrent manager, user management, audit log.

Then state the mode for this update:
- FULL-STACK MODE: both frontend and backend exist. Implement real endpoints and migrations.
- FRONTEND-ONLY MODE: no real backend. Implement against the typed mock API and shared Zod schemas, and describe in docs what the backend must later implement.

## 2. Feature inventory

Create `docs/update-baseline/feature-inventory.md`: a table of every user-facing and admin-facing feature that exists today. Columns: Feature, Where (route or component), How to verify manually (one line), Automated test (file or "none"), Touched by this update? (Yes, No, Indirectly). Be exhaustive: every route, every nav item, every button in the header and bottom bar, every settings control, every admin screen.

## 3. Route and navigation map

Create `docs/update-baseline/routes.md`:
- Every route, its guard (public, auth, admin), its layout, and whether the header and bottom navigation show on it.
- The exact current contents of the top navigation, the top-right area, and the bottom navigation, including icons, labels, order, active styles, and behaviors at each breakpoint. Include screenshots (desktop and mobile) saved under `docs/update-baseline/screenshots/`.

## 4. Visual baseline

Using the browser tool (or Playwright), capture screenshots at 360, 768, 1280 and 1920 px of: landing, sign in, home, a category-like browse page, title detail (modal and page), watch page (paused state), My List, settings or account page, search, every admin screen. Save them as `docs/update-baseline/screenshots/<route>-<width>.png`. Disable animations while capturing, and wait for network idle.

## 5. Test and quality baseline

Run and record the results (pass counts, durations, failures) of: lint, typecheck, unit, component, integration, e2e, accessibility checks, and the production build with bundle sizes. Record Lighthouse scores for Home, Title and Watch. Save everything into `docs/update-baseline/quality.md`. If something already fails, list it as a PRE-EXISTING FAILURE and do not fix it in this task.

## 6. Dependency map for the files this update will touch

For each of these areas, list the files and the components or modules that import them (real imports from the code):
- App shell, header, top navigation, bottom navigation, route definitions.
- Global styles, tokens, theme provider, motion provider, appearance store.
- Title card, carousel row, hero billboard, title detail, hover or preview components.
- Search UI and search API client.
- Profile and account screens, profile picker, profile switcher, and anything using `profileId`.
- My List, watch progress, continue watching.
- Admin layout, title wizard, users screen, reports screen.
- Auth screens and password-related code.
- Prisma schema models Title, User, Profile, WatchlistItem, WatchProgress, Rating, and any API route touching them (FULL-STACK MODE).

Produce `docs/update-baseline/impact-map.md` and rate each area Low, Medium, or High risk for regressions, with a reason.

## 7. Existing data facts (FULL-STACK MODE)

- How many profiles per user can exist today, and are there users with more than one (report counts from the seed or dev data)?
- Which tables reference `profileId`?
- Do WatchlistItem and others already have an ordering column?
- Is there any existing review, search history, OTP or restriction concept?
- Is there a hard-delete path for users today?

## 8. Feature flag scaffolding (the only code allowed in this task, on the branch)

Create a typed `featureFlags` module (frontend and, in FULL-STACK MODE, backend) with the flag names listed in the Update Master Context, all defaulting to OFF in this task, readable from env and site settings. Add a unit test. This is the one code change permitted. Nothing may read the flags yet.

## 9. Deliverable

A single summary message: detected mode, counts of features and routes, the pre-existing failures, the top 10 regression risks for this update, and your recommended safeguards for each. Then STOP and wait for my approval before U2.
~~~

---

## 8. Prompt U2: Data model, contracts and migrations (additive only)

~~~text
PROMPT U2: DATA MODEL, CONTRACTS AND MIGRATIONS

Goal: land every data and contract change the later workstreams need, in one controlled step, without changing any existing behavior.

Rules for this prompt:
- Additive only. Do not rename, retype, or drop any existing column, table, endpoint or schema.
- Every new column on an existing table is nullable or has a default, so old code keeps working.
- Update `packages/shared` Zod schemas first (contract first), then the database, then the API, then the mock API.
- In FRONTEND-ONLY MODE: do only the shared schemas, the mock API handlers (MSW) and the typed API client functions, plus `docs/backend-requirements.md` describing everything the real backend must implement.
- Create one migration per concern with a clear name, so any one can be reverted alone.
- Provide a down-migration note for each (what to run to undo it).

## U2.1 Title: category, hover banner, palette

Add to `Title`:
- `category` enum `TitleCategory { MOVIE, TV_SERIES, ANIME }`, nullable at first.
- Backfill migration: `MOVIE` for type MOVIE, `TV_SERIES` for type SERIES. Then enforce NOT NULL with default derived in code on creation. Rule enforced in the service layer: category MOVIE requires type MOVIE, category TV_SERIES requires type SERIES, category ANIME allows either.
- `hoverBannerKey` (nullable string), `hoverBannerFocal` (nullable JSON), `hoverClipKey` (nullable string), `hoverClipDurationSec` (nullable int), `hoverTagline` (nullable string, max 120 characters).
- `ambientPalette` (nullable JSON): array of up to 3 objects `{ hex: "#RRGGBB", weight: number }`, plus `ambientPaletteSource` enum `{ AUTO, MANUAL }` default AUTO, and `ambientPaletteUpdatedAt`.
- Indexes: `(category, status, publishedAt)` for category browsing.

Add to `Episode` (optional, only if the audit shows episode stills are used as cards): the same `ambientPalette` JSON column.

## U2.2 Single profile per account

- Do NOT drop the `Profile` table. Everything keyed by `profileId` keeps working.
- Add `ProfileArchive` table: id, userId, originalProfileId, data (JSON snapshot of the removed profile and its related rows), archivedAt, purgeAfter (archivedAt plus 30 days).
- Write the migration script `scripts/migrate-single-profile.ts` (not run automatically):
  - Dry-run by default, `--apply` to execute, requires `--i-have-a-backup` as a second flag.
  - For each user with more than one profile, pick the primary: the profile with the most recent `WatchProgress.updatedAt`, else the earliest created.
  - Merge into the primary: union of My List items (dedupe by title), watch progress (keep the row with the latest `updatedAt` per media asset), ratings (primary wins on conflict), preferences (primary wins).
  - Archive the non-primary profiles into `ProfileArchive`, then delete them.
  - Print a report: users affected, rows merged per table, rows archived, conflicts resolved.
  - Idempotent. Safe to run twice.
- After the script has been applied (a manual step, documented), add a unique constraint on `Profile.userId`. Put that constraint in a SEPARATE migration file marked "apply after migrate-single-profile".
- Service layer: creating a second profile returns 409 `PROFILE_LIMIT` with a clear message. Registration auto-creates the single profile. Keep the old multi-profile endpoints working but deprecated: `GET /api/profiles` returns an array of exactly one profile.

## U2.3 My List ordering and Continue Watching hiding

- `WatchlistItem.sortOrder` (int, nullable). Backfill by `addedAt` ascending. New items get max plus one.
- `WatchProgress.hiddenFromContinue` (boolean, default false) and `hiddenAt` (nullable).
- `WatchProgress.watchedAt` (nullable timestamp, set when `completed` becomes true) for the Watched list, backfilled from `updatedAt` where completed.

## U2.4 Search history

New table `SearchHistory`: id, userId, queryNormalized (lowercased, trimmed, collapsed spaces), queryDisplay (as typed, max 80 characters), count (int, default 1), createdAt, lastSearchedAt. Unique on `(userId, queryNormalized)`. Index on `(userId, lastSearchedAt desc)`. Cap of 50 per user enforced in the service (delete oldest beyond the cap). Retention: delete entries older than 180 days via the existing cleanup job.

## U2.5 Password change OTP

New table `OtpChallenge`: id, userId, purpose enum `{ PASSWORD_CHANGE }` (extensible), codeHash, salt, attempts (int, default 0), maxAttempts (int, default 5), expiresAt, consumedAt (nullable), lastSentAt, sendCount (int), ipAddress, userAgent, createdAt. Indexes on `(userId, purpose, createdAt desc)`.

New table `PasswordChangeGrant`: id, userId, tokenHash, expiresAt, usedAt. A grant is issued after a correct OTP and is required to change the password.

Add `User.mustChangePassword` (boolean, default false) for admin-created accounts.

## U2.6 Reviews

New tables:
- `Review`: id, titleId, userId (nullable only for editorial reviews written under a label), rating (int 1 to 5), body (text, 10 to 1500 characters), containsSpoilers (boolean), status enum `{ VISIBLE, HIDDEN, REMOVED }` (default VISIBLE), isEditorial (boolean, default false), authorLabel (nullable string, used for editorial reviews, for example "Editor's pick"), isPinned (boolean, default false), editedAt, moderatedById, moderationNote, createdAt, updatedAt. Unique on `(titleId, userId)` where userId is not null and isEditorial is false (one user review per title). Indexes on `(titleId, status, createdAt desc)` and `(userId)`.
- `ReviewReport`: id, reviewId, reporterUserId, reason enum, details, status enum `{ OPEN, RESOLVED, REJECTED }`, handledById, createdAt. Unique on `(reviewId, reporterUserId)`.

Existing thumbs-up and thumbs-down `Rating` stays exactly as it is. Reviews are a separate feature. Do not merge them.

## U2.7 User restrictions

New table `UserRestriction`: id, userId, type enum `{ WATCH_BLOCK, REVIEW_BLOCK }`, reason (text, required), expiresAt (nullable, null means permanent), createdById, createdAt, revokedAt (nullable), revokedById (nullable), revokeNote. Index on `(userId, type, revokedAt, expiresAt)`.

A restriction is ACTIVE when `revokedAt` is null and (`expiresAt` is null or in the future).

## U2.8 Permanent user deletion support

- New table `DeletedUserTombstone`: id, userIdHash (SHA-256 of the user id with a server pepper), emailHash (SHA-256 of lowercased email with the pepper), deletedAt, deletedById, reason. Purpose: keep an audit trail and block accidental re-use of an invite without storing personal data.
- Foreign keys from user-owned tables to `User` must use ON DELETE CASCADE or SET NULL as appropriate. List every table that references `User` or `Profile`, decide cascade versus set-null for each, and document the decision in `docs/data-deletion.md`. Do not change existing foreign keys silently: if an existing key must change, STOP and ask.

## U2.9 Shared Zod schemas

Create or extend, with exported TypeScript types:
- `TitleCategorySchema`, updates to `TitleSummarySchema` and `TitleDetailSchema` (category, hoverBanner urls, hoverTagline, ambientPalette).
- `AmbientPaletteSchema`: 1 to 3 colours, each `#RRGGBB`, weights 0 to 1.
- `PasswordOtpRequestSchema`, `PasswordOtpVerifySchema`, `PasswordChangeSchema`.
- `SearchHistoryItemSchema`, `SearchSuggestionSchema` (type: HISTORY, TITLE, GENRE, PERSON, SIMILAR).
- `ReviewSchema`, `ReviewCreateSchema`, `ReviewUpdateSchema`, `ReviewReportSchema`.
- `UserRestrictionSchema`, `RestrictionCreateSchema` (type, reason, optional expiresAt).
- `AdminCreateUserSchema`, `AdminDeleteUserSchema` (confirmation fields).
- `MyListOrderSchema`, `ContinueWatchingActionSchema`.
- Extend `AppearancePrefs` with: `ambient: { mode: 'live' | 'calm' | 'static' | 'off' }`, `sounds: { enabled: boolean; volume: number; onHover: boolean; onScroll: boolean; haptics: boolean }`, `myList: { view: 'grid' | 'list'; sort: 'manual' | 'recent' | 'az' | 'year' }`. Bump the preferences schema version, and give every new field a default so existing saved preferences still validate.

## U2.10 Endpoints (contracts only in this step)

Document in `docs/api.md` and the OpenAPI output every endpoint listed in Appendix D, with request and response schemas, auth, errors and rate limits. Implement only what this step needs for the contracts to compile (route stubs returning 501 NOT_IMPLEMENTED behind the relevant flag are acceptable). The real logic arrives in each workstream.

## U2.11 Mock API (both modes)

Extend the MSW handlers so every workstream can be built and tested without waiting for the backend. Seed mock data: titles across all three categories (at least 8 Movies, 8 TV Series, 8 Anime), each with a `hoverBanner`, an `ambientPalette` of 3 vivid colours, 3 to 6 reviews on a few titles, a user with search history, a user with an active WATCH_BLOCK, and a user with an active REVIEW_BLOCK. Use locally generated gradient artwork only (no copyrighted images).

## U2.12 Verification

- Migrations apply on a clean database and on a copy of the existing dev database. Down-migration notes verified by reverting each one and re-applying.
- All existing tests still pass unchanged. The full regression comparison against the U1 baseline shows zero differences (the new code is not wired to anything yet).
- Shared schema tests: valid and invalid cases for each new schema, including palette validation and the preferences migration filling defaults.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 9. Workstream A: Ambient "space gradients" background

~~~text
WORKSTREAM A: AMBIENT SPACE-GRADIENTS BACKGROUND

Goal: a live, interactive background behind the whole app. Pure black (#000000) base, with soft moving colour from the palette in Appendix A covering about {{AMBIENT_COLOR_RATIO}} of the surface. It reacts to the pointer, to scrolling, and to the card being browsed. It must never hurt performance, readability, accessibility, or any existing feature.

Branch: `feat/a-ambient-background`. Flag: `ambientBackground`. When the flag is OFF the app must look and behave exactly as before.

## A.0 Plan first

Before coding, show me:
1. The files you will create (all inside a new folder `src/features/ambient/`) and the few existing files you must touch (the app root to mount the layer, the appearance store to add settings, the settings UI entry). Keep the list under 8 existing files.
2. The impact analysis for each existing file (what imports it).
3. Which rendering path you chose and why (see A.2). Default to WebGL2 with a Canvas 2D fallback and a CSS fallback.
Wait for approval.

## A.1 Visual design rules (what it must look like)

Reference: the "Space gradients" image. Soft nebula-like blobs of blue, indigo, periwinkle and orchid, with small hot white cores, floating inside absolute black. A thin diagonal light beam (the "black matter" streak) sometimes crosses the scene. Three soft glowing planet orbs drift slowly.

Rules:
1. Base is `#000000` exactly. No navy tint, no noise lifting the blacks. Pixels outside the colour fields must be pure black.
2. Colour fields are soft and large. No hard edges, no visible shapes, no banding (add 1 LSB of blue-noise dither).
3. White cores are tiny and rare. They must never sit behind body text at full intensity (see A.8).
4. Motion is slow and organic: a full drift cycle takes 40 to 90 seconds. Nothing flashes. Brightness changes are gradual (no change faster than 20 percent per second). This protects photosensitive users.
5. The overall mood is calm cinema, not a screensaver. The background supports content and never competes with it.
6. Colour ratio target: {{AMBIENT_COLOR_RATIO}} coloured, the rest pure black, within {{AMBIENT_TOLERANCE}}. Defined precisely in A.3.

## A.2 Architecture

Create `src/features/ambient/` with these modules (names are required so later workstreams can rely on them):

```
ambient/
  AmbientProvider.tsx        React context and lifecycle, flag and settings aware
  AmbientCanvas.tsx          the single fixed canvas (z-index token --z-ambient)
  engine/
    AmbientEngine.ts         render loop, uniforms, resize, pause and resume, context loss
    webgl.ts                 WebGL2 renderer using the fragment shader in Appendix B
    canvas2d.ts              Canvas 2D fallback renderer (radial gradients, blurred)
    cssFallback.ts           static CSS gradient generator for no-motion cases
    blobs.ts                 blob simulation: positions, drift, springs, pointer forces
    palette.ts               base palette, palette blending in OKLab, palette sanitizing
    coverage.ts              closed-loop coverage controller and measurement helpers
    quality.ts               frame time monitor and adaptive quality
  hooks/
    useAmbientFocus.ts       API for cards and rows to set the focused palette
    useAmbientPause.ts       API for routes (watch page) to pause rendering
  devtools/
    AmbientDebug.tsx         overlay with fps, coverage ratio, palette (dev only, ?ambientDebug=1)
  index.ts                   public exports
```

Rendering decisions:
1. ONE canvas for the whole app, mounted once in the app root, `position: fixed; inset: 0; pointer-events: none; z-index: var(--z-ambient)`. Never one canvas per page or per card.
2. Render at reduced resolution (about 0.5 of CSS pixels, never above devicePixelRatio 1.5) and let CSS scale it. Soft gradients do not need full resolution, and this cuts GPU cost by 4x or more.
3. WebGL2 first. If WebGL2 is unavailable or the context is lost twice, switch to the Canvas 2D renderer. If that is too slow (see quality.ts) or motion is disabled, switch to the CSS fallback (static, same ratio).
4. Pause the render loop when: the tab is hidden, the ambient mode is `static` or `off`, the watch page is mounted, or the canvas is fully covered by an opaque modal for more than a few seconds (optional optimization).
5. Never run layout-triggering work per frame. All simulation lives in plain typed arrays. React never re-renders per frame.
6. No heavy libraries. Do not add three.js or any large dependency. Raw WebGL2 is enough for one fullscreen triangle. Total added JavaScript for this feature must stay under 25 KB gzipped, loaded in a lazy chunk after first paint.
7. Handle `webglcontextlost` and `webglcontextrestored`. Clean up all GPU resources on unmount. A test mounts and unmounts the provider 50 times and asserts no leaked listeners or animation frames.

## A.3 Colour coverage: definition and controller

The 35 / 65 split must be measurable, not a vibe.

Definition: render the ambient layer alone (no UI on top). A pixel counts as COLOURED when `max(R, G, B) >= 26` (out of 255). Coverage is the share of coloured pixels. Target {{AMBIENT_COLOR_RATIO}}, tolerance {{AMBIENT_TOLERANCE}} measured as a 10 second moving average. Instantaneous values may move between 0.30 and 0.40.

Controller (`coverage.ts`):
1. The shader outputs `intensity = smoothstep(uCut - uSoft, uCut + uSoft, field)` where `field` is the summed blob field. The uniform `uCut` decides how much of the screen is above the threshold.
2. Every 250 ms, render a tiny 64 by 36 coverage pass into an offscreen target (same shader, no dither), read it back with `readPixels`, and compute the coverage share using the definition above. Reading 2304 pixels at 4 Hz is negligible.
3. A PI controller adjusts `uCut` slowly toward the target: `error = target - measured`, `cut -= Kp * error + Ki * integral(error)`, clamped to a safe range. Use small gains so the correction is invisible (tune so the response time is several seconds). Anti-windup on the integral.
4. When the palette swaps or the pointer pushes blobs around, coverage drifts and the controller pulls it back. The ratio is therefore stable by construction.
5. For the Canvas 2D fallback, estimate coverage analytically from blob radii and the threshold curve, or sample a 64 by 36 downscale with `getImageData` at 4 Hz. Same controller.
6. The CSS fallback is generated from a pre-solved layout whose coverage was measured once in a test.
7. Expose `measureCoverage()` for tests and the debug overlay.

Required test (Playwright, dev route `/__dev/ambient` that renders only the canvas, flag ON, full-motion): sample the canvas pixels 20 times over 20 seconds and assert the mean coverage is within the tolerance, and that pure black pixels outside the coloured fields are exactly `#000000`. Repeat after triggering a palette swap and after a simulated pointer sweep across the screen.

## A.4 Blob simulation and interactivity

Simulation (`blobs.ts`), all values come from tokens or a config object, none are magic numbers scattered in code:
- 8 blobs plus 3 planet orbs plus 1 beam. Each blob has: position, velocity, radius, weight, colour slot.
- Idle drift: each blob follows a slow Lissajous-like path with unique periods between 40 and 90 seconds plus a gentle noise wobble. Blobs softly repel each other so they do not stack.
- Pointer interaction (desktop): the pointer acts as a soft attractor. Nearby blobs lean toward the pointer with a spring (stiffness low, damping high), with a maximum offset so blobs never chase the cursor aggressively. The pointer also adds a faint extra glow blob that follows with lag. When the pointer is idle for 3 seconds, influence fades out.
- Click or tap: a slow ripple (one expanding ring of brighter field that fades over about 1.2 seconds) at the click position. Rate limited to one every 400 ms.
- Scroll: scroll velocity (smoothed) adds to the drift speed, up to a cap, so the background feels alive while the user moves through content. When scrolling stops it eases back.
- Device tilt (mobile, optional and OFF by default): slight parallax using DeviceOrientation, only if permission is granted. Do not prompt for the permission automatically.
- Beam: every 25 to 40 seconds, a diagonal azure beam (see palette) fades in, slowly sweeps across over about 12 seconds, and fades out. At `calm` mode the beam is disabled.
- Planet orbs: three soft crescent glows using the planet palettes in Appendix A, orbiting slowly and partly behind the blobs.
- All motion must be frame-rate independent (use delta time) and clamp huge deltas after tab switches.

Modes (user setting under Appearance, stored in the appearance preferences added in U2):
- `live`: everything above. Default for standard and expressive motion levels.
- `calm`: no beam, no ripple, half the drift speed, reduced pointer influence. Default for the minimal motion level.
- `static`: one pre-rendered frame (CSS fallback or a single canvas frame) with the same coverage, no animation. Used automatically for `prefers-reduced-motion`, `saveData`, motion level `off`, and as a user choice.
- `off`: pure black.
A visible "Pause background" control must exist in Settings (WCAG: pause, stop, hide for motion longer than 5 seconds). The user's explicit choice always wins over automatic defaults, and the app must never raise the mode automatically.

## A.5 Palette focus: card thumbnail glow swaps into the background

This is the signature behaviour. Build it as a small, strict API so cards, rows, hero, admin tables and the search card can all use it.

API (`useAmbientFocus.ts`):
```ts
type FocusSource = 'hover' | 'carousel' | 'keyboard' | 'hero' | 'detail' | 'admin';
interface FocusRequest {
  id: string;                    // title id (or episode id)
  palette: { hex: string; weight: number }[]; // 1 to 3 colours
  anchor?: { x: number; y: number };          // viewport centre of the card, 0..1
  source: FocusSource;
}
useAmbientFocus(): { focus(req: FocusRequest): void; release(id: string): void; releaseAll(): void }
```

Behaviour:
1. `focus` retargets the ambient palette toward the card palette. The 3 card colours replace the colours of the nearest blobs (by distance to `anchor`) first, then gradually the rest, so the colour appears to flow from the card's area outward. At full swap about 70 percent of coloured area uses the card colours and 30 percent keeps the base palette, so the background never loses its identity or becomes a flat single hue.
2. Transition: 700 ms crossfade (token `--dur-ambient-swap`, multiplied by the user's motion speed), interpolated in OKLab, with an ease-out curve. If a new focus arrives mid-transition, retarget from the CURRENT interpolated state, never from the old endpoint (no visual jump).
3. Hover intent: begin the swap after 120 ms of hover (faster than the 450 ms hover banner delay so the colour leads the banner). Ignore hover changes shorter than that, to avoid flicker while the cursor sweeps across a row.
4. Carousel and touch: while a row scrolls or is swiped, the focused card is the one nearest the row's focus line (centre for touch, the hovered card for mouse). Evaluate on `requestAnimationFrame`, throttled to 10 Hz, with hysteresis so the focus does not flip back and forth at the midpoint between two cards.
5. Keyboard: focus on a card (focus-visible) triggers the same swap.
6. Release: when the pointer leaves all cards, wait 900 ms, then ease back to the base palette over 1000 ms. If another card is focused in that window, skip the return and go straight to the new palette.
7. Hero billboard: the active hero slot's palette is focused automatically, with source `hero`, and re-focused on each rotation.
8. Title detail (modal or page): the title's palette stays focused while open.
9. Reduced motion or `static` mode: the swap happens as a single quick crossfade of the static frame (300 ms, opacity only) or instantly when motion is off.
10. Coverage stays at the target during swaps (the controller from A.3 handles it).
11. Palette source: use `title.ambientPalette` from the API. If missing (older titles, mock data), compute it client side from the thumbnail with a small, cached, off-main-thread routine (OffscreenCanvas or a worker) and cache the result in memory keyed by image URL. Handle CORS-tainted canvases by falling back to the base palette silently.
12. Never block rendering waiting for a palette.

Card glow (visual, on the card itself):
- The focused card gets a soft glow in its first palette colour: a blurred pseudo-element behind the card, animated with `opacity` only (never animate `box-shadow` or `filter` per frame). Colour comes from a CSS variable `--card-glow` set on the card.
- Glow intensity scales with the motion level: off none, minimal a thin colour ring, standard soft glow, expressive soft glow with a slow breathing pulse (opacity only).

## A.6 Palette extraction pipeline (server and admin)

Used by Workstream H, defined here so the engine and the pipeline agree.
- On thumbnail upload (and on demand via "Re-extract"), the server downsamples the image to about 64 by 64 using `sharp`, converts pixels to OKLab, runs k-means with k = 5, discards near-black, near-white and low-chroma clusters, ranks by (cluster size times chroma), and keeps the top 3.
- Each kept colour is normalised so it works on pure black: lightness between 0.62 and 0.85, chroma at least 0.10, hue preserved. Convert back to sRGB hex.
- Store as `ambientPalette` with `ambientPaletteSource = AUTO`. Admin may override manually (`MANUAL`), and manual values are never overwritten by a re-upload unless the admin clicks "Re-extract".
- Unit tests with fixture images: a red image, a teal-and-orange image, a nearly monochrome image (falls back to the base palette with a small tint), and a mostly black image.

## A.7 Settings and integration (the few existing files you may touch)

1. App root: mount `<AmbientProvider>` and `<AmbientCanvas />` once, inside the existing providers, behind everything. Remove or neutralize any existing opaque page background colour ONLY when the flag is ON, by setting the body background to `transparent` through a flag-scoped class. When the flag is OFF the old background is untouched.
2. Appearance store: add the `ambient.mode` preference with default values (already in the shared schema from U2).
3. Settings UI (Appearance section, wherever it currently lives): add a "Background" group with: mode (Live, Calm, Static, Off), a Pause toggle, and a note explaining that reduced motion switches to Static automatically. Do not redesign the surrounding UI.
4. Watch page: call `useAmbientPause()` on mount so the canvas stops rendering and the page shows pure black. Resume on unmount. No other change to the player.
5. Route changes must not remount the canvas. Verify the engine keeps running across navigation.

## A.8 Readability guard (prevents the background from breaking existing screens)

1. Text, forms, tables and controls sit on the existing surface tokens. Where an existing screen relied on a solid page background for contrast, add a flag-scoped scrim layer (translucent black with backdrop blur using the `--blur-glass` token) behind the content area, not behind the whole page.
2. Compute the WORST CASE: the brightest ambient colour (`#FFFFFF` core blended at full intensity, then the palette peaks at full intensity) against each text token (`--c-text`, `--c-text-muted`) through the surface scrim. Write a unit test that fails if any text token falls below WCAG AA (4.5:1 for body, 3:1 for large text) in the worst case.
3. Hero text and card overlays get the existing gradient scrims. Do not rely on the background for contrast anywhere.
4. Visible focus rings must still meet 3:1 against the worst-case background.
5. Run the existing axe-core accessibility checks with the flag ON on every page. Zero new serious or critical violations.

## A.9 Performance and quality budgets

Targets on a mid-range laptop and a mid-range phone profile:
- Median 58 frames per second or better while idle on the home page, and 55 or better while scrolling and moving the pointer.
- Main thread cost of the engine under 0.5 ms per frame (simulation plus uniform upload). GPU cost does not drop frames while video previews play.
- Adaptive quality (`quality.ts`): if the 2-second moving average frame time exceeds 20 ms, step down one tier: first reduce render scale (0.5 to 0.35), then drop the planets, then drop the beam, then switch to Canvas 2D, then to static. Never step back up automatically more than once per 60 seconds, and only after 10 seconds of healthy frames.
- Memory flat over 30 minutes (no leaks).
- No layout shift, and no effect on Largest Contentful Paint (the canvas lazy-loads after first paint, and the page shows pure black first).
- Added bundle size under 25 KB gzipped for the lazy chunk.
- Pause when the tab is hidden, resume without a time jump.

## A.10 Admin parity (implemented here, used in Workstream H)

- The same provider and canvas wrap the admin layout. The admin shell reads the same `ambient.mode` preference.
- Admin dense screens (tables, wizard, torrent manager) add a stronger glass scrim behind content panels, and cap blob brightness to a gentler ceiling via a config value `AMBIENT_ADMIN_BRIGHTNESS_CAP` (default 0.6) so long reading and form filling stay comfortable. The coverage ratio target does not change.
- Admin focus sources (`admin`): hovering a title row or thumbnail in tables, selecting a title in the wizard, previewing artwork, opening the hover-banner preview, and the live palette preview all call `focus`.

## A.11 Tests

- Unit: OKLab blending, palette sanitizing, controller convergence (simulated plant), hysteresis logic, adaptive quality steps, contrast worst-case test.
- Component: provider lifecycle, mode switching, reduced-motion defaults, pause on watch page, flag OFF renders nothing and leaves the old background.
- E2E (Playwright): coverage measurement (A.3), card hover swap changes the sampled dominant colour near the card's region within 1 second, leaving all cards returns to base, navigation does not remount the canvas, the watch page canvas is not rendering (no animation frames, pure black), prefers-reduced-motion starts in static mode.
- Visual baseline: screenshots with the ambient mode set to `static` (deterministic) for all key pages, compared with the U1 baseline allowing the intentional background difference only (mask the background region or compare content regions).

## A.12 Phase gate

- Flag OFF: regression comparison with the U1 baseline shows zero differences.
- Flag ON: every page is readable, the ratio holds, performance budgets pass, accessibility checks pass.
- Debug overlay (`?ambientDebug=1`) shows fps, coverage, active palette and the current tier.
- Walkthrough with screenshots of: idle, pointer interaction, card focus swap, static mode, admin dashboard, watch page (pure black).

Update PROGRESS.md and `docs/ambient.md` (how it works, how to tune values, how the controller works, how to add a palette). Stop and wait for "continue".
~~~

---

## 10. Workstream B: Card interactions, hover banner and interface sounds

~~~text
WORKSTREAM B: CARD INTERACTIONS, HOVER BANNER, INTERFACE SOUNDS

Goal: cards feel alive. As the cursor moves across cards, each hovered card lifts a little, a soft tick plays, and its colour glows into the background (using Workstream A). After a short pause a hover banner pops up. Rows tick as cards pass the focus line while scrolling.

Branch: `feat/b-card-interactions`. Flags: `cardSounds`, `hoverBanner`. With both OFF, cards behave exactly as before. Run only after Workstream A is merged.

## B.0 Plan first

Show: the existing card, row and hover-preview components and everything that imports them; the exact files you will change; how the existing hover preview (if any) relates to the new hover banner. If an existing hover preview exists, the hover banner REPLACES it only when the `hoverBanner` flag is ON. Wait for approval.

## B.1 Card lift on hover

Behaviour:
- On hover (mouse) or focus-visible (keyboard), the card moves up by `--lift-card` (default 8px) and its z-order rises so it never gets clipped by neighbours.
- Transition: transform only, duration `--dur-fast` (150 ms) with `--ease-out`, released with the same timing.
- It replaces the previous scale-up hover. If the old behavior scaled the card, keep scale at 1 when the flag is ON. At the expressive motion level add a scale of 1.02 and a very slight tilt (max 2 degrees toward the pointer) using transform only.
- Row clipping: rows use `overflow-x: auto` which also clips the vertical lift. Fix this with padding on the row container (padding-top at least the lift distance plus the glow radius) and a negative margin to cancel the layout shift, so the page layout does not move at all. Verify with a layout shift test.
- Motion levels: off no lift, minimal a 1px outline highlight only, standard lift, expressive lift plus tilt.
- Touch devices: no hover lift. A short press feedback (scale 0.98) on tap only, if the motion level allows.

## B.2 Card glow

Reuse the glow from Workstream A (A.5). The card sets `--card-glow` from its title palette (first colour, sanitized). The glow is a blurred pseudo-element animated with opacity only. Make sure glows do not stack: only the focused card glows.

## B.3 Wiring cards to the ambient background

- Every card (poster, wide, minimal variants) calls `useAmbientFocus().focus(...)` on hover intent (120 ms), keyboard focus, and when it becomes the focused card of a scrolling row, and `release(id)` on leave or blur.
- Rows own the carousel focus logic from A.5 item 4 (nearest card to the focus line with hysteresis). Cards do not each run scroll listeners. One controller per row, using one `requestAnimationFrame` loop that only runs while the row is scrolling.
- Search results, My List grid cards, category grids and admin thumbnails use the same card component or the same hook. Do not copy logic.

## B.4 Hover banner (the pop-up)

Behaviour:
- After 450 ms of continuous hover (hover intent) on a card, a pop-up banner appears anchored to the card. The lift and glow happen immediately, the banner follows.
- Layout: a card-like panel with the wide hover banner image on top (16:9), a gradient scrim, then the title (or logo), a one-line `hoverTagline` (falls back to the first sentence of the synopsis), a metadata row (category, year, rating or maturity, runtime or seasons), genre chips (max 3), and actions: Play (or Resume), Add to My List (toggle), More info.
- Size: width clamp between 300 and 420 px, scaled from the card width. Position it so it never leaves the viewport: prefer centred over the card, shift horizontally at row edges, and flip above or below depending on space.
- Media: use `hoverBanner` image. If missing, fall back to the backdrop, then to a gradient made from the title palette. If the admin uploaded a hover clip and the user has "Autoplay previews" on and the motion level is not off, fade in a muted looping preview over the image after the image has loaded, and pause it as soon as the banner closes. Only one banner and one preview exist at a time.
- Close: pointer leaves both the card and the banner (150 ms grace so the pointer can travel between them), Escape, scroll of the page by more than 40 px, or opening another banner. Focus: opening via keyboard focus shows the banner after 450 ms and Escape closes it without losing focus on the card.
- Touch devices: no banner. Tap opens the detail modal as before.
- Accessibility: the banner is a non-modal region (`role="group"` with an accessible label), not a dialog, and never traps focus. Action buttons are reachable by keyboard (Tab from the card moves into the banner when it is open). Content is not duplicated for screen readers (the card already exposes the title).
- Performance: one portal at the document body in the `--z-popover` layer. Images are preloaded on hover intent start (at 200 ms) using the existing image variants, never before. Cancel in-flight loads when the pointer leaves. No layout thrash.
- Animation by motion level: off instant show, minimal fade, standard scale from 0.96 plus fade from the card's position, expressive spring from the card plus a slow colour wash using the title palette.
- Palette: the banner's border glow uses the title palette, matching the ambient swap.
- Data: `hoverBanner` URLs, `hoverTagline`, and the palette arrive in the title summary payload already extended in U2. If the list payload does not include them yet, add them to the summary DTO (additive) rather than fetching per hover.

## B.5 Interface sounds (the click)

Build `src/features/sound/` with a `SoundEngine` using the Web Audio API (no audio files, no licensing issues). Parameters live in Appendix C.

Behaviour:
- Tick on hover: when the cursor enters a new card within a row, play a short soft tick. Each card index in a row maps to a slightly different pitch from a small scale, so sweeping across a row sounds like a gentle ladder, not the same click repeated.
- Tick on scroll: while a row scrolls (wheel, trackpad, drag, swipe, arrow button), play a tick each time a new card crosses the row's focus line, rate limited to one tick per 45 ms and a maximum of 12 ticks per second.
- Never play: on the watch page; while any video or audio element is playing with sound; when the document is hidden; before the first user gesture (browsers block audio until then, so the engine unlocks the AudioContext on the first pointerdown, keydown or touchstart and stays silent until then); when `sounds.enabled` is false.
- Volume: master gain from the user setting (default 0.35), further scaled down by a safety ceiling in code so even volume 1.0 stays comfortable. Fade out and stop immediately when the setting is turned off.
- Haptics: if `sounds.haptics` is on and `navigator.vibrate` exists, a 4 ms vibration on carousel snap on touch devices. Feature-detect, no errors elsewhere.
- Settings (added in Settings under "Sound and haptics", also reachable from Appearance): enable switch, volume slider with a test button that plays a tick, "Tick when hovering cards", "Tick while scrolling rows", "Haptics on touch devices".
- First-run notice: the first time a tick would play, show one small, dismissible, non-blocking toast "Interface sounds are on. You can change this in Settings." Store that it was shown.
- Respect the system: do not play sounds if the user agent signals reduced motion AND the user has not explicitly enabled sounds; an explicit user choice wins.
- Cost: audio context created lazily, oscillator nodes created per tick and disposed on end, no accumulating nodes, no memory growth. A test fires 10 000 ticks and asserts bounded node counts.

## B.6 Tests

- Unit: rate limiter, pitch mapping, engine never plays while disabled, before unlock, or when a video is playing (mocked), volume ceiling.
- Component: card lift classes and tokens across motion levels, banner timing (450 ms intent, 150 ms grace), banner viewport clamping at all four edges, only one banner at a time, Escape behavior, no banner on touch.
- E2E: hover a card then see the banner within 600 ms, move across 5 cards and observe 5 ambient focus calls (spy), scroll a row and observe bounded tick counts, watch page produces no ticks, sound setting persists after reload.
- Layout shift test: hovering across a row produces zero cumulative layout shift.
- Regression: the existing card click, keyboard navigation, My List button on cards, and detail modal opening all behave as before.

## B.7 Phase gate

- Flags OFF: zero regression differences against the U1 baseline.
- Flags ON: all checks pass, lift and banner work in every card variant (poster, wide, minimal) and every motion level, rows never clip the lift or glow.
- Manual sound checklist completed (because audio cannot be asserted from screenshots): ticks audible and pleasant on hover and scroll, silent on the watch page, silent when disabled, no ticks before the first click, no stacking or crackling when sweeping quickly.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 11. Workstream C: Navigation restructure

~~~text
WORKSTREAM C: NAVIGATION RESTRUCTURE

Goal: a centred top category navigation (Movies, TV Series, Anime), a bottom navigation (Home, Search, My List, Profile, Settings), and nothing in the top right corner. Everything else about navigation stays as it is.

Branch: `feat/c-navigation`. Flags: `categoryNav`, `newBottomNav`. With both OFF the old navigation is untouched.

## C.0 Plan first

Using the U1 route map and screenshots, list every element currently in the header, top right area, and bottom navigation. Show exactly what is kept, moved, replaced, or removed. Wait for approval. Keep the current bottom navigation visual style, icon set, spacing, active-state style, and behavior ("keep the navigation bar in below as it is"). Only its items change.

## C.1 Top navigation: centred category pill

- Position: horizontally centred at the top of the page (`position: fixed; top: var(--space-4); left: 50%; transform: translateX(-50%)`), in the `--z-top-nav` layer. Respect the safe-area inset on phones.
- Items, in this order, and nothing else: Movies, TV Series, Anime.
- Visual: a floating glass pill using existing surface and blur tokens. Compact so it never covers important content, readable over any ambient frame (use the scrim rules from A.8).
- Active state: the current category is highlighted with a sliding indicator (shared layout animation at standard and expressive, a simple fade at minimal, instant when off). On Home and non-category pages no item is active.
- Behavior: each item is a link (`/movies`, `/series`, `/anime`). The route `/tv-series` redirects to `/series`. Keyboard: arrow keys move between the three items when focus is inside the pill. Clear focus ring.
- Scroll behavior: the pill stays fixed. It may slightly reduce its padding after scrolling past 80 px (transform only).
- Visibility: shown on all viewer routes except the watch page, auth screens, and the admin area. On those it is not rendered.
- If a logo or wordmark already exists at the top left, keep it exactly where and how it is. Do not add anything else to the header: no search icon, no notification icon, no appearance icon, no profile control.
- The old top navigation items (for example Home, Series, Movies, New and Popular, My List and search) are removed from the top when the flag is ON. Their destinations are not lost: Home, Search and My List live in the bottom navigation, and "New and Popular" content becomes rows on Home (keep the route working and redirect it to Home with the relevant row focused, so old links do not break).
- The appearance quick-access drawer (palette icon) moves into Settings. Keep its keyboard shortcut working.

## C.2 Remove the top-right profile

- Remove the profile avatar and menu from the top-right corner when `categoryNav` is ON. Its functions are covered: Profile and Settings in the bottom navigation, logout in Settings.
- Search for every usage of the top-right component and remove its imports so no dead code or hidden listeners remain. Do not delete the component file until the final cleanup step (flag-off behavior still needs it).

## C.3 Bottom navigation items

- Items, in this order: Home, Search, My List, Profile, Settings. Five items.
- Admin is removed from the bottom navigation. Replace it with Settings (gear icon from the existing icon set).
- Search: pressing it opens the Search card (Workstream F). Until F lands, keep it navigating to the existing search page. The item shows its active state while the card is open or on a search results route.
- My List: `/my-list`. Profile: `/profile`. Settings: `/settings`. Home: `/`.
- Visible on all breakpoints, as it currently is. If the current desktop experience has no bottom bar, ask before adding one (stop condition). If it does, keep its form factor (full-width bar or floating dock).
- Active item indicator animation follows the motion levels already used elsewhere.
- Hidden on: watch page, auth screens, admin area (admin has its own shell). It must never overlap the player controls.
- Badge support: the Settings item may show a small dot only for admins when there are open reports (reuse the existing reports count if it exists, else skip).
- Content padding: pages add bottom padding equal to the bar height plus safe area (use a token) so nothing hides behind it. Verify at all widths.

## C.4 Admin access moves into Settings

- Remove any Admin entry from viewer-facing navigation.
- Admin and SUPER_ADMIN users see an "Admin console" card at the top of Settings (built in Workstream D) linking to `/admin`. The `/admin` routes, guards and shell are unchanged.
- Add the keyboard shortcut `g a` (admins only) to open the admin console. Update the shortcuts help dialog.

## C.5 Category pages

Create `/movies`, `/series` and `/anime` browse pages using the existing browse page component (do not fork it):
- Pass a `category` filter. The API list endpoint accepts `category=MOVIE|TV_SERIES|ANIME` (added in U2 and implemented here in FULL-STACK MODE).
- Page title and meta description per category, a small category heading, existing filters (genre, year, sort), and rows by genre at the top (reusing the home row component).
- The Anime page is not special-cased in code: it is the same page with a different filter. Anime titles can be movies or series. Title detail works for both exactly as before.
- Empty states per category with a friendly message ("No anime here yet").
- Ambient focus works on these pages through the shared card component.
- Existing generic browse routes keep working (redirect or alias), so no link or bookmark breaks.

## C.6 Tests

- Component: top pill renders exactly three items, route highlighting, arrow key navigation, hidden on excluded routes; bottom bar renders exactly five items in order and none is Admin; no top-right profile control exists with the flag ON; with flags OFF the old navigation renders unchanged (snapshot).
- E2E: click each category, redirects (`/tv-series`, old "New and Popular" route), Settings reachable from the bottom bar, an admin sees the Admin console card and a normal user does not and gets 403 on `/admin`, pages have no content hidden behind the bottom bar at 360 px and 1280 px.
- Accessibility: landmarks (a nav for the category pill and a nav for the bottom bar, each with an accessible label), focus order, skip link still first.
- Regression: every route in the U1 route map still resolves.

## C.7 Phase gate

- Flags OFF: zero regression differences against the U1 baseline.
- Flags ON: the new layout works at 360, 768, 1280 and 1920 px, with screenshots. Nothing overlaps content or the player.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 12. Workstream D: Settings

Run this AFTER Workstream E (it depends on the single-profile model).

~~~text
WORKSTREAM D: SETTINGS PAGE

Goal: a Settings area (bottom navigation item) where a user changes their password safely, customizes My List, manages Continue Watching, adjusts appearance and sound, and logs out. Admins also get a link to the admin console.

Branch: `feat/d-settings`. Flag: `settingsPage`. With the flag OFF, the old account or settings screens (whatever exists today) are untouched.

## D.0 Plan first

Using the U1 inventory, list every existing account, profile, appearance and settings screen and control. State which existing pieces you will REUSE inside the new Settings (for example the Phase 2 appearance panel) and which are new. Do not rebuild the appearance panel: mount it as a section. Wait for approval.

## D.1 Layout

- Route `/settings`, with sub-routes per section so each is linkable: `/settings/account`, `/settings/security`, `/settings/my-list`, `/settings/continue-watching`, `/settings/appearance`, `/settings/sound`, `/settings/content`.
- Desktop: two columns, section list on the left, content on the right. Mobile: a list of sections, each drilling into its own screen with a back button.
- Top of the page: for ADMIN and SUPER_ADMIN only, an "Admin console" card linking to `/admin` with a short description. Normal users never see it, and the route guard still enforces access on the server.
- Bottom of the page: a clearly separated "Log out" section (see D.8).
- Uses the same glass surfaces, tokens and ambient background as everything else. No bright backgrounds.
- Settings sections list (in order): Account, Security, My List, Continue Watching, Appearance, Sound and haptics, Content, then Log out.

## D.2 Account section

- Shows email (read only), username, display name (editable), avatar (choose from the existing avatar set, or upload if the app already supports it).
- One profile per account: there is no profile list here. The single profile's name and avatar are the account's display name and avatar.
- Save with inline validation and a success toast. Changes are audited only if the app already audits account edits (do not add new auditing for ordinary edits).

## D.3 Security: change password with email OTP

Flow (a stepper with 4 steps; each step is a separate, clearly labelled screen state):

Step 1: Confirm identity
- Field: current password (with show and hide toggle).
- Button: "Send verification code". The server validates the current password, then emails a one-time code to the account email.
- The UI always says "If your password is correct, a code has been sent to a***@example.com" (masked email) so it does not leak which part failed beyond what is necessary. A wrong current password shows a clear inline error ("That password is not correct") because the user is already authenticated; do NOT reveal anything else.

Step 2: Enter the code
- {{OTP_LENGTH}}-digit code input (one box per digit, auto-advance, paste support, numeric keypad on mobile, `autocomplete="one-time-code"`).
- Shows a countdown for expiry ({{OTP_TTL_MINUTES}} minutes) and a "Resend code" button with a 60 second cooldown. A "Wrong email? Contact support" hint is optional text only.
- Errors: wrong code shows remaining attempts. After 5 failed attempts the challenge is locked and the user must restart from step 1 after a cooldown.

Step 3: Choose a new password
- Fields: new password and confirm password, show and hide toggles, caps lock warning.
- The strength meter (D.4) and the suggestion panel (D.5) live here.
- Submit enabled only when: confirmation matches, minimum strength reached, and the rules checklist passes.

Step 4: Done
- Success state, with the message that other devices were signed out, and a button back to Settings.

Server rules (FULL-STACK MODE) in new endpoints beside the auth code, not inside it:
- `POST /api/account/password/otp/request` (auth required): body `{ currentPassword }`. Verify the current password with the existing argon2 verification function. Create an `OtpChallenge`. Generate the code with `crypto.randomInt`, uniformly random, {{OTP_LENGTH}} digits. Store ONLY a salted hash (HMAC with a server pepper). Never log the code. Expiry {{OTP_TTL_MINUTES}} minutes. Send the email through the existing mailer abstraction (plain accessible HTML plus a text version, includes the time, approximate device and a "this wasn't me" instruction).
- Rate limits: 1 request per 60 seconds per user, 5 per hour per user, 10 per hour per IP. Return 429 with `Retry-After`.
- `POST /api/account/password/otp/verify` (auth required): body `{ code }`. Constant-time compare of hashes. Increment attempts on failure, lock at `maxAttempts`. On success mark consumed and return a one-time `changeToken` (32 random bytes, stored hashed in `PasswordChangeGrant`, valid for 10 minutes, single use).
- `POST /api/account/password/change` (auth required): body `{ changeToken, newPassword }`. Validate the grant, then validate the new password server-side with the SAME rules as the client (length at least 12 for new passwords, strength score at least 3 using the same library and version as the client, not equal to the current password, not containing the username or the email local part, not in the common-password list). Hash with argon2id using the existing parameters. In one transaction: update the hash, mark the grant used, revoke all other sessions (keep the current session), invalidate other refresh tokens, and clear `mustChangePassword`. Send a "Your password was changed" email. Write an audit log entry `PASSWORD_CHANGED` WITHOUT any password or code values.
- Do not weaken or touch the existing forgot-password and login flows. Do not change cookie or token logic.
- Admin-created accounts with `mustChangePassword = true` are redirected to this flow on first login (skipping step 1's current-password check only for that case, but still requiring the OTP).

In FRONTEND-ONLY MODE: implement the same flow against mock endpoints that accept the code `123456` in development and document the real contract in `docs/backend-requirements.md`.

## D.4 Strength meter with colour gradient

Requirements:
- A horizontal meter under the new password field. The track is a full-width gradient from red to orange to green: `linear-gradient(90deg, #FF4D4F 0%, #FFA940 50%, #3DD68C 100%)` (take the three colours from tokens `--c-danger`, `--c-warning`, `--c-success` so themes can adjust them). The filled portion is revealed by clipping the track to the strength percentage, so the colour at the end of the fill always matches the strength: red when weak, orange when fair, green when strong. The fill animates smoothly with `transform: scaleX` or `clip-path` (transform or clip only, no width animation), and is instant when motion is off.
- 5 levels from the strength score: 0 Very weak (fill 12 percent), 1 Weak (30), 2 Fair (55), 3 Good (80), 4 Strong (100).
- Accessible: `role="meter"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext` ("Strong"), plus a visible text label and an icon, so colour is never the only signal. Announce level changes politely, debounced, in a live region.
- Compute the score with `zxcvbn-ts` (core plus the English and common packages), loaded lazily only on this screen, debounced by 120 ms. Pass the username, email local part and display name as user inputs so passwords containing them score lower. The same library version runs on the server for validation.
- Rules checklist beside the meter, each row with an icon and text: at least 12 characters, mixes upper and lower case, includes a number, includes a symbol, not a common password, does not contain your name or email. Rows update live.
- Plain-language improvement tips from zxcvbn feedback, translated into short friendly copy ("Add another word or two", "Avoid dates and years"). No jargon.
- Nothing about the typed password is ever sent anywhere except the final change request. No analytics, no logging, no autosave. Disable browser spellcheck and autocapitalize on the field.

## D.5 Strong password suggestions

- A "Suggest a strong password" button opens a small panel with 3 generated options, each showing the text (masked by default with a reveal toggle), a strength badge, and two buttons: "Use this" (fills both password fields) and "Copy".
  1. Passphrase: 4 random words from a short word list (the EFF short wordlist, about 1300 words, lazy-loaded) joined with a separator, plus a number and a symbol.
  2. Random: 16 characters mixed from letters, digits and symbols, excluding look-alike characters (O, 0, l, 1, I).
  3. Pronounceable: alternating consonant and vowel pattern of about 14 characters with digits and a symbol.
- Generation uses `crypto.getRandomValues` with rejection sampling to avoid modulo bias. Never use `Math.random`.
- Every suggestion must score 4 (Strong) with the same zxcvbn check, otherwise regenerate silently.
- A "Generate new options" button, a note: "Save it in a password manager. We cannot recover it." Fields use `autocomplete="new-password"`.
- Suggestions are generated in the browser only. They are never sent to the server until the user submits the change.

## D.6 Customize My List

Route `/settings/my-list` (and linked from the Profile page card). Built on the existing My List data and component(s). Do not fork the My List card.
- Header: count, a view toggle (grid or list), sort menu (Manual, Recently added, A to Z, Release year, Category), filter chips for Movies, TV Series, Anime.
- Manual ordering: drag to reorder with a visible drag handle, using an accessible drag-and-drop library (keyboard: space to pick up, arrow keys to move, space to drop, Escape to cancel, with live region announcements). Order persists through `PUT /api/watchlist/order` (full ordered list of title ids) and the `sortOrder` column. Optimistic update with rollback on error.
- Selection mode: checkboxes, bulk "Remove selected" with a confirmation, "Select all", "Cancel".
- Per-item menu: Move to top, Remove, Open title.
- "Clear My List": a bin icon button in the header, confirmation dialog stating how many titles will be removed ("This removes 23 titles. This can't be undone."), then `DELETE /api/watchlist`. A toast confirms and an empty state appears.
- Unpublished titles still on the list appear greyed with "No longer available" and a remove action (as already specified in the original pack).
- View and sort choices are stored in the appearance preferences (`myList.view`, `myList.sort`) so they sync.
- Changing the order must not change what the Home My List row or the My List page show, other than the order: those use `sortOrder` when sort is Manual.

## D.7 Manage Continue Watching

Route `/settings/continue-watching`.
- List of unfinished items (movies, and the in-progress episode per series) with thumbnail, title, episode label, progress bar, last watched time.
- Actions per item: Resume, Remove from Continue Watching (sets `hiddenFromContinue`, keeps the progress data so resuming from the title page still offers "Resume"), Mark as watched (sets completed and `watchedAt`), Start over (resets progress to zero).
- "Clear Continue Watching" button with a bin icon: hides all items with a confirmation.
- The Home Continue Watching row and the player's resume prompt keep working exactly as before. A hidden item reappears automatically if the user watches it again (the player sets `hiddenFromContinue` back to false when progress is saved).
- Endpoints: `DELETE /api/progress/continue/:mediaAssetId`, `DELETE /api/progress/continue`, `POST /api/progress/:mediaAssetId/mark-watched`, `POST /api/progress/:mediaAssetId/reset`.

## D.8 Appearance, Sound, Content, Log out

- Appearance: mount the existing Phase 2 appearance panel as is, plus the new Background group from Workstream A. The palette quick drawer removed from the header opens this section.
- Sound and haptics: the controls from Workstream B.
- Content: maturity limit and "kids mode" (moved from the old profile settings), autoplay next episode, autoplay previews, subtitle defaults. Reuse the existing controls.
- Log out: a "Log out" button (outlined, danger styling from tokens) with a short confirmation dialog, then calls the existing logout flow and returns to the sign-in screen. A secondary link "Log out of all devices" calls the existing logout-all flow. Neither flow's internals change.

## D.9 Tests

- Unit: OTP generation and verification logic (expiry, attempts, lockout, single use), password rules, strength mapping, generator distribution (uniformity test over many samples), password validators identical on client and server.
- API integration (FULL-STACK MODE): OTP request rate limits, wrong current password, correct and wrong codes, locked challenge, expired challenge, grant single use, session revocation after change, email sending (captured by the dev mailer), audit entry has no secrets, existing login and forgot-password tests untouched and green.
- Component: stepper states, 6-box code input (paste, backspace, auto-advance), meter ARIA attributes and fill for each level, suggestions panel, My List drag reorder with keyboard, bulk removal, clear dialogs, Continue Watching actions.
- E2E: complete password change with the dev mailer, old password stops working, other session is signed out, new password works; reorder My List then reload and see the order; hide a Continue Watching item then watch it again and see it return; admin sees the Admin console card.
- Accessibility: axe on every settings screen, keyboard-only pass through the password flow.

## D.10 Phase gate

Flag OFF: zero regression differences. Flag ON: all flows work, screenshots at 360, 768, 1280 and 1920 px. Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 13. Workstream E: Profile page and single profile per account

~~~text
WORKSTREAM E: PROFILE PAGE AND SINGLE PROFILE PER ACCOUNT

Goal: each account has exactly one profile. The Profile page (bottom navigation) shows the user, their stats, and three categories (My List, Search history, Watched list), each with a bin icon to clear it. All multi-profile UI disappears.

Branch: `feat/e-profile`. Flags: `singleProfile`, `profilePage`. With flags OFF, the old profile behavior stays.

## E.0 Plan first

Using the U1 data facts and dependency map, list every place that uses `profileId`, a profile picker, a profile switcher, or the active-profile store. Show how each will keep working with one profile. Wait for approval. Rule: the `profileId` plumbing stays (it keeps everything working). Only the user-facing choosing and switching goes away.

## E.1 Backend and data (FULL-STACK MODE)

1. Run the dry run of `scripts/migrate-single-profile.ts` from U2 against a copy of the development database and show me the report. Do NOT apply it to anything without my explicit approval and a confirmed backup.
2. After the migration is applied (manual step, documented in `docs/single-profile-migration.md` with the exact commands, a backup step, a verification query list, and a rollback path using `ProfileArchive`), apply the separate unique-constraint migration on `Profile.userId`.
3. Registration creates the single profile automatically with the display name equal to the username (editable in Settings). Existing users who somehow have no profile get one lazily on first authenticated request, in a transaction.
4. `POST /api/profiles` returns 409 `PROFILE_LIMIT`. `GET /api/profiles` returns exactly one profile (deprecated, kept for compatibility). `DELETE /api/profiles/:id` returns 409 `PROFILE_REQUIRED`.
5. New convenience endpoints: `GET /api/me/profile`, `PATCH /api/me/profile` (display name, avatar, maturity limit, kids mode, language, subtitle and autoplay settings), `GET /api/me/stats` (titles watched count, total hours watched rounded, My List size, reviews written, member since).
6. The active profile id is resolved server-side from the authenticated user, so clients no longer need to send it. Endpoints that accept `profileId` keep accepting it, but verify it equals the user's single profile.

In FRONTEND-ONLY MODE: change the mock API and the client store to always use one profile, keep `profileId` in the data shapes.

## E.2 Frontend: remove multi-profile UI

When `singleProfile` is ON:
- Remove the "Who is watching" profile picker screen from the flow: after sign in, go straight to Home (or the page the user came from).
- Remove profile switching UI, "Add profile", "Manage profiles", and "Kids profile" creation. Keep the route paths working by redirecting `/profiles` and `/profiles/manage` to `/profile`.
- The active profile store (or hook) keeps its API but always resolves to the single profile and never prompts.
- Appearance preferences and everything keyed by profile keep working through that single profile.
- Search the codebase for every reference to the removed screens and clean imports. Keep the component files until final cleanup.

## E.3 Profile page

Route `/profile` (bottom navigation). Layout on the ambient background, glass surfaces.

Header:
- Avatar, display name, email, "Member since" date, and an "Edit" button that goes to `/settings/account`.
- Stats row: titles watched, hours watched, My List size, reviews written.

Three category cards. Each card has: a title, a count, a short preview, a "View all" link, and a BIN ICON BUTTON in the card's top right corner that clears that category.
1. My List: preview of up to 6 thumbnails. "View all" goes to `/my-list`. A "Customize" link goes to `/settings/my-list`. Bin clears the whole My List (`DELETE /api/watchlist`).
2. Search history: the last 5 searches, each with a cross to remove it individually. "View all" opens the Search card. Bin clears all search history (`DELETE /api/search/history`).
3. Watched list: preview of up to 6 recently finished titles with watched date. "View all" goes to `/profile/watched` (a simple grid, newest first, with a cross on each to remove an item). Bin clears the whole watched list (`DELETE /api/history/watched`).

Behavior of the bin icon buttons:
- Each opens a confirmation dialog naming the category and the count ("Clear search history? This removes 14 searches. This can't be undone."), with Cancel and a danger "Clear" button. Focus starts on Cancel.
- After success: toast, the card shows its empty state with a friendly line and a link ("Browse titles", "Start searching"), counts update everywhere (Home My List row, Search card, stats) through TanStack Query invalidation.
- Disabled bin button when the category is already empty, with a tooltip.
- Each bin button has an accessible name like "Clear My List" (never just "Delete").
- Clearing My List or search history never touches watch progress or the watched list. Clearing the watched list never touches Continue Watching items that are still in progress and never touches My List.

Definition of "Watched list" (server): rows of `WatchProgress` where `completed = true`, ordered by `watchedAt` descending, and nothing else. Clearing it: delete those `WatchProgress` rows where `completed = true` and delete the matching `WatchEvent` rows for the profile. In-progress rows (`completed = false`) are never touched. Document this exact rule in `docs/api.md`.

## E.4 Tests

- Backend: single-profile constraint, lazy creation, 409 behaviors, `profileId` mismatch rejected, stats query, each clear endpoint affects only its category (a test that seeds all categories, clears one, and asserts the others are untouched), the migration script on a fixture database (merge rules, idempotency, archive contents, dry run changes nothing).
- Frontend: profile page cards, confirmation dialogs, empty states, query invalidation, no profile picker anywhere, old routes redirect.
- E2E: sign in goes straight to Home, `/profiles` redirects to `/profile`, clear each category and verify counts across the app, other categories intact.
- Regression: watching, progress saving, My List add and remove, ratings and appearance sync all behave as before.

## E.5 Phase gate

Flags OFF: zero regression differences. Flags ON: single profile everywhere, no leftover multi-profile UI. Migration dry-run report attached. Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 14. Workstream F: Search card

~~~text
WORKSTREAM F: SEARCH CARD

Goal: pressing Search in the bottom navigation opens a Search card that shows recent searches (each removable with a cross, plus clear all), similar-search suggestions while typing, and quick results. The existing search results page keeps working.

Branch: `feat/f-search-card`. Flag: `searchCard`. With the flag OFF, Search behaves as before.

## F.0 Plan first

List the existing search UI, API client, and results page, and what imports them. The Search card is a NEW overlay component that reuses the existing search API and result card. Do not rewrite the results page. Wait for approval.

## F.1 The card (UI)

- Opens from the Search item in the bottom navigation, from the `/` shortcut, and from "View all" on the Profile page's search history. The nav item shows its active state while the card is open.
- Desktop: a centred glass card (about 640 px wide, max 80 percent of viewport height) over a dimmed scrim, in the `--z-modal` layer. Mobile: a full-height sheet sliding up from the bottom, with the input at the top and the bottom navigation hidden while open (restore on close).
- Close: Escape, scrim click, close button, or the browser back button (the card has its own history entry, so back closes it instead of leaving the page).
- Focus: the input is focused on open. Focus is trapped inside the card. On close, focus returns to the element that opened it.
- Built on the ambient background: hovering or arrowing onto a result calls `useAmbientFocus` with that title's palette.

Sections, top to bottom:
1. Search input: search icon, text field, a clear button (x) when there is text, and a submit action (Enter).
2. When the input is EMPTY:
   a. "Recent searches" with a header row containing a "Clear all" bin icon button. Each recent search row has a clock icon, the text, and a CROSS icon button at the END of the row that removes only that entry. Clicking the row runs that search. Show up to 8 recent searches, with a "Show more" to see up to 20.
   b. "Trending searches": up to 6 popular queries (server aggregated and anonymized, only queries searched by at least 5 different users in the last 7 days; hidden if the endpoint returns nothing).
   c. Empty state when there is no history: a friendly line and the trending list.
3. When the user is TYPING (debounced 150 ms):
   a. "Similar searches": up to 6 suggestions, each with an icon by type (title, genre, person, related). Includes prefix matches on titles, genre names, cast names, typo corrections ("Did you mean ..."), and "related to your recent searches" (queries that share genres with the user's history).
   b. "Top results": up to 6 mini result cards (poster, title, year, category) with a "See all results for 'query'" row that goes to `/search?q=`.
   c. Matching text is highlighted.
   d. No results: a friendly message with suggestions of similar searches and browse links (categories).
4. Footer hint (desktop only): keyboard hints (arrows to move, Enter to open, Esc to close, Shift+Delete to remove a recent search).

Keyboard and accessibility:
- ARIA combobox pattern: input with `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; list with `role="listbox"`, options with `role="option"`.
- Arrow keys move through recent searches, suggestions and results as one list. Enter activates. Shift+Delete (or Delete on Mac with modifiers as appropriate) removes the highlighted recent search. Cross buttons are also separately focusable with Tab and have accessible names ("Remove 'dark knight' from recent searches").
- Live region announces result counts and removals.
- Respects motion levels: the card opens with scale and fade (standard), spring (expressive), fade (minimal), instant (off). List items stagger at standard and above (capped at 8 items).

## F.2 Behavior rules

- A search is saved to history only when the user submits it (Enter, clicking a suggestion or a result, or clicking a recent search), not on every keystroke. Minimum 2 characters. Maximum 80. Collapse whitespace, trim, ignore queries that are only symbols.
- History is per account, deduplicated case-insensitively (the existing entry moves to the top and its count increases), capped at 50 (oldest removed), retained 180 days.
- Removing an entry with the cross is immediate and optimistic, with an undo toast for 5 seconds. "Clear all" asks for confirmation with the count and has no undo.
- Never store history in a way that other users can read. History is deleted when the account is deleted.
- Maturity limits and unpublished titles are respected exactly as in the existing search endpoints (reuse them, do not duplicate logic).
- The existing recent-searches-in-localStorage logic from the earlier version (if present) is migrated: on first load with the flag ON, push local entries to the server once, then stop using localStorage for history. Do not lose the user's existing history.
- Typing indicators and loading states: show 3 skeleton rows after 200 ms, never flash empty states while loading.
- Offline: show recent searches from cache, disable suggestions with a quiet "You're offline" line.

## F.3 Backend (FULL-STACK MODE)

- `GET /api/search/history` (auth): newest first, limit 20, returns `{ id, query, lastSearchedAt }`.
- `POST /api/search/history` (auth): body `{ query }`, validated, upserts, enforces the cap.
- `DELETE /api/search/history/:id` (auth): removes one, only if it belongs to the user.
- `DELETE /api/search/history` (auth): removes all of the user's history.
- `GET /api/search/similar?q=` (auth): up to 6 suggestions of types HISTORY-RELATED, TITLE, GENRE, PERSON, TYPO. Use the existing Postgres full-text and trigram setup. Target response under 60 ms. Cache per normalized query for 60 seconds, but never cache the history-related part across users.
- `GET /api/search/trending` (auth): aggregated, anonymized, thresholded as described. Cache 10 minutes.
- Rate limits: suggestions moderate, history writes moderate, clear endpoints modest.
- Existing `GET /api/search` and `GET /api/search/suggest` stay exactly as they are.

## F.4 Tests

- Backend: history upsert and cap, normalization and dedupe, ownership checks on delete, clear-all only affects the caller, retention cleanup, suggestions ranking fixtures (prefix, typo, genre, person, history-related), trending threshold (no output below 5 distinct users), existing search endpoint tests untouched.
- Component: empty state, recent list with crosses and clear all, keyboard navigation and removal, combobox ARIA, highlighting, offline state, focus trap and return, back button closes the card.
- E2E: open from the bottom nav, search twice, see both in recents, remove one with the cross, clear all with confirmation, type a typo and get a correction, hover a result and see the ambient focus change, the profile page search history card matches the Search card.
- Regression: the results page `/search?q=`, existing filters and result cards behave as before.

## F.5 Phase gate

Flag OFF: zero regression differences. Flag ON: everything works at all widths with screenshots. Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 15. Workstream G: Reviews

~~~text
WORKSTREAM G: REVIEWS

Goal: signed-in users can write one review per title (star rating plus text). Reviews appear on the title page and are moderated by admins. Users with an active REVIEW_BLOCK cannot write or edit reviews. The existing thumbs-up and thumbs-down ratings stay exactly as they are.

Branch: `feat/g-reviews`. Flag: `reviews`. With the flag OFF, title pages look and behave exactly as before.

## G.0 Plan first

List the title detail components (modal and page) and where a Reviews section fits without changing their existing layout and tab or section order for other content. Reviews is a NEW section placed after "More like this" or in a new tab if the page already uses tabs. Wait for approval.

## G.1 Reviews section on the title page

- Summary: average star rating (to one decimal), review count, and a distribution bar (5 to 1 stars). Computed from VISIBLE user reviews only (editorial reviews are shown separately and do not count toward the average).
- Controls: sort (Newest, Top rated, Lowest rated), filter by stars, a "Hide spoilers" toggle (default on, spoiler reviews collapsed behind "Show spoiler review").
- List: author display name and avatar, stars, date ("edited" badge when edited), body, a spoiler tag, and actions: Report (for other users' reviews), Edit and Delete (for the user's own review). Pinned and editorial reviews appear first with a label ("Editor's pick" or the admin-chosen label).
- Pagination with "Load more" (cursor based), 10 per page.
- Write form (signed-in users): star input (keyboard and screen reader friendly, radio group semantics), text area with live character count (10 to 1500), spoiler checkbox, Submit. One review per title: if the user already reviewed, show their review with Edit and Delete instead of the form.
- Validation: Zod shared schemas, clear inline errors, double-submit prevention, optimistic insert with rollback on failure.
- Reporting: "Report" opens a small dialog (reason: Spam, Abuse or hate, Spoiler not marked, Off topic, Other, plus optional details). One report per user per review. Confirmation toast.
- Restricted users: if the user has an active REVIEW_BLOCK, replace the form with a notice: "You can't post reviews right now." with the reason and the end date (or "until further notice"). They can still read reviews. Existing reviews by that user remain unless an admin removes them.
- Empty state: "Be the first to review this title."
- The section uses existing tokens and surfaces, and the ambient palette of the title remains focused while the title page is open.

## G.2 My reviews

- On the Profile page stats row, "Reviews written" links to `/profile/reviews`, a simple list of the user's reviews with Edit and Delete. Keep this page minimal.

## G.3 Backend (FULL-STACK MODE)

- `GET /api/titles/:slug/reviews` (auth): list with cursor pagination, sort and filter, summary included. Respects maturity limits through the title lookup. Hides HIDDEN and REMOVED reviews from everyone except the author (the author sees their own HIDDEN review with a "Hidden by moderators" note, never REMOVED).
- `POST /api/titles/:slug/reviews` (auth): creates a review. Checks: title is published and visible to the user, no existing user review (409 `REVIEW_EXISTS`), no active REVIEW_BLOCK (403 `REVIEW_RESTRICTED` with reason and expiry), rate limit (5 reviews per hour per user), body sanitized (strip HTML, collapse excessive whitespace, reject links to non-allowlisted patterns or limit to 1 link, light profanity filter that flags rather than blocks), min and max lengths.
- `PATCH /api/reviews/:id` (auth, owner): edit within the same checks (including REVIEW_BLOCK), sets `editedAt`.
- `DELETE /api/reviews/:id` (auth, owner): removes (hard delete for the owner's own review).
- `POST /api/reviews/:id/report` (auth): creates a `ReviewReport`, rate limited, cannot report own review.
- `GET /api/me/reviews` (auth).
- Output sanitization: reviews are returned as plain text and rendered as text only on the frontend (no HTML, no markdown) to avoid injection. Escape on render, never use `dangerouslySetInnerHTML`.
- Denormalize `reviewCount` and `ratingAverage` on `Title` (additive columns added in a G-specific migration) and update them transactionally on create, update, delete, hide and restore, with a repair script that recomputes from source.

## G.4 Tests

- Backend: one review per user per title, restriction enforcement (blocked user cannot create or edit, can read), sanitization cases, aggregate maintenance after each moderation action, hidden review visibility rules, rate limits, report uniqueness.
- Frontend: star input accessibility, character counter, spoiler collapse, restricted notice, optimistic create with rollback, no HTML injection (render a review body containing script and HTML tags and assert it appears as plain text).
- E2E: write, edit, delete, report; blocked user sees the notice; reviews do not appear for unpublished titles.
- Regression: thumbs ratings still work and are unaffected; title page sections that existed before are unchanged.

## G.5 Phase gate

Flag OFF: zero regression differences. Flag ON: all checks pass with screenshots. Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 16. Workstream H: Admin upgrades

~~~text
WORKSTREAM H: ADMIN UPGRADES

Goal: the admin can fully customize every title (description, torrent or magnet, thumbnail, hover banner, ambient colours, reviews, subtitles), create users, permanently delete users, and ban users from watching or from reviewing. The admin shell uses the same live background.

Branch: `feat/h-admin`. Flags: `adminUserTools` (user creation, deletion, restrictions), `hoverBanner` (hover banner fields in the admin), `ambientBackground` (admin parity), `reviews` (review moderation). Each part is independently switchable. With flags OFF, the admin area is exactly as before.

Order inside this workstream: H.1 title editing, H.2 reviews moderation, H.3 users. Commit and run regression after each part.

## H.0 Plan first

List every admin screen and API route that will change, and what imports each. Admin routes stay under `/admin` with the same guards and shell. No new top-level admin navigation entries except those listed here (Reviews). Wait for approval.

## H.1 Full title editing

An "Edit title" screen reachable from the Titles list, the title detail (for admins) and the wizard. It reuses the existing wizard steps as tabs and adds new ones, so an admin can change anything about a title at any time, published or not.

Tabs:
1. Details: name, original name, slug (changing a published title's slug creates a redirect from the old slug so links never break), tagline, synopsis, release year, runtime, maturity rating, language, country, genres, cast and crew, content warnings. NEW: Category selector (Movie, TV Series, Anime) with the rule from U2.1 enforced and explained ("Anime can be a movie or a series. Structure comes from the type.").
2. Artwork:
   - Thumbnail (card art, 2:3): upload with the existing cropper, focal point, minimum resolution check, auto-generated responsive variants and blur placeholder.
   - Backdrop (16:9) and logo: as before.
   - HOVER BANNER (16:9, at least 1280 by 720): upload with crop and focal point, text field for the one-line hover tagline (max 120 characters, live counter), and a "Preview as pop-up" button that opens the real hover banner component with the current draft data, over the ambient background, at the real size. Falls back to backdrop when empty (shown in the UI as "Using backdrop").
   - Optional HOVER CLIP: upload an MP4 or WebM up to 15 seconds and 8 MB. The server validates with ffprobe (duration, codecs, no audio required), re-encodes to a muted, 720p, web-friendly H.264 MP4 plus a poster frame via an FFmpeg job (existing job system), and shows progress in the job tray. Delete clip button. Never autoplay with sound.
   - Palette: shows the 3 extracted colours (AUTO) with swatches, a "Re-extract from thumbnail" button, and manual override with three colour pickers (switches the source to MANUAL, with a "Back to automatic" button). A live preview panel renders a small ambient background and a card glow using the draft palette, and "Preview in app" calls the real ambient focus so the admin sees the actual background change while editing. Colours are sanitized to work on black (the same normalisation as A.6) with a visible note if a colour was adjusted.
3. Media (torrent or magnet):
   - Shows the current torrent(s): name, infohash, size, status, health, mapped files.
   - "Replace torrent or magnet": upload a new `.torrent` or paste a magnet link, parse it, then map files using the existing mapper, keeping existing `MediaAsset` ids stable where the mapped file corresponds to the same episode or movie, so watch progress, subtitles and My List are not lost. Before applying, show an impact preview: which episodes change, which lose their file, which are new. Require confirmation. The old torrent is only removed after the new mapping is saved and probed successfully. If the new torrent is blocklisted or fails probing, nothing changes.
   - "Add another torrent" for additional seasons, as before. "Edit trackers", "Health check" and "Pre-cache" reuse the existing actions.
   - Safe by default: no change to the streaming engine. Only the existing admin endpoints are called.
4. Seasons and episodes (series): the existing manager as a tab.
5. Subtitles: list all subtitles for each media asset with language, label, default and forced flags, sync offset, source (upload or torrent). Actions: upload new, replace file, edit label or language, set default, shift timing, preview with a player, delete. The conversion rules (to WebVTT) are unchanged.
6. Reviews (see H.2) for this title.
7. Rights and publishing: the existing rights, attestation and publish controls, unchanged.

Edit behavior:
- Each tab saves independently with optimistic concurrency (reuse the existing `If-Match` version check) and shows a clear unsaved-changes indicator.
- Every change writes an audit log entry with before and after values (excluding binary data).
- "Preview as viewer" opens the real title page with a signed admin preview token.
- Changing a published title never makes it disappear. A change that would make a published title invalid (for example removing its last playable file) is blocked with an explanation.

Backend (FULL-STACK MODE), all admin-only, audited, validated:
- `PATCH /api/admin/titles/:id` extended (category, hoverTagline, ambient fields) without changing existing fields.
- `POST /api/admin/titles/:id/artwork/hover-banner`, `POST /api/admin/titles/:id/artwork/hover-clip`, `DELETE` for each.
- `POST /api/admin/titles/:id/palette/extract`, `PUT /api/admin/titles/:id/palette`, `DELETE /api/admin/titles/:id/palette` (back to AUTO).
- `PUT /api/admin/titles/:id/media/replace` as described, transactional.
- Subtitle admin endpoints from the original pack stay as they are, extended only with the offset edit if missing.
- Image processing for the hover banner reuses the existing `sharp` pipeline and storage keys with content hashes.
- Palette extraction job from A.6 runs automatically after a thumbnail upload and appears in the job tray.

## H.2 Reviews moderation

- New admin screen `/admin/reviews` (sidebar item "Reviews", with an open-reports badge): table of all reviews with title, author, rating, excerpt, status, reports count, date. Filters: status, title, user, rating, has reports, editorial. Search by text.
- Row and detail actions (all audited):
  - Hide (soft, reversible, with moderation note), Restore, Remove (marks REMOVED, only visible to admins), Edit text (marks "edited by moderator" and keeps the original in the audit log), Pin or unpin.
  - Resolve or reject a report, with a note. Rejecting all reports on a review clears the badge.
  - "Restrict author from reviewing" shortcut that opens the restriction dialog from H.3 prefilled.
- Per-title Reviews tab (inside the title editor): same table filtered to that title, plus "Add editorial review": author label (for example "Editor's pick"), rating, text, pin option. Editorial reviews have `isEditorial = true`, do not count toward the average and do not require a user account.
- Bulk actions: hide or restore selected.
- Rate limits and permissions: ADMIN and SUPER_ADMIN.
- Backend: `GET /api/admin/reviews`, `PATCH /api/admin/reviews/:id` (status, pin, text, note), `DELETE /api/admin/reviews/:id` (hard delete, SUPER_ADMIN only), `POST /api/admin/titles/:id/reviews` (editorial), `GET /api/admin/review-reports`, `PATCH /api/admin/review-reports/:id`. Aggregates on `Title` updated transactionally.

## H.3 Users: create, restrict, permanently delete

Users screen additions (existing table, filters and actions stay):

### Create user
- "Create user" button opens a dialog: email, username, role (USER by default; only SUPER_ADMIN may choose ADMIN), password mode: (a) generate a temporary password shown ONCE with a copy button, or (b) send an invitation email with a link to set the password. Option "Require password change at first login" (default on; sets `mustChangePassword` and forces the OTP flow from Workstream D).
- Validation: same email and username rules as registration (case-insensitive uniqueness). Creates the single profile automatically. Email verification marked as verified when the admin creates the account (admin attests the address).
- Audit: `USER_CREATED_BY_ADMIN` with the role and creation mode, never the password.
- Backend: `POST /api/admin/users`.

### Restrictions (bans)
- User detail drawer gets a "Restrictions" panel: two independent switches, "Block watching" and "Block reviewing". Turning one on opens a dialog with: reason (required, 5 to 500 characters, shown to the user), duration (24 hours, 7 days, 30 days, custom date, permanent), and an optional internal note.
- Active restrictions list with who applied them, when, expiry, reason, and a "Lift" button (asks for an optional note). History list of past restrictions.
- Table: a small badge on users with active restrictions, and a filter "Has restrictions".
- Effects (server side, immediate):
  - WATCH_BLOCK: the watch session endpoint returns 403 `WATCH_RESTRICTED` with `{ reason, expiresAt }`. Stream, HLS, subtitle and thumbnail endpoints re-check the restriction on every request using a short in-memory or Redis cache (15 seconds) that is invalidated immediately when a restriction is created or lifted. Active streams stop within 15 seconds because the next range request fails with 403. The status stream (SSE) pushes a `restricted` event so the player can react immediately.
  - REVIEW_BLOCK: review create and edit endpoints return 403 `REVIEW_RESTRICTED` (see Workstream G).
  - Browsing, My List, search and settings keep working for restricted users.
- Viewer experience (frontend):
  - Watch page: when a session request returns `WATCH_RESTRICTED`, show a full-page, calm message in the player area ("Watching is turned off for your account", the admin's reason, the end date or "until further notice", and a button back to Home). If a restriction starts mid-playback, pause and show the same message over the player. This overlay is the ONLY change to the watch page.
  - Play, Resume and Next Episode buttons on cards, the hover banner, hero and title page become disabled with a tooltip "Watching is turned off for your account" (fetched once through the user profile endpoint's `restrictions` field, additive).
  - Review form: replaced with the notice described in Workstream G.
- Expiry: restrictions end automatically at `expiresAt`. No cron needed (computed on read), but the cleanup job may archive expired rows.
- Email: optionally send a notification email when a restriction starts and when it is lifted, controlled by a site setting (default on). Plain text, includes the reason and the end date.
- Audit: `RESTRICTION_ADDED`, `RESTRICTION_LIFTED` with type, reason, expiry.
- Backend: `GET /api/admin/users/:id/restrictions`, `POST /api/admin/users/:id/restrictions`, `DELETE /api/admin/users/:id/restrictions/:rid`. The extra hook inside stream, HLS and subtitle handlers is ONE call to a shared `assertNotRestricted(userId, 'WATCH_BLOCK')` function placed at the top of each handler. This is the only permitted change to those protected files. Show me the exact diff for approval before applying.

### Permanent deletion
- "Delete account permanently" action in the user detail drawer, in a clearly separated danger zone. Available to ADMIN and SUPER_ADMIN, with these rules enforced on the server:
  - Admins cannot delete themselves from this screen.
  - The last SUPER_ADMIN can never be deleted.
  - An ADMIN cannot delete another ADMIN or a SUPER_ADMIN. SUPER_ADMIN can delete ADMIN and USER accounts.
- Confirmation (all required): a dialog that lists exactly what will be deleted (account, sign-in data, profile and preferences, My List, watch progress and history, search history, ratings, reviews, sessions, restrictions), the user's username typed to confirm, the admin's own password re-entered, and a final "Delete permanently" danger button. A short cooldown (3 seconds) before the button activates.
- Server behavior (`DELETE /api/admin/users/:id?permanent=true` with a body containing the confirmation fields): a single transaction that revokes sessions, deletes `Session`, `EmailToken`, `OtpChallenge`, `PasswordChangeGrant`, the profile and its preferences, `WatchProgress`, `WatchEvent`, `WatchlistItem`, `Rating`, `SearchHistory`, the user's `Review` rows, `ReviewReport` rows they created (set reporter to null on others' reports where history matters), `UserRestriction`, `InviteRedemption` (keep the invite code but release the user reference), and finally the `User` row. Reports and audit entries that reference the user keep the record but lose personal data: the user reference becomes null or a hash.
- Writes a `DeletedUserTombstone` (hashes only, no personal data) and an audit entry `USER_HARD_DELETED` with the admin id and the tombstone id.
- Immediately invalidates any stream tokens: stream endpoints verify the user still exists (covered by the restriction check hook).
- Idempotent and safe on retry. A partial failure rolls back completely.
- Optional email to the user's address after deletion, controlled by a site setting (default off), sent before the data is removed.
- Soft delete from the earlier pack stays available for other flows. This action is separate, explicit and permanent.
- Backend tests: every table listed above is empty for that user afterwards (a test that seeds data in every table), other users' data untouched, rules about self, last SUPER_ADMIN, and ADMIN versus ADMIN are enforced, tombstone and audit contain no personal data, tokens stop working.

## H.4 Admin ambient background

- The admin layout mounts the same ambient layer. Content panels use stronger glass scrims, with the brightness cap from A.10.
- Hovering a title row, thumbnail, torrent row linked to a title, or review row focuses that title's palette. Selecting a title in the wizard and previewing artwork does the same. The palette editor shows a live preview.
- Audit that tables and forms remain readable on every ambient frame (the worst-case contrast test from A.8 runs against admin tokens too).
- Performance: the admin dashboard charts and the ambient canvas must both hold 55 fps. If not, the adaptive tier system lowers the ambient tier first (charts always win).

## H.5 Tests

- Admin API: role checks for every new route (anonymous, USER, ADMIN, SUPER_ADMIN), audit entries, validation matrices, concurrency conflicts, replace-torrent transactional behavior (failure leaves the old mapping intact), hover clip validation (duration, size, codec, malicious file), palette extraction fixtures and manual override persistence.
- User tools: create user flows (both password modes), forced password change, restriction lifecycle (create, enforce, expire, lift), enforcement on stream, HLS and subtitle endpoints and on review endpoints, SSE `restricted` event, permanent deletion with the full table check, tombstone contents.
- Frontend: edit tabs save independently, hover banner preview uses the real component, palette live preview, restriction dialogs, deletion confirmation requirements (button disabled until all conditions are met), restricted viewer UI states (watch page overlay, disabled play buttons, review notice).
- E2E: admin creates a user, the user logs in and is forced to change password; admin blocks watching and the user's active playback stops and shows the message; admin lifts it and playback works; admin blocks reviewing and the review form is replaced; admin permanently deletes the user and sign-in fails; admin edits a title's hover banner and sees it on hover in the viewer app; admin replaces a torrent and watch progress survives.
- Regression: every existing admin screen and flow from the U1 inventory behaves as before.

## H.6 Phase gate

Flags OFF: zero regression differences against the U1 baseline. Flags ON: all checks pass, screenshots at 1024, 1280 and 1920 px for each new admin screen. Update PROGRESS.md and `docs/admin-guide.md`. Stop and wait for "continue".
~~~

---

## 17. Prompt U-QA: Full regression, performance, accessibility and security pass

~~~text
PROMPT U-QA: FULL REGRESSION, PERFORMANCE, ACCESSIBILITY AND SECURITY PASS

Run this after workstreams A to H are merged. Do not add features. Find and fix problems only. Fixes must be minimal and must not touch protected zones without approval.

## QA.1 Regression against the U1 baseline

1. Re-run every check recorded in `docs/update-baseline/quality.md` and compare. Produce a table: check, baseline, now, difference, explained or unexplained.
2. Re-run the feature inventory: walk every row of `feature-inventory.md`. Mark each Works, Works but changed as requested, or Broken. Any Broken row is a blocker. Fix it, add a test, and explain the cause.
3. Re-capture the screenshots from U1 (with the ambient mode set to `static` for determinism) and diff them against the baseline. Group the differences into: requested change, side effect, regression. Show me the side effects and regressions with before and after images.
4. Run the route map check: every route from U1 still resolves, every redirect added in this update works, no 404 for an old link.

## QA.2 Flag matrix

Run the full test suite under these flag combinations and report the results:
- All flags OFF (must equal the baseline).
- All flags ON.
- Each flag ON by itself (one at a time).
- `singleProfile` ON with everything else OFF, and the reverse.
Any combination that crashes or shows broken UI is a defect, because flags must be independent.

## QA.3 Performance

- Lighthouse on Home, a category page, Title, Watch, Settings and Search (mid-range mobile profile): compare with baseline. Performance must not drop more than 3 points, accessibility must be 95 or higher.
- Ambient background: fps, main thread cost, memory over 30 minutes, GPU time, adaptive tier behavior under CPU throttling (4x slowdown), bundle chunk size. Report against the budgets in A.9.
- Interaction cost: record a trace of sweeping the pointer across a row, scrolling a row, opening and closing the Search card, and opening the hover banner repeatedly. No long tasks over 50 ms, no layout thrash, no growth in DOM node count or event listeners after 100 repetitions.
- Check that the Watch page: canvas not rendering, no sound engine activity, no extra network requests, same startup time as baseline.
- Network: no new requests on initial load other than the lazy ambient chunk, the palette data is already inside title payloads.
- Admin dashboard and tables: 55 fps with the ambient layer running.

## QA.4 Accessibility

- Axe on every page with all flags ON, zero serious or critical violations.
- Keyboard-only pass: top category pill, bottom bar, Search card (combobox, removal keys), card hover banner, Settings including the password stepper, My List drag reorder, Profile bin dialogs, admin edit tabs and restriction dialogs.
- Screen reader pass (NVDA or VoiceOver) on: Search card, password strength meter, review form, confirmation dialogs.
- Reduced motion: ambient starts in static mode, no looping animation anywhere, sounds respect the rule in B.5, strength meter animates instantly.
- Photosensitivity: record 60 seconds of the ambient background and verify that no region changes luminance faster than the limits in A.1.
- Contrast: run the worst-case contrast test across every theme preset (not just the default one) on the ambient background, for viewer and admin tokens.
- Zoom and text size: 200 percent zoom and the maximum font scale setting do not break the top pill, bottom bar or Search card.

## QA.5 Security review of the new surface

Review only what this update added, and report severity, evidence, exploit scenario and fix for each finding:
- OTP: code entropy, hashing, expiry, attempt limits, resend cooldown, rate limits per user and IP, enumeration leaks, timing differences, token (grant) single use, logging hygiene (no codes or passwords in logs), email content.
- Password change: server-side rule parity with the client, session revocation, no downgrade of hashing parameters, CSRF coverage on the new endpoints, error messages.
- Reviews: injection and stored XSS (render as text only), rate limits, authorization on edit and delete, report abuse.
- Restrictions: bypass attempts (direct stream URL with an old token, HLS and subtitle endpoints, cached tokens, SSE), race conditions between lifting and applying, cache invalidation.
- Permanent deletion: authorization matrix, re-authentication requirement, replay of the confirmation request, partial failure handling, residual personal data in any table, logs or audit entries.
- Admin create user: temporary password handling (shown once, never stored in plaintext or logs), invitation link expiry and single use.
- Uploads: hover banner and hover clip validation (type, size, duration, magic numbers, ffprobe output, filenames), image processing limits.
- Search: history privacy between users, trending thresholding, query injection into SQL or full-text parsers.
- New endpoints: every one has auth, validation, rate limit and tests (a route-table test must assert it).

## QA.6 Data safety

- Confirm the single-profile migration report, the archive contents and the rollback procedure by running it on a fresh copy of dev data and restoring from `ProfileArchive`.
- Confirm all migrations apply on a clean database and on the existing one, and that each down-migration note works.
- Confirm no existing column or endpoint was removed or renamed (a diff of the Prisma schema and the OpenAPI document against the baseline must show only additions).

## QA.7 Report

Write `docs/update-baseline/qa-report.md` with all tables, every defect found (severity, status, fix commit), the remaining known issues, and a go or no-go recommendation. Do not claim a pass without evidence. Then STOP and wait for my decision.
~~~

---

## 18. Prompt U-FINAL: Flag cleanup and final report

~~~text
PROMPT U-FINAL: FLAG CLEANUP AND FINAL REPORT

Only run this after I confirm the QA report and have used the update for a while. This step removes the temporary scaffolding. It must be done carefully, one flag at a time.

1. For each flag, one commit at a time, in this order: `reviews`, `adminUserTools`, `profilePage`, `settingsPage`, `searchCard`, `hoverBanner`, `cardSounds`, `categoryNav`, `newBottomNav`, `singleProfile`, `ambientBackground`:
   - Remove the flag checks so the new behavior is the only behavior.
   - Remove the old code path ONLY if nothing else imports it (verify with the real dependency graph). The old top-right profile component, the profile picker screens, the old top navigation items, and the old hover preview are candidates.
   - Keep deprecated API endpoints for one more release (documented), do not delete them yet.
   - Run the full test suite and the regression comparison after each flag removal.
2. Remove the `featureFlags` module only after all flags are gone.
3. Make sure `docs/` is updated: `ambient.md`, `admin-guide.md`, `user-guide.md` (new navigation, Settings, Profile, Search card, reviews, sounds), `api.md`, `data-deletion.md`, `single-profile-migration.md`.
4. Search the codebase for `TODO`, `FIXME`, `console.log`, hardcoded hex colours and durations in components, unused exports and unused dependencies. Fix or list each.
5. Write `docs/UPDATE_REPORT.md`: what changed, mapped one by one to the 16 requests in the pack's section 1, with evidence (test names, screenshots), what differs from the original request and why, known limitations, and follow-up ideas.

Do not claim anything is done without evidence.
~~~

---

## 19. Appendix A: Palette and tokens

Colours sampled from your reference image. Accent and background labels were readable in the image. The planet colours were sampled from the swatch dots because the labels in the image are too small to read reliably, so they may differ by a few values from the designer's original codes. Adjust if you have the originals.

Rule: the page base is always pure black `#000000`. The navy values from the image are used only as deep, dim colour fields, never as the page background.

```json
{
  "base": {
    "black": "#000000"
  },
  "fields": {
    "deepNavy": "#020634",
    "midnight": "#050A4A",
    "royalBlue": "#0402C3",
    "indigo": "#5E55F0",
    "azure": "#4975FE",
    "periwinkle": "#8FA7FF",
    "orchid": "#EB9EFF",
    "core": "#FFFFFF"
  },
  "planets": {
    "violet": ["#722DEA", "#AE4DE8", "#E9B9E9"],
    "plum": ["#530388", "#9D20C6", "#3804CB"],
    "orchidSky": ["#D77BE6", "#90E8F6", "#649AFE"]
  },
  "blobSlots": [
    { "slot": 0, "color": "royalBlue", "radius": 0.34, "weight": 1.00 },
    { "slot": 1, "color": "indigo",    "radius": 0.30, "weight": 0.95 },
    { "slot": 2, "color": "azure",     "radius": 0.26, "weight": 0.80 },
    { "slot": 3, "color": "periwinkle","radius": 0.22, "weight": 0.70 },
    { "slot": 4, "color": "orchid",    "radius": 0.24, "weight": 0.75 },
    { "slot": 5, "color": "midnight",  "radius": 0.38, "weight": 0.60 },
    { "slot": 6, "color": "indigo",    "radius": 0.20, "weight": 0.55 },
    { "slot": 7, "color": "core",      "radius": 0.06, "weight": 0.35 }
  ],
  "beam": { "color": "azure", "angleDeg": -28, "width": 0.05, "intervalSec": [25, 40], "sweepSec": 12 }
}
```

Notes for the agent:
- Blob radii are fractions of the viewport height. Weights are field contributions before the coverage controller adjusts the threshold.
- The `core` blob is tiny and rare by design. It must not be allowed to sit behind text at full intensity (see A.8).
- When a card palette is focused, slots 0 to 4 are the first to receive card colours (nearest to the card's anchor first), slots 5 to 7 keep their base colours so the identity of the background stays.

Design tokens to add (names are required, values are defaults):

```css
:root {
  /* ambient */
  --z-ambient: -1;
  --z-top-nav: 40;
  --z-bottom-nav: 50;
  --z-popover: 60;
  --z-modal: 70;
  --z-toast: 80;
  --z-player: 90;
  --dur-ambient-swap: 700ms;
  --dur-ambient-return: 1000ms;
  --ambient-return-delay: 900ms;
  --ambient-hover-intent: 120ms;
  --banner-hover-intent: 450ms;
  --banner-grace: 150ms;
  --lift-card: 8px;
  --glow-radius: 36px;
  --scrim-glass: rgb(0 0 0 / 0.55);
  --scrim-glass-admin: rgb(0 0 0 / 0.68);
  /* password strength (map to theme tokens in the theme file) */
  --meter-weak: var(--c-danger);
  --meter-fair: var(--c-warning);
  --meter-strong: var(--c-success);
}
```

---

## 20. Appendix B: Reference fragment shader

A reference skeleton to prevent guesswork. The agent must adapt it, not paste it blindly: test it, tune the constants, and make sure the coverage controller holds the target. WebGL2 (GLSL ES 3.00), one fullscreen triangle.

```glsl
#version 300 es
precision highp float;

uniform vec2  uRes;            // render target size in pixels
uniform float uTime;           // seconds
uniform float uCut;            // coverage controller output (threshold)
uniform float uSoft;           // edge softness around the threshold
uniform float uGain;           // overall brightness (admin cap lowers this)
uniform vec4  uBlobs[8];       // xy = position (0..1, y up), z = radius (of height), w = weight
uniform vec3  uPalA[8];        // current colours per blob slot (linear RGB)
uniform vec3  uPalB[8];        // target colours per blob slot
uniform float uMix;            // 0..1 palette crossfade (OKLab mixed on CPU if preferred)
uniform vec4  uPointer;        // xy = position (0..1), z = radius, w = strength (fades when idle)
uniform vec4  uRipple;         // xy = position, z = age 0..1, w = strength
uniform vec4  uBeam;           // x = progress 0..1, y = angle, z = width, w = strength
uniform vec3  uBeamColor;
uniform float uDither;         // 1.0 on screen pass, 0.0 on coverage pass

out vec4 outColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);

  // slow domain warp for an organic nebula feel
  vec2 warp = vec2(
    fbm(p * 1.4 + vec2(uTime * 0.020, 0.0)),
    fbm(p * 1.4 + vec2(7.3, -uTime * 0.017))
  );
  p += (warp - 0.5) * 0.16;

  float field = 0.0;
  vec3  col   = vec3(0.0);

  for (int i = 0; i < 8; i++) {
    vec2  c = vec2(uBlobs[i].x * aspect, uBlobs[i].y);
    float r = uBlobs[i].z;
    float d = length(p - c);
    float f = exp(-(d * d) / (r * r)) * uBlobs[i].w;
    vec3  bc = mix(uPalA[i], uPalB[i], uMix);
    field += f;
    col   += bc * f;
  }

  // pointer glow (borrows the colour of the nearest strong blob, so it never adds a new hue)
  {
    vec2  c = vec2(uPointer.x * aspect, uPointer.y);
    float d = length(p - c);
    float f = exp(-(d * d) / (uPointer.z * uPointer.z)) * uPointer.w;
    field += f;
    col   += mix(uPalA[3], uPalB[3], uMix) * f;
  }

  // click ripple: one soft expanding ring
  {
    vec2  c = vec2(uRipple.x * aspect, uRipple.y);
    float d = length(p - c);
    float ring = exp(-pow((d - uRipple.z * 0.45) / 0.03, 2.0)) * uRipple.w * (1.0 - uRipple.z);
    field += ring;
    col   += mix(uPalA[4], uPalB[4], uMix) * ring;
  }

  // diagonal beam ("black matter" streak)
  {
    float s = sin(uBeam.y), k = cos(uBeam.y);
    vec2  q = vec2(uv.x * aspect - uBeam.x * aspect, uv.y - 0.5);
    float lineDist = abs(q.x * s - q.y * k);
    float b = exp(-(lineDist * lineDist) / (uBeam.z * uBeam.z)) * uBeam.w;
    field += b;
    col   += uBeamColor * b;
  }

  col /= max(field, 1e-4);   // colour by contribution, intensity by field

  // threshold curve controlled by the coverage controller
  float intensity = smoothstep(uCut - uSoft, uCut + uSoft, field);

  vec3 rgb = col * intensity * uGain;

  // blue-noise-like dither to avoid banding (skipped on the coverage pass)
  rgb += (hash21(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0 * uDither;

  // pure black outside the fields
  outColor = vec4(max(rgb, 0.0) * step(0.0005, intensity), 1.0);
}
```

Implementation notes:
- Convert the palette to linear RGB before upload and do the final conversion to sRGB (a gamma step) at the end if you work in linear space. Choose one convention and test it.
- The coverage pass renders the same shader to a 64 by 36 target with `uDither = 0` and counts pixels with `max(R, G, B) >= 26/255`.
- Keep the loop counts constant (8 blobs) so the shader compiles to a predictable cost. Fill unused slots with weight 0.
- Run the fragment shader at about half resolution and upscale with linear filtering.

---

## 21. Appendix C: Sound engine parameters

```json
{
  "tick": {
    "waveform": "triangle",
    "baseFrequencyHz": 1500,
    "pitchLadderSemitones": [0, 2, 4, 7, 9, 12, 9, 7, 4, 2],
    "attackMs": 1,
    "decayMs": 22,
    "peakGain": 0.18,
    "noiseBurstMs": 6,
    "noiseGain": 0.05,
    "lowpassHz": 6500,
    "stereoJitter": 0.15
  },
  "limits": {
    "minIntervalMs": 45,
    "maxPerSecond": 12,
    "masterCeiling": 0.6,
    "defaultVolume": 0.35
  },
  "rules": {
    "unlockOn": ["pointerdown", "keydown", "touchstart"],
    "silentOn": ["watchPage", "videoPlayingWithSound", "documentHidden", "disabledSetting", "beforeUnlock"],
    "hapticMs": 4
  }
}
```

Notes:
- Pitch index = card position in the row modulo the ladder length, so sweeping across a row climbs and falls gently.
- Scroll ticks use a slightly lower peak gain than hover ticks (about 70 percent).
- Never create more than a few audio nodes per tick, and disconnect them on `ended`.

---

## 22. Appendix D: New and changed API endpoints

Auth column: U user, A admin, S super admin, P public.

### Browsing and catalog (changed, additive)

| Method | Path | Auth | Change |
|---|---|---|---|
| GET | /api/titles | U | New `category` filter. Summaries gain `category`, `hoverBanner`, `hoverTagline`, `ambientPalette` |
| GET | /api/titles/:slug | U | Same additive fields |
| GET | /api/me/profile | U | Single profile |
| PATCH | /api/me/profile | U | Update the single profile |
| GET | /api/me/stats | U | Stats for the Profile page |
| GET | /api/me/restrictions | U | Active restrictions (watch, review) so the UI can disable controls |

### Account and password

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/account/password/otp/request | U | Verify current password, email OTP |
| POST | /api/account/password/otp/verify | U | Verify OTP, return change grant |
| POST | /api/account/password/change | U | Change password with grant |

### My List, continue watching, history

| Method | Path | Auth | Purpose |
|---|---|---|---|
| PUT | /api/watchlist/order | U | Save manual order |
| DELETE | /api/watchlist | U | Clear My List |
| DELETE | /api/progress/continue/:mediaAssetId | U | Hide from Continue Watching |
| DELETE | /api/progress/continue | U | Hide all |
| POST | /api/progress/:mediaAssetId/mark-watched | U | Mark as watched |
| POST | /api/progress/:mediaAssetId/reset | U | Start over |
| GET | /api/history/watched | U | Watched list |
| DELETE | /api/history/watched | U | Clear watched list |
| DELETE | /api/history/watched/:id | U | Remove one item |

### Search

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/search/history | U | Recent searches |
| POST | /api/search/history | U | Save a search |
| DELETE | /api/search/history/:id | U | Remove one |
| DELETE | /api/search/history | U | Clear all |
| GET | /api/search/similar | U | Similar searches and corrections |
| GET | /api/search/trending | U | Trending searches |

### Reviews

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/titles/:slug/reviews | U | List and summary |
| POST | /api/titles/:slug/reviews | U | Create (blocked by REVIEW_BLOCK) |
| PATCH | /api/reviews/:id | U | Edit own |
| DELETE | /api/reviews/:id | U | Delete own |
| POST | /api/reviews/:id/report | U | Report |
| GET | /api/me/reviews | U | My reviews |

### Admin

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/admin/titles/:id/artwork/hover-banner | A | Upload hover banner |
| POST | /api/admin/titles/:id/artwork/hover-clip | A | Upload hover clip |
| DELETE | /api/admin/titles/:id/artwork/hover-banner | A | Remove |
| DELETE | /api/admin/titles/:id/artwork/hover-clip | A | Remove |
| POST | /api/admin/titles/:id/palette/extract | A | Re-extract palette |
| PUT | /api/admin/titles/:id/palette | A | Manual palette |
| DELETE | /api/admin/titles/:id/palette | A | Back to automatic |
| PUT | /api/admin/titles/:id/media/replace | A | Replace torrent or magnet safely |
| GET | /api/admin/reviews | A | Review moderation list |
| PATCH | /api/admin/reviews/:id | A | Hide, restore, remove, pin, edit |
| DELETE | /api/admin/reviews/:id | S | Hard delete |
| POST | /api/admin/titles/:id/reviews | A | Editorial review |
| GET | /api/admin/review-reports | A | Review reports |
| PATCH | /api/admin/review-reports/:id | A | Resolve or reject |
| POST | /api/admin/users | A | Create user (ADMIN role needs S) |
| GET | /api/admin/users/:id/restrictions | A | List restrictions |
| POST | /api/admin/users/:id/restrictions | A | Add watch or review block |
| DELETE | /api/admin/users/:id/restrictions/:rid | A | Lift |
| DELETE | /api/admin/users/:id?permanent=true | A | Permanent deletion (rules apply) |

### Deprecated (kept working)

| Method | Path | Behavior now |
|---|---|---|
| GET | /api/profiles | Returns exactly one profile |
| POST | /api/profiles | 409 PROFILE_LIMIT |
| DELETE | /api/profiles/:id | 409 PROFILE_REQUIRED |

Error codes added: `WATCH_RESTRICTED`, `REVIEW_RESTRICTED`, `REVIEW_EXISTS`, `PROFILE_LIMIT`, `PROFILE_REQUIRED`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_LOCKED`, `OTP_RATE_LIMITED`, `CHANGE_GRANT_INVALID`, `PASSWORD_TOO_WEAK`, `CONFIRMATION_REQUIRED`, `FORBIDDEN_TARGET`.

---

## 23. Appendix E: Acceptance checklist

Every line needs evidence (test name, file or screenshot).

### Ambient background
- [ ] Pure black base, colour coverage 35 percent within tolerance, measured by the Playwright test.
- [ ] Colours from the reference palette only, soft, no banding, no flashing.
- [ ] Reacts to the pointer, clicks and scrolling. Beam and planet orbs present in Live mode.
- [ ] Modes: Live, Calm, Static, Off, plus a visible Pause control. Reduced motion and data saver start in Static.
- [ ] Card hover, keyboard focus, carousel and hero swap the background palette smoothly and release back to base.
- [ ] Off and not rendering on the watch page.
- [ ] Worst-case contrast tests pass for every theme preset. Performance budgets pass. Adaptive quality works.
- [ ] Same background on the admin side, with stronger scrims and a brightness cap.

### Cards and sounds
- [ ] Hovered card lifts a few pixels, no layout shift, no clipping in rows.
- [ ] Card glow uses the title palette, opacity-only animation.
- [ ] Hover banner appears after the hover pause, uses the admin banner (or fallbacks), stays inside the viewport, one at a time, keyboard accessible.
- [ ] Tick on hover and on row scroll, rate limited, silent on the watch page and before the first gesture, settings work and persist.

### Navigation
- [ ] Centred top pill with exactly Movies, TV Series, Anime. Nothing in the top right corner.
- [ ] Bottom bar with exactly Home, Search, My List, Profile, Settings. No Admin item.
- [ ] Admin console reachable from Settings for admins only.
- [ ] Category pages work for all three categories. Old routes redirect.

### Settings and profile
- [ ] Password change with email OTP, rate limits, lockout, grant single use, other sessions revoked.
- [ ] Strength meter with red to orange to green gradient, ARIA meter, checklist, tips.
- [ ] Strong password suggestions generated in the browser with secure randomness.
- [ ] My List customization (reorder, sort, select, remove, clear), Continue Watching management, logout and logout everywhere.
- [ ] One profile per account everywhere, no picker, migration rehearsed and reversible.
- [ ] Profile page with the three category cards, each with a bin icon, confirmation dialogs, and isolated clearing.

### Search
- [ ] Search card from the bottom bar, recent searches with a cross each, clear all, similar searches, top results, keyboard and ARIA complete.
- [ ] History saved only on submit, deduped, capped, private, synced from the old local history once.

### Reviews
- [ ] One review per user per title, edit and delete own, report, sort and filter, spoilers, plain-text rendering.
- [ ] Restricted users see the notice and cannot post or edit.

### Admin
- [ ] Full title editing: details, category, thumbnail, hover banner and clip, palette, torrent or magnet replace (safe), subtitles, reviews.
- [ ] Review moderation screen and editorial reviews.
- [ ] Create user (both password modes), forced password change at first login.
- [ ] Watch and review restrictions with reason and expiry, enforced on every playback endpoint within 15 seconds, lifted instantly.
- [ ] Permanent deletion with strong confirmation, role rules, full data removal and tombstone.
- [ ] Everything audited. Every new route role-tested.

### Non-interference
- [ ] All flags OFF equals the baseline.
- [ ] Every flag works alone and in combination.
- [ ] No protected zone changed except the single approved restriction hook.
- [ ] No existing test deleted, skipped or weakened.
- [ ] Prisma and OpenAPI diffs show additions only.

---

## 24. Appendix F: Regression checklist

Run after every workstream and at the end. Use the U1 feature inventory as the master list. These are the minimum.

Viewer
- [ ] Sign up, sign in, sign out, forgot password, reset password.
- [ ] Home hero, rows, Continue Watching, My List row, genre rows.
- [ ] Browse, filters, search results page, title modal and title page, seasons and episodes.
- [ ] Play a direct video, an HLS video, seek, volume, speed, fullscreen, picture in picture.
- [ ] Subtitles on and off, style settings, audio tracks.
- [ ] Resume prompt, skip intro, next episode, progress saving, mark as watched.
- [ ] My List add and remove, ratings, report a title.
- [ ] Appearance settings (theme, fonts, density, radius, motion level), preferences sync across browsers.
- [ ] PWA install and offline page, service worker not caching video.

Admin
- [ ] Dashboard, titles list, wizard (all steps), publish, schedule, unpublish, takedown.
- [ ] Torrent manager, blocklist, health check, pre-cache.
- [ ] Series manager, collections, hero slots.
- [ ] Users (suspend, role change, sessions), invites, reports, site settings, audit log.

Platform
- [ ] Lint, typecheck, unit, component, integration, streaming, e2e, accessibility, security tests.
- [ ] Production build, bundle budgets, Lighthouse targets.
- [ ] Docker stack starts, migrations apply, health endpoints green.

---

## 25. Appendix G: Rollback plan and utility prompts

### Rollback plan

1. Instant visual rollback: turn the flag OFF (env or site setting). No deploy needed if flags are runtime-readable.
2. Code rollback: each workstream is its own branch and merge commit. Revert the merge commit.
3. Data rollback:
   - Additive migrations stay in place (they are harmless). Use the documented down-migration notes only if required.
   - Single profile: restore archived profiles from `ProfileArchive` within 30 days using the documented restore script, then drop the unique constraint migration.
   - Permanent user deletion cannot be rolled back. Restore from the nightly database backup into a scratch database and re-import the single user if ever needed.
4. Always take a database backup before applying any migration or script in a real environment.

### Utility prompts

#### G1. Resume in a fresh Antigravity task

~~~text
Read the Master Context, the Update Master Context, and PROGRESS.md. Summarize in 10 lines: which workstream we are in, which flags exist and their state, what is done, what is broken, and the next three actions. Run lint, typecheck and tests and report. Change nothing until I say go.
~~~

#### G2. The ratio looks wrong

~~~text
The ambient background does not look like roughly {{AMBIENT_COLOR_RATIO}} colour and the rest black. Do not change anything yet. Open `/__dev/ambient` and the debug overlay, report the measured coverage over 30 seconds, the current uCut and controller values, the render scale, and the active tier. Then explain the cause (controller gains, tier downgrade, palette swap, clamped range, wrong coverage definition) and propose the smallest fix with a test that fails before and passes after.
~~~

#### G3. The background hurts readability

~~~text
Text on [screen] is hard to read over the ambient background. Measure the worst-case contrast for each text token on that screen, identify which elements rely on the page background, and fix by adding or strengthening glass scrims using the existing tokens only. Do not reduce the ambient colour ratio and do not change text colours. Add a regression test for the contrast case.
~~~

#### G4. Something else broke

~~~text
After the update, [feature] no longer works as before. Steps: [steps]. Expected: [expected]. Actual: [actual]. Error output: [paste].
First check the U1 feature inventory and baseline to confirm the old behavior. Then toggle each flag off one at a time to find which workstream caused it and report. Explain the root cause, write a failing test, make the smallest fix that does not touch protected zones, and run the full regression comparison. Tell me if the same flaw can affect anything else.
~~~

#### G5. Add a new ambient palette preset

~~~text
Add an alternative ambient palette named [name] with these colours: [hex list]. Map them to the 8 blob slots, keep the beam and planet colours consistent, run the coverage test and the worst-case contrast test against all theme presets, and add a selector in Settings under Background. The default palette must stay the Space Gradients palette. Report coverage and contrast numbers.
~~~

#### G6. Tune the sounds

~~~text
The interface ticks feel [too sharp, too loud, too frequent, too low]. Adjust only the parameters in Appendix C (and nothing else), keep the rate limits and silent rules intact, update the unit tests, and give me a short A/B test page at `/__dev/sounds` with buttons to play each variant so I can compare by ear.
~~~

#### G7. Explain it to me

~~~text
Explain how [ambient focus swap, the coverage controller, the OTP flow, the restriction enforcement, the permanent deletion] works as if I am a third-year computer science student who knows Java and basic web development. Use one Mermaid diagram, walk through one real interaction from start to finish, name the exact files involved, and list the three most likely things to break and how to debug each.
~~~

---

End of pack. Paste Prompt U0 into your Antigravity rules, run U1, review the baseline, then go one workstream at a time.
