# Admin Overhaul Pack: Live Admin Console Edition

A change-request prompt pack for Google Antigravity (also works in Claude Code). It rebuilds the admin side of your streaming web app: a new vertical dock sidebar, live realtime dashboard cards, live torrent health graphs, admin notifications and broadcast messages, a new Add Media flow with a Telegram channel picker and a final overview card, a media activity bar with inline edit and delete, and admin-only user management with closed signup and dual login.

The pack is built so the agent can change a lot without breaking what already works: it audits first, builds behind feature flags, vendors the ThreeUI components exactly as published and proves their hashes, and uses additive database changes only.

Scope: the admin area (`/admin/*`, `/api/admin/*`), the login page, and the smallest possible set of user-side hooks that the admin features need (notification delivery, presence, ban enforcement). Nothing else changes.

---

## Table of contents

1. What this pack changes
2. How to run this pack in Antigravity
3. Interpretations and assumptions (read and correct these first)
4. Execution order
5. Variables to fill in
6. Prompt Y0: Admin Master Context (append to your existing rules)
7. Prompt Y1: Audit and regression baseline (read only)
8. Prompt Y2: ThreeUI vendoring, verification and adapters
9. Prompt Y3: Data model, contracts and migrations (additive only)
10. Prompt Y4: Realtime backbone (event bus, SSE, presence)
11. Workstream W1: Admin shell, vertical dock sidebar, visual system
12. Workstream W2: Live dashboard cards
13. Workstream W3: Live torrent health graphs
14. Workstream W4: Notifications (admin alerts, broadcasts, user delivery)
15. Workstream W5: Telegram source (backend and browser)
16. Workstream W6: Add Media v2 with final overview card
17. Workstream W7: Media activity bar
18. Workstream W8: User management, closed signup, dual login, presence
19. Prompt Y-QA: Full regression, performance, accessibility and security pass
20. Prompt Y-FINAL: Flag cleanup and final report
21. Appendix A: ThreeUI manifest (files, hashes, configured props)
22. Appendix B: Design tokens and current admin palette
23. Appendix C: Realtime protocol and event catalog
24. Appendix D: Torrent health score formula and sampling rules
25. Appendix E: API endpoint reference
26. Appendix F: Copy text (login notice, notifications)
27. Appendix G: Telegram setup checklist
28. Appendix H: Acceptance checklist
29. Appendix I: Regression checklist
30. Appendix J: Rollback plan and utility prompts

---

## 1. What this pack changes

| # | You asked for | Workstream |
|---|---|---|
| 1 | Change the admin UI completely | W1 |
| 2 | Sidebar uses the Sable Dock, made vertical, to move between admin dashboards | W1 |
| 3 | Live graph that shows the health of each torrent | W3 |
| 4 | Torrent health viewable by TMDB id or by name, with the number of people live in each torrent as graphs | W3 |
| 5 | Dashboard cards fully realtime, no manipulated numbers | W2 |
| 6 | Notification when anything changes in the web application | W4 |
| 7 | Add Media: remove the privacy rights part, finish with a final overview card of every detail | W6 |
| 8 | Torrent file addable, traversable and pickable from a Telegram channel, manual magnet link also supported | W5 and W6 |
| 9 | Bar below listing uploaded, modified and removed media with metadata and timestamps, with delete and modify in the same bar without opening a card | W7 |
| 10 | Admin can send a notification message to every user or to one user | W4 |
| 11 | Only admin can add, remove, ban or unban activities for users | W8 |
| 12 | No signup, login only, with the password designated by the admin | W8 |
| 13 | After first login, users can also sign in with their email account on the same email id, and both methods keep working | W8 |
| 14 | Notice about this on the login page (only this) and as a notification after login | W8 and W4 |
| 15 | Admin sees user online status and the media id each user is currently watching | W8 |
| 16 | Use the ThreeUI components: Liquid Orb or Modern toggle (hue 73) for add media and add user; Modern toggle (hue -97) for live and unlive and ban and unban; Bloom Outline Button wherever suitable; Sable Dock as the vertical sidebar | Y2, W1, W6, W7, W8 |

---

## 2. How to run this pack in Antigravity

1. Put Prompt Y0 into the workspace's persistent rules area, appended below your existing rules. Do not replace them.
2. Run Prompt Y1 first. It is read only. It also investigates the red "1 Issue" badge visible at the bottom left of your admin screenshot. Review the audit before anything changes.
3. Run Prompt Y2 next. It fetches and verifies the ThreeUI source. If the source cannot be fetched, the agent must stop and report it, not recreate the components.
4. Run each later prompt as its own task. Ask the agent for an implementation plan and task list first, read them, then approve execution. If your version of Antigravity has a review-before-run policy, turn it on for this project.
5. Never run two agents on the same files. W1 changes the admin shell, so nothing else in `/admin` runs alongside it. After Y3 and Y4 land, W3 and W5 can run in parallel because they own different folders.
6. Use the browser-driving agent (if available) to verify every screen at 1280, 1440 and 1920 px and to check the interactions: dock hover spring, toggles, live charts moving, notifications arriving.
7. After each task ask for a walkthrough: files changed, flags added, screenshots, and the regression result compared with the Y1 baseline.
8. One branch per workstream. Merge only after the regression checklist (Appendix I) passes.

---

## 3. Interpretations and assumptions

Some phrases in your message can be read two ways. The prompts are built on the readings below. Change any row you disagree with before you start.

| Topic | How this pack reads it |
|---|---|
| Stack | Your screenshot shows `localhost:3000/admin` and a Next.js-style dev badge, so the pack assumes a Next.js app and gives Next.js specific guidance. Prompt Y1 confirms the real stack and the pack adapts if it is different. |
| The red "1 Issue" badge | A development overlay showing there is an error or warning in the running app. It also overlaps the "Admin" label in the sidebar. Y1 reads the issue and reports it. It is never hidden to make it go away. |
| "Change the UI completely" | New shell, new layout, new components and motion. The brand stays: the KAMUNATI logo, pitch black, and the violet accent already in use (about `#BF40FA`). Every existing admin route and capability keeps working. |
| "Dashboard cards in realtime, no manipulating" | Two rules: cards are read-only (nobody edits a number), and every number is computed from real data on the server and pushed live. No hardcoded values, no random numbers, no client-side guessing. The "Active Users 24" in your screenshot looks like a static value and Y1 finds where it comes from. |
| Add control | The Liquid Orb (circular plus button) becomes the add trigger for Add Media and Add User. The Modern toggle (hue 73) is used inside the add forms for on and off options, with the text relabelled for each use (for example "Go live after saving", "Notify all users"). |
| Live and unlive, ban and unban | The Modern toggle (hue -97). Switch ON means live (media) or allowed (user activity), switch OFF means unlive or banned. Turning an activity OFF asks for a reason and a duration first. |
| Bloom Outline Button | The secondary button style used wherever the app has a quiet action: Cancel, Back, Save draft, Browse Telegram, Clear filters, Export, Mark all read. Primary actions keep the solid accent button or the Liquid Orb. Its hue is adapted to the violet accent. |
| Vertical Sable Dock | The Sable Dock is a horizontal capsule whose items spring downward and widen near the pointer. Vertical version: the capsule runs top to bottom on the left, items spring sideways toward the content and grow along the vertical axis near the pointer. The exact source is vendored untouched, and the vertical version is a documented fork. |
| "Email account with email account password" | Read as: after the first login the user may also sign in with their own email account (for example Google) on the same email id. This is implemented as "Continue with Google" (OAuth), so the user types their email password only on the provider's site and the app never sees it. The app will never ask for or collect an email-provider password. If you prefer a personal in-app password instead, set `{{EMAIL_LOGIN_MODE}}` to `own-password`. |
| "No signup" | The signup page and registration endpoint are closed. Only an admin creates accounts. |
| Telegram channel | Telegram's Bot API cannot list a channel's old messages. A bot that is an admin of the channel receives new posts, which the app indexes, so the admin can browse and pick from that index. Older files need to be re-posted or forwarded once. An optional user-session backfill is described but is off by default (see W5). |
| "Remove the privacy rights part" | The rights and attestation step is removed from the Add Media flow and no longer blocks publishing. Existing columns stay in the database (additive only). Takedown and blocklist tools stay available. |
| "Bar below" | A docked panel at the bottom of the admin shell, collapsible, listing media as horizontal rows ("bars"). Each row shows metadata, history of changes with timestamps, and lets you edit inline, toggle live, or delete, without opening a card. |
| "Persons live in the torrent" | Two numbers, both graphed: peers in the torrent swarm (seeders and leechers) and people in your app watching that media right now. |
| Online status | Online means a heartbeat within the last 45 seconds. Watching now comes from the server's own playback records, not from what the browser claims. |
| "Notification when there is any change" | A defined catalog of events (Appendix C): media, torrents, users, restrictions, notifications, settings, system health. All of them reach an admin notification center in real time. |
| ThreeUI components | Each component is vendored byte for byte from the published bundle, hash verified, and then used through thin adapters. The agent must read the real source first and must not recreate anything from screenshots or descriptions. |

---

## 4. Execution order

```
Y0  Admin Master Context
Y1  Audit and baseline
Y2  ThreeUI vendoring, verification, adapters
Y3  Data model and contracts
Y4  Realtime backbone
W1  Admin shell, vertical dock, visual system
W2  Live dashboard cards
W3  Live torrent health graphs
W4  Notifications
W8  User management and access
W5  Telegram source
W6  Add Media v2
W7  Media activity bar
QA  Full regression pass
FIN Flag cleanup and final report
```

Why this order: Y2 to Y4 build the foundations (components, data, realtime). W1 sets the shell everything else sits in. W4 comes before W8 because the login notices are delivered through notifications. W5 comes before W6 because the Add Media flow uses the Telegram picker. W7 comes last because it consumes events from everything before it.

---

## 5. Variables to fill in

| Variable | Meaning | Default |
|---|---|---|
| `{{APP_NAME}}` | Product name | KAMUNATI |
| `{{ADMIN_ACCENT}}` | Admin accent colour | `#BF40FA` (sampled from your screenshot) |
| `{{EMAIL_LOGIN_MODE}}` | Second sign-in method: `oauth` or `own-password` | oauth |
| `{{OAUTH_PROVIDERS}}` | Providers offered | google |
| `{{TELEGRAM_CHANNEL}}` | Channel where you store files (id or username) | (yours) |
| `{{ONLINE_TTL_SECONDS}}` | Heartbeat age that still counts as online | 45 |
| `{{HEARTBEAT_SECONDS}}` | Heartbeat interval while the tab is visible | 20 |
| `{{LIVE_SAMPLE_SECONDS}}` | Torrent health sampling interval for live charts | 2 |
| `{{TRASH_RETENTION_DAYS}}` | How long removed media can be restored | 30 |
| `{{MAX_BROADCAST_CHARS}}` | Longest notification message | 500 |

---

## 6. Prompt Y0: Admin Master Context

Append this to your existing persistent rules. It adds rules and does not replace the earlier ones.

~~~text
# ADMIN MASTER CONTEXT: LIVE ADMIN CONSOLE EDITION

This is an addendum to the existing project rules. Everything in the original rules still applies. Where this addendum conflicts, it wins ONLY for the items in section 2. Everything else stays exactly as it is.

## 1. Mission

Rebuild the admin side of {{APP_NAME}} as described in section 2 without breaking any existing feature. The success criterion is not how much we add. It is that every existing feature keeps working exactly as before, except where a change is explicitly requested.

## 2. Requested changes (the full list, nothing else is in scope)

1. A completely new admin UI (shell, layout, components, motion) using the existing brand: logo, pitch black, violet accent {{ADMIN_ACCENT}}.
2. The admin sidebar becomes a VERTICAL version of the ThreeUI "Sable Dock" for moving between admin dashboards.
3. A live, realtime graph of each torrent's health, searchable by TMDB id or by name, including the number of people live in each torrent (swarm peers and in-app viewers).
4. Dashboard cards that are read-only, computed from real data and updated in realtime. No hardcoded, random or client-side manipulated numbers.
5. Admin notifications for any change in the web application (event catalog in Appendix C).
6. Admin can send a notification message to all users or to one particular user.
7. Add Media flow: remove the privacy and rights step; finish with a final overview card showing every detail of the media about to be added; the source can be (a) a torrent file picked from a Telegram channel, (b) a torrent file uploaded from the device, or (c) a manual magnet link.
8. A bottom bar listing uploaded, modified and removed media with metadata and timestamps, where the admin can modify, toggle live, or delete a media directly in the row without opening a card.
9. User management for admins only: add, remove, ban and unban activities. No signup. Login only with the password designated by the admin.
10. After the first successful login a user may also sign in with their email account on the same email id (mode {{EMAIL_LOGIN_MODE}}). Both methods keep working. The login page shows a notice about this (and only this) and a notification is delivered after login.
11. Admin can see each user's online status and the media id they are currently watching.
12. ThreeUI components used as described in Appendix A and the Y2 prompt.

Anything not on this list must not change in behavior, appearance, API shape, or data. The viewer-facing app is out of scope except the minimum hooks listed in section 4.

## 3. Protected zones (do not modify unless a prompt explicitly lists the file)

- The torrent engine and everything under the torrent folder. The health sampler reads from the engine's existing public status accessors. If an accessor is missing, propose a minimal read-only accessor and WAIT for approval.
- Stream, HLS, subtitle-serving and probe code. At most one shared `assertAllowed(userId, activity)` call may be added at the top of each playback handler, and ONLY after I approve the exact diff (Workstream W8).
- Authentication core: token issuing, refresh rotation, cookie settings, CSRF. New login methods are added beside the existing ones. Existing login behavior must stay intact for existing accounts.
- Existing database migrations. Never edit one. Only add new migrations.
- Existing tests. Never delete, skip or weaken a test to make it pass. If a requested change makes a test obsolete, STOP and ask, naming the test.
- The vendored ThreeUI files. They are never edited (see section 7).
- Everything in the viewer app except the hooks in section 4.
- Build, deploy and CI configuration, except adding test steps and the dependencies listed in the prompts.

If a change seems to require touching a protected zone, STOP, explain why, propose the smallest alternative, and wait for approval.

## 4. Minimum user-side surface (the only viewer-app changes allowed)

1. Login page: remove the signup link and screen, add the dual-login notice, add the "Continue with Google" button (mode oauth) or the second-password step (mode own-password).
2. A notification receiver: toasts and an inbox page, with a small unread dot on an existing navigation item. The exact placement is decided after the audit and approved by me.
3. A presence heartbeat client that runs only when signed in.
4. Ban enforcement messages (watching disabled, reviewing disabled) using the existing UI patterns.
All four live behind flags and are removed from the build when their flag is OFF.

## 5. Change control protocol

1. IMPACT ANALYSIS: before editing, list every file to create or change, and for each changed file list the files and components that import it (real dependency graph, not a guess). Rate each Low, Medium or High risk. Wait for approval.
2. FEATURE FLAGS: every new behavior ships behind a flag in the typed `featureFlags` module (env and site settings), default ON in development and tests. Flags: `adminRedesign`, `adminDock`, `adminRealtime`, `adminLiveCards`, `adminTorrentLive`, `adminAlerts`, `adminBroadcast`, `adminTelegram`, `adminAddMediaV2`, `adminActivityBar`, `adminUserAccess`, `adminPresence`, `closedSignup`, `dualLogin`. When a flag is OFF the app behaves exactly as before.
3. ADDITIVE ONLY: add columns, tables, endpoints and components. Never rename or remove existing ones. Deprecate instead: keep the old thing working, mark it deprecated, and remove it only in the final cleanup after I approve.
4. SMALL STEPS: one numbered step at a time. After each step run lint, typecheck and the relevant tests. Fix before continuing.
5. REGRESSION GATE: at the end of each workstream compare with the Y1 baseline (tests, route inventory, screenshots). Any unexplained difference blocks the workstream.
6. BRANCHES: one branch per workstream, named `feat/<id>-<short-name>`. Conventional Commits.
7. ASSUMPTIONS: state ambiguity as a one-line assumption and continue, unless it affects data loss, security or a protected zone, in which case stop and ask.
8. PROGRESS.md: update after every workstream: changes, flags, migrations, env vars, known issues.

## 6. Data integrity rules for anything shown as a live number

These rules are what "no manipulating" means. They are tested.
1. Every number on the admin dashboard, torrent health view, users table and activity bar comes from the database or from the live engine through a server-side function. The browser never computes a metric from other metrics except formatting (rounding, units, relative time).
2. No literals, no `Math.random`, no placeholder arrays or "demo" values in code paths that ship. Demo and seed data exist only in the seed script and tests.
3. Cards are read-only. No input, button or code path lets anyone edit a displayed metric.
4. Realtime means: a full snapshot on load, then small deltas pushed by the server, each carrying a sequence number. If the client misses a sequence number or the connection drops, it refetches the snapshot. While disconnected the UI shows a visible "Reconnecting" state and the numbers are marked stale. They are never extrapolated.
5. The same server function produces the snapshot and the deltas, so they cannot disagree.
6. A CI script fails the build if dashboard components contain numeric literals used as data, `Math.random`, or `setInterval` loops that mutate displayed values.
7. An integrity test compares every card with a direct database query after each of a series of mutations (add media, toggle live, remove media, create user, ban user, user heartbeat, torrent state change) and asserts they match within 2 seconds.

## 7. ThreeUI integration rules

1. Fetch and read the complete registered source bundle for each component before editing anything. If a bundle cannot be fetched, STOP and report. Never recreate a component from a screenshot, preview, description or file name.
2. Vendor the files byte for byte into `src/vendor/threeui/` keeping the registered relative paths. Never edit them. Verify SHA-256 of every file (and of the binary assets) against Appendix A with `scripts/verify-threeui.mjs`. The script runs in CI.
3. If a component does not expose what we need (a label, a click handler, a controlled checked state, a vertical orientation), build an ADAPTER or a documented FORK in `src/features/admin/ui/` that copies the vendored source, applies the smallest change, and records every modification in `FORKS.md` (what, why, diff). Visuals, motion, shaders and interactions must remain identical apart from the documented change. The vendored originals stay untouched so their hashes still verify.
4. Check the package or bundle license and the fonts it ships. If something needs a license or key you do not have, STOP and report. Bundled fonts with `sf-` in the name may be Apple San Francisco files: confirm the right to serve them before shipping, otherwise tell me and propose a licensed fallback.
5. Next.js specifics: ThreeUI components are client-side. Mark wrappers `"use client"`, load WebGL or Three.js variants with `next/dynamic` and `ssr: false`, keep them out of the viewer bundle, and avoid hydration warnings.
6. Three.js: the dock requires Three.js r128. Check the version already installed. If different, do NOT change it. Isolate the required version for the vendored code (a package alias or a separate chunk) and report. If isolation is impossible, STOP and ask.
7. Only the variants we use may ship in the admin bundle: `bloom-outline-button`, `modern` (toggle), `circle` (Liquid Orb) and `sable` (dock). Other variants must be tree-shaken or lazy so they never load.
8. Respect `prefers-reduced-motion`: the WebGL and motion-heavy parts fall back to a static or minimal state through the adapters.
9. Verify every integrated component in the browser: render, hover, focus, keyboard, click, and at three widths.

## 8. Glossary (use these words in code and UI)

- Live / Unlive: whether a media is visible to viewers. Live means status PUBLISHED. Unlive means hidden but intact.
- Activity (user): something a user may do: sign in, watch, review. A ban blocks one activity.
- Restriction: an admin-applied ban on one activity with reason and optional expiry.
- Overview card: the final review card at the end of Add Media.
- Activity bar: the docked bottom bar listing media history rows.
- Presence: online state and current media id of a user.
- Broadcast: an admin-sent notification to all users or one user.
- Admin alert: an automatic notification to admins about a change in the app.
- Swarm peers: peers connected to a torrent. Viewers: signed-in users watching that media in the app right now.

## 9. Layering (z-index tokens, used nowhere else)

```
--z-content: 0      page content
--z-sticky: 20      sticky headers
--z-dock: 40        vertical dock sidebar
--z-activity-bar: 45 docked bottom bar
--z-popover: 60     menus, tooltips, inline popovers
--z-modal: 70       dialogs, overview card
--z-toast: 80       toasts
```

## 10. Quality bar for every workstream

- TypeScript strict, zero lint errors, zero console errors or warnings in the browser and the server.
- Keyboard accessible with visible focus. Admin is desktop-first (works from 1024 px up) with a graceful collapsed mode below that.
- Motion respects reduced motion. No hardcoded colours, radii, fonts or durations: tokens only.
- Every new endpoint: Zod validation, authorization, rate limiting where relevant, audit log, tests, docs.
- No secret in the browser, in logs, or in the repository. Telegram and OAuth secrets live in environment variables only.
- Every destructive action has a confirmation or an undo.

## 11. Stop conditions

Stop and report immediately if: a test fails and you are not sure why; a protected zone must change; a migration would be destructive; the regression comparison shows an unexplained difference; a ThreeUI bundle cannot be fetched or fails hash verification; a license or key is needed; or two requirements conflict.

Acknowledge by replying "Admin Master Context loaded", then summarize in 10 lines what you will and will not touch.
~~~

---

## 7. Prompt Y1: Audit and regression baseline (read only)

~~~text
PROMPT Y1: AUDIT AND REGRESSION BASELINE

This is a READ-ONLY task. Do not modify any source file. You may create files only under `docs/admin-baseline/` and a git branch named `chore/admin-baseline`. The only code allowed is the feature flag scaffold in section 9.

## 1. Detect the stack and what exists

Report with file paths as evidence:
1. Framework and version (the screenshot suggests Next.js running on localhost:3000). App Router or Pages Router? Server components, route handlers, middleware, server actions in use?
2. Language and strictness (`tsconfig`), package manager, scripts, lint and format setup, test runners.
3. Styling (Tailwind or CSS modules), design tokens, icon library, fonts, animation libraries, chart library (if any).
4. Data layer: database, ORM, migrations, seed script. Is there a real backend behind the admin, or is any admin data mocked?
5. Authentication: library or custom, session strategy, password hashing, roles, where the login page and any signup page and registration endpoint live.
6. Realtime today: any SSE, WebSocket, polling, or event emitter already present.
7. The torrent engine: location, public status accessors (peers, speeds, progress, files), how torrents map to titles.
8. Which of these exist: Title, Torrent, MediaAsset, Season, Episode, User, Profile, Session, WatchProgress, WatchEvent, Restriction or ban tables, AuditLog, Notification tables, tmdbId on Title, presence, search history, reviews.
9. Where `three` is installed and its version. Whether `@designcodeio/threeui` is installed or reachable, and under which license.
If the admin turns out to have NO real backend (only mock data), STOP and tell me. Building that is outside this pack.

## 2. Investigate the red "1 Issue" badge

The admin screenshot shows a red "1 Issue" badge at the bottom left that also overlaps the "Admin" label in the sidebar. It is a development overlay.
- Open the app in the browser, click the badge, and record the exact message, stack, file and line.
- Classify it: pre-existing and unrelated, pre-existing and inside admin scope, or caused by something else. Do NOT fix it in this task. Do NOT hide the overlay.
- Report whether it appears on other pages.

## 3. Admin inventory

Create `docs/admin-baseline/admin-inventory.md` listing every admin route, page, component and API route, with:
- What it does, who can access it, how to verify it manually (one line), automated test (file or "none"), and whether this overhaul touches it (Yes, No, Indirectly).
- The top bar: the search box ("Search media, torrents, or users..."), the "System Healthy" pill, the bell icon, the avatar. For each, say what it is wired to today (real data, static, or nothing).
- The sidebar: items, order, icons, active style, behavior at narrow widths.
- The four dashboard cards (Total Titles, Published, Pending Torrents, Active Users): the exact code and query behind each number. Specifically find where "Active Users" gets the value 24 and say whether it is real, seeded, or hardcoded. List every other hardcoded number or placeholder in admin components.
- The media table (Title, Type, Torrent Status, Actions): data source, actions available, empty state.
- The existing Add Media flow: every step and field, the API calls it makes, the validation, and exactly where the privacy and rights step lives (components, schema fields, server validation, database columns).
- The existing Torrent Health page, Users page and Settings page.

## 4. Login and user baseline

Document `docs/admin-baseline/auth-inventory.md`:
- Login page contents and behavior, signup page and registration endpoint, password rules, how users are created today, whether email is verified, role handling, session cookies.
- Everything that depends on signup working (links, redirects, tests, emails).
- Existing user restriction or suspension behavior (if any).

## 5. Visual baseline

Using the browser tool (or Playwright), capture screenshots at 1280, 1440 and 1920 px of: login, signup (if it exists), every admin page and every dialog or drawer reachable in the admin. Also capture the viewer home page and watch page (paused) as a non-regression reference. Save under `docs/admin-baseline/screenshots/<route>-<width>.png`. Disable animations while capturing and wait for network idle.

## 6. Test and quality baseline

Run and record lint, typecheck, unit, component, integration, e2e, accessibility checks, production build with bundle sizes, and Lighthouse for the admin dashboard and the viewer home. Save to `docs/admin-baseline/quality.md`. Mark anything already failing as PRE-EXISTING FAILURE and do not fix it here.

## 7. Dependency map for areas this overhaul will touch

For each, list the files and modules that import them (real imports), and rate regression risk Low, Medium or High with a reason:
- Admin layout, sidebar, top bar, route guards and middleware.
- Global styles, tokens, fonts, providers.
- Admin dashboard and its queries.
- Add Media flow, media table, torrent intake and parsing code.
- Torrent engine status accessors.
- User model, auth code, login page, signup page, user admin screens.
- Any code that reads or writes Title status, Torrent status, WatchProgress, or sessions.
Save to `docs/admin-baseline/impact-map.md`.

## 8. Data facts

- Row counts for Title, Torrent, User and WatchProgress in the dev database.
- Which tables exist for restrictions, audit logs, notifications, presence.
- Is `tmdbId` stored on Title? Are there titles without it?
- Is the rights and attestation data required (NOT NULL) anywhere?
- Which environment variables exist today.

## 9. Feature flag scaffold (the only code allowed)

Create a typed `featureFlags` module (and a server-side counterpart) with the flags named in the Admin Master Context, all default OFF in this task, readable from env and site settings. Add a unit test. Nothing may read the flags yet.

## 10. Deliverable

One summary message: detected stack, the "1 Issue" findings, the origin of the "24", counts of admin routes and components, pre-existing failures, the top 10 regression risks for this overhaul and your safeguards for each. Then STOP and wait for my approval before Y2.
~~~

---

## 8. Prompt Y2: ThreeUI vendoring, verification and adapters

~~~text
PROMPT Y2: THREEUI VENDORING, VERIFICATION AND ADAPTERS

Goal: bring four ThreeUI components into the project exactly as published, prove they are intact, and expose them through small adapters that the admin features will use. No admin screen changes in this task.

Branch: `feat/y2-threeui`. Nothing here is visible to users. Everything lives in new folders, and the demo page is dev only.

## 2.1 Preflight

1. Confirm the stack from Y1. Confirm network access to `threeui.com` and the package registry. If a bundle URL cannot be fetched, STOP and report. Do not recreate anything.
2. Record the license terms found in the bundles or the package. If a key, subscription or attribution is required that you cannot confirm, STOP and report.
3. Record the installed Three.js version. The dock needs Three.js r128. See rule 7.6 in the Admin Master Context for how to isolate it.
4. Create `src/vendor/threeui/` (exact files), `src/features/admin/ui/threeui/` (adapters), `docs/threeui-manifest.json`, `scripts/verify-threeui.mjs`, `FORKS.md`.

## 2.2 Fetch the four bundles

Fetch and read the complete registered source bundle for each component, in this order:
1. RectangleButtons, variant `bloom-outline-button`: https://threeui.com/source-code/rectangle-buttons.json
2. SkeuomorphicToggleCollection, variant `modern`: https://threeui.com/source-code/skeuomorphic-toggle.json
3. LiquidMetalButton, variant `circle` (Liquid Orb): https://threeui.com/source-code/liquid-metal-button.json
4. AnimatedTopDock, variant `sable`: https://threeui.com/source-code/animated-top-dock.json

For each bundle:
- Write every registered file to `src/vendor/threeui/<registered path without the leading src/>` preserving contents byte for byte (no formatting, no line ending changes, no lint fixes). Add the vendor folder to the ESLint, Prettier and tsconfig exclusion lists so tools never rewrite it, and mark it as generated in `.gitattributes` (`-diff`, `-text` as appropriate).
- Binary assets (the five `sf-*.woff2` fonts for RectangleButtons and `fragment-mono.woff2` for the dock) cannot be represented as text. Copy them byte for byte from the `@designcodeio/threeui` package. If the package is not accessible, STOP and report.
- The shared file `threeui.css` appears in every bundle with the same hash. Vendor it once and confirm all four bundles agree.

## 2.3 Hash verification

1. Build `docs/threeui-manifest.json` from Appendix A of this pack (path, kind, bytes where listed, SHA-256).
2. `scripts/verify-threeui.mjs` recomputes SHA-256 of every vendored file, compares with the manifest, checks byte lengths for the binary assets, and exits non-zero on any mismatch or missing file. It prints a table.
3. Add `npm run verify:threeui`, run it in CI and in a pre-commit hook that triggers when anything under `src/vendor/threeui/` changes.
4. If a hash does not match, STOP. Report the file, the expected hash and the actual hash. Do not "fix" the file by editing it, and do not update the manifest to match.

## 2.4 Dependencies

- Install only what the vendored sources actually import. List every dependency with version and why.
- Do not upgrade or downgrade anything that already exists. If a vendored component needs a different version of an existing dependency (especially Three.js), isolate it and report. If you cannot isolate it, STOP and ask.
- Confirm that the viewer app bundle does not grow (compare bundle analysis before and after). ThreeUI code must only be reachable from admin routes and the login page if used there.

## 2.5 Reality check (read the real source, then answer in writing)

Create `docs/threeui-reality-check.md`. For each of the four components, read the vendored source and answer with file and line evidence:
1. Is it a normal React component, or does it render an isolated HTML source (for example in an iframe or a shadow root)? How are the canonical HTML sources in `neuform-isolated/sources/` used?
2. Which props exist? Can it take a label or children? A click handler? A `checked` value and an `onChange`? A `disabled` state? A size? A `className`?
3. How does state get out of the component (callbacks, events, DOM events, `postMessage`)? How does state get in?
4. How does it size itself? Does it need a fixed container? Does it rely on global CSS or global variables?
5. What does it cost at runtime (WebGL contexts, animation frames, listeners)? Does it pause when offscreen or when the tab is hidden?
6. What does it do with `prefers-reduced-motion`?
7. How does the dock (`sable`) lay out its items, and which parts of `topDockController.ts` are tied to the horizontal axis (pointer proximity along x, items dropping along y, width growth, height growth, spring and damping)? Which props control those values (`proximity`, `spring`, `damping`, `widthGrowth`, `heightGrowth`, `drop`)?
Do not guess. If a question cannot be answered from the source, say so.

## 2.6 Adapters (in `src/features/admin/ui/threeui/`)

Each adapter is a `"use client"` component with typed props, an accessible name, keyboard support, a disabled and busy state, and a reduced-motion fallback. Use the configured props below exactly as the starting point. If the vendored component cannot do what the adapter needs, follow rule 7.3 (documented fork recorded in `FORKS.md`), never edit the vendor files.

### AdminBloomButton (RectangleButtons, variant `bloom-outline-button`)
- Configured usage: `variant="bloom-outline-button" mode="dark" hue={-52} saturation={1.00} brightness={1.00}`.
- Props: `label`, `onClick`, `href?`, `type`, `disabled`, `loading`, `size` ('sm' | 'md'), `intent` ('secondary' | 'danger'), `icon?`.
- Use: secondary actions everywhere appropriate in admin (Cancel, Back, Save draft, Browse Telegram, Clear filters, Export, Mark all read, Open full editor). Primary actions stay solid.
- Start with the configured hue. Then compare it on the admin background next to the violet accent. If it clashes, adjust ONLY the component's own `hue` prop, and show me both screenshots so I choose.
- Verify: pointer-positioned ink bloom, magnetic drift, sliding duplicate label all still work, and the label text can be changed per use.

### AdminToggle (SkeuomorphicToggleCollection, variant `modern`)
- Two configured tones:
  - `tone="add"`: `variant="modern" mode="auto" speed={1.50} size={0.84} opacity={1.00} hue={73} saturation={1.03} brightness={1.02}`. For on and off options inside the Add Media and Add User forms.
  - `tone="state"`: the same with `hue={-97}`. For live and unlive, and ban and unban.
- Props: `checked`, `onCheckedChange`, `label` (text shown with the toggle), `description?`, `disabled`, `busy` (shows a pending state while the server confirms), `tone`, `size`, `ariaLabel`.
- Controlled behavior: the toggle shows the server truth. On click it enters `busy`, calls the handler, and only changes appearance when the server confirms (or rolls back on error). No optimistic lies for live and ban states.
- The text inside must be changeable per use (for example "Go live after saving", "Notify all users", "Watching allowed"). If the vendored source hardcodes its text, make the minimal documented fork.
- Verify: stretching knob, check-to-dash mark, keyboard (Space toggles, focus ring), and screen reader role `switch` with the correct state.

### AdminOrbButton (LiquidMetalButton, variant `circle`, Liquid Orb)
- Configured usage: `variant="circle"`.
- Props: `onClick`, `ariaLabel` (required), `label?` (visible text rendered beside the orb, for example "Add Media" or "Add User"), `disabled`, `size` (56 to 72 px).
- Use: the add trigger for Add Media (Media Library) and Add User (Users).
- Performance: at most one orb mounted per screen, lazy loaded, paused when offscreen or the tab is hidden, static gradient circle with a plus when reduced motion is on or WebGL is unavailable.
- Verify: original interactions preserved, keyboard activation (Enter and Space), focus ring, correct hit target.

### AdminDockNav (AnimatedTopDock, variant `sable`, vertical)
- Configured usage: `variant="sable" proximity={122} spring={0.19} damping={0.70} widthGrowth={17} heightGrowth={16} drop={3.5}`.
- Props: `items` (id, label, icon, href, badge?), `activeId`, `collapsed?`, `onNavigate`.
- Vertical behavior: the capsule runs top to bottom along the left edge. Pointer proximity is measured along the vertical axis. Near the pointer an item springs sideways toward the content area (the `drop` value becomes a horizontal nudge) and grows along its main axes using `widthGrowth` and `heightGrowth`, with the same spring and damping feel as the original. The original horizontal behavior must remain available and unchanged in the vendored file.
- This will almost certainly need a documented fork of `topDockController.ts` and the layout parts of the component. Read the source first (section 2.5, question 7), then write the axis mapping in `FORKS.md` before changing anything, and show it to me.
- Accessibility: `nav` landmark with a label, `aria-current="page"` on the active item, arrow keys (Up and Down) move focus between items, Home and End jump, Enter activates. Hover effects must also work on keyboard focus.
- Reduced motion: no spring, items get a simple highlight.
- Collapsed mode (below 1024 px): a narrow icon-only rail with tooltips, or a drawer opened from a menu button.

## 2.7 Dev demo page

Create `/admin/__dev/threeui` (development builds only, returns 404 in production, admin-guarded): shows every adapter in all states (default, hover, focus, disabled, busy, checked, unchecked, reduced motion), plus the hash verification result and the dependency versions. Add a Playwright smoke test that loads it and checks that each component renders and responds to click and keyboard.

## 2.8 Phase gate

- `npm run verify:threeui` passes. The viewer app bundle size is unchanged.
- `docs/threeui-reality-check.md` and `FORKS.md` are complete and show exactly what was forked and why.
- All adapters render and behave on the dev page, with screenshots at 1280, 1440 and 1920 px.
- No existing test or page changed.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 9. Prompt Y3: Data model, contracts and migrations (additive only)

~~~text
PROMPT Y3: DATA MODEL, CONTRACTS AND MIGRATIONS

Goal: land every data and contract change the workstreams need, in one controlled step, without changing existing behavior.

Rules:
- Additive only. Do not rename, retype or drop existing columns, tables or endpoints. New columns on existing tables are nullable or have defaults. Use Y1's data facts to skip anything that already exists and reuse existing tables where they fit (extend them additively).
- Contract first: shared Zod schemas, then database, then API stubs.
- One migration per concern with a clear name and a down-migration note.
- If a column is currently NOT NULL and tied to the privacy and rights step, relaxing it to nullable is the ONLY allowed loosening. Do it in its own migration, flag it for my approval, and keep the column and data.

## Y3.1 Title additions
- `tmdbId` (nullable int, indexed) if missing.
- `liveAt`, `unliveAt` (nullable timestamps) and `deletedAt` if missing. Status stays as is: Live equals PUBLISHED, Unlive equals UNPUBLISHED or DRAFT.
- `sourceKind` enum `{ TELEGRAM, UPLOAD, MAGNET }` (nullable) and `sourceRef` (nullable JSON): for Telegram, `{ chatId, messageId, fileUniqueId, fileName }`; for magnet, `{ infohash }`.
- `removedAt` and `removedById` for the trash state, with retention {{TRASH_RETENTION_DAYS}} days.

## Y3.2 Media activity log
`MediaActivity`: id, titleId (nullable, survives hard delete), titleSnapshot (JSON: name, tmdbId, type, category, sourceKind, infohash, posterKey), action enum `{ CREATED, MODIFIED, REMOVED, RESTORED, WENT_LIVE, WENT_UNLIVE, SOURCE_CHANGED }`, changes (JSON array of `{ field, before, after }`, never binary data, long text truncated with a hash), actorId, requestId, createdAt. Indexes on `(titleId, createdAt desc)`, `(createdAt desc)`, `(action, createdAt desc)`. Append-only: no update or delete code paths.

## Y3.3 Admin alerts and preferences
- `AdminAlert`: id, category enum `{ MEDIA, TORRENT, USER, ACCESS, NOTIFICATION, SETTINGS, SYSTEM }`, severity enum `{ INFO, SUCCESS, WARNING, CRITICAL }`, title, body, entityType, entityId, actorId (nullable), dedupeKey (nullable), count (int default 1), meta (JSON), createdAt, lastOccurredAt. Index on `(createdAt desc)` and `(dedupeKey, lastOccurredAt desc)`.
- `AdminAlertRead`: alertId, adminId, readAt. Unique on the pair.
- `AdminAlertPref`: adminId, category, inApp (default true), desktop (default false), sound (default false). Unique on `(adminId, category)`.

## Y3.4 Broadcast notifications (admin to users)
- `Notification`: id, kind enum `{ BROADCAST, SYSTEM, FIRST_LOGIN_NOTICE, RESTRICTION, MEDIA }`, title (max 80), body (plain text, max {{MAX_BROADCAST_CHARS}}), linkUrl (nullable, internal paths only), audience enum `{ ALL, USER, USERS }`, createdById (nullable for system), scheduledFor (nullable), expiresAt (nullable), recalledAt (nullable), createdAt.
- `NotificationRecipient`: notificationId, userId, deliveredAt, readAt, dismissedAt. Unique on `(notificationId, userId)`. Index on `(userId, readAt, createdAt desc)`.

## Y3.5 Presence
`UserPresence`: userId (primary key), state enum `{ ONLINE, AWAY, OFFLINE }`, lastHeartbeatAt, lastSeenAt, currentMediaAssetId (nullable), currentTitleId (nullable), currentEpisodeId (nullable), currentPositionSec (nullable), currentSource enum `{ HEARTBEAT, PLAYBACK }` (nullable), deviceLabel (nullable, coarse like "Chrome on Windows"), updatedAt. Online is computed from `lastHeartbeatAt` and `{{ONLINE_TTL_SECONDS}}`, never trusted from a stored flag alone.

## Y3.6 Torrent health samples
`TorrentHealthSample`: id, torrentId, ts, resolution enum `{ FINE_30S, COARSE_5M }`, seeders, leechers, peersTotal, downloadBps, uploadBps, availability (float), progress (float), viewers (int), healthScore (int 0 to 100). Index on `(torrentId, resolution, ts desc)`. Retention: FINE_30S for 24 hours, COARSE_5M for 30 days. Live 2 second samples are NOT stored, they live in an in-memory ring buffer.

## Y3.7 Telegram index
`TelegramPost`: id, chatId, messageId, postedAt, kind enum `{ TORRENT_FILE, MAGNET, VIDEO, OTHER }`, text, caption, fileId, fileUniqueId, fileName, mimeType, sizeBytes, magnets (JSON array), hashtags (JSON array), editedAt, removedAt, indexedAt. Unique on `(chatId, messageId)`. Index on `(chatId, messageId desc)` and `(kind, postedAt desc)`, plus a full-text or trigram index on file name and caption.
Telegram settings (enabled, channel id, last update time, indexed count, last error) live in the existing site settings store. The bot token is an environment variable only and is never stored in the database.

## Y3.8 User access
- `User.createdByAdminId` (nullable), `User.firstLoginAt` (nullable), `User.passwordLoginAllowed` (boolean default true), `User.emailLoginAllowed` (boolean default true). Service rule: at least one of the two must stay true.
- `UserAuthMethod`: id, userId, type enum `{ OAUTH_EMAIL, OWN_PASSWORD }`, provider (nullable, for example google), providerAccountId (nullable), email (the verified email from the provider), passwordHash (nullable, only for OWN_PASSWORD), linkedAt, lastUsedAt, disabledAt. Unique on `(provider, providerAccountId)`. The existing password hash on `User` remains the designated password and is not moved.
- If a restriction table exists (Y1), extend its activity enum additively with `LOGIN`, `WATCH`, `REVIEW`. Otherwise create `UserRestriction`: id, userId, activity enum `{ LOGIN, WATCH, REVIEW }`, reason (required), expiresAt (nullable, null means permanent), createdById, createdAt, revokedAt, revokedById, revokeNote. Active means not revoked and not expired.
- Tombstone for permanent deletion if one does not exist (hashes only, no personal data).

## Y3.9 Realtime event log
`AdminEventLog`: id (monotonic bigint), type, payload (JSON), createdAt. Used for SSE replay with `Last-Event-ID`. Retention 24 hours. See Appendix C.

## Y3.10 Shared schemas (packages/shared or equivalent)
Zod schemas and types for: every event in Appendix C, dashboard snapshot, torrent health series and sample, activity row, alert, notification and recipient, presence, restriction, telegram post and browse query, add media payload (new `source` field and `options`), overview card model, create user payload.

## Y3.11 Contracts
Document every endpoint in Appendix E in `docs/api.md` with request and response schemas, auth, errors and rate limits. Route stubs returning 501 behind the flag are acceptable where logic arrives later.

## Y3.12 Verification
- Migrations apply on a clean database and on a copy of the dev database; each down-migration note verified.
- All existing tests pass unchanged. The regression comparison with the Y1 baseline shows zero differences.
- Schema tests for every new Zod schema (valid and invalid cases).
- A diff of the Prisma schema (or equivalent) and the OpenAPI document versus baseline must show additions plus the single approved nullability relaxation.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 10. Prompt Y4: Realtime backbone (event bus, SSE, presence)

~~~text
PROMPT Y4: REALTIME BACKBONE

Goal: one reliable realtime channel from the server to every open admin tab, plus presence tracking for users. Nothing in the admin UI changes yet. This is the foundation that W2 to W8 plug into.

Branch: `feat/y4-realtime`. Flags: `adminRealtime`, `adminPresence`. With both OFF, no new route is reachable and no hook runs.

## Y4.1 Plan first

Show: where the event bus will live, how events are emitted without touching many files (see Y4.3), the SSE route design for the detected stack, and the impact analysis. Wait for approval.

## Y4.2 Domain event bus

Create `src/server/realtime/` with:
- `eventBus.ts`: a typed singleton `publish(event)` and `subscribe(filter, handler)`. Events are validated against the shared Zod schemas from Y3 (Appendix C lists them).
- HMR safety (Next.js development): keep the singleton on `globalThis` under a symbol so hot reloads do not create duplicate buses or duplicate listeners. Write a test that imports the module twice and asserts one instance.
- Post-commit emission: events caused by database writes are published only AFTER the transaction commits. A rolled back transaction must emit nothing. Provide `emitAfterCommit(tx, event)` or the ORM equivalent.
- Persistence: events that admins should be able to replay are written to `AdminEventLog` (monotonic id) in the same step as publishing. High-frequency telemetry (torrent samples) is NOT persisted here.
- An adapter interface so a multi-instance deployment can later swap the in-process bus for Postgres LISTEN and NOTIFY or Redis pub and sub. Implement only the in-process version now.

## Y4.3 Emitting events without touching many files

The requirement "notify me of any change" must not turn into edits across the whole codebase. Use ONE choke point:
- Preferred: a data-layer extension or middleware (for Prisma, a client extension with query hooks) limited to a whitelist of models: Title, Torrent, MediaAsset, User, UserRestriction, UserAuthMethod, Notification, SiteSetting, TelegramPost. For each create, update and delete on those models it builds a domain event (with a minimal diff of changed fields) and calls `emitAfterCommit`.
- The extension must be a pure pass-through: same arguments, same results, same errors, same transaction behavior. Write tests that run the existing integration tests with the extension enabled and disabled and compare. Measure overhead and report it.
- If the data layer is not Prisma, implement the equivalent single choke point (repository wrapper, database triggers with LISTEN and NOTIFY, or ORM lifecycle hooks) and explain why.
- Fallback only if a choke point is impossible: explicit `publish` calls inside the new admin services, never inside existing viewer code.
- Non-database events: torrent engine state changes (derived by the sampler in W3 by diffing public status), presence changes (Y4.6), system health checks (disk, engine, Telegram, database), and scheduled jobs.
- Event metadata always includes: id, type, occurredAt, actor (admin or user id or system), entity type and id, and a request id when available.

## Y4.4 SSE endpoint

Route: `GET /api/admin/stream` (admin only).
- Next.js route handler details: `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`. Return a `Response` wrapping a `ReadableStream` with headers `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive` and `X-Accel-Buffering: no`. Clean up in `request.signal` abort. Make sure nothing in middleware or compression buffers the stream. Confirm it works behind `next dev` and `next start`.
- Query: `topics` (comma list of `dashboard`, `torrents`, `presence`, `activity`, `alerts`, `users`), optional `torrentIds` filter for the health view.
- Protocol (Appendix C): first event `hello` with server time, protocol version and the connection id. Then, for each requested topic, one `snapshot.<topic>` event, then deltas. Every event has an `id:` line (monotonic, from `AdminEventLog` for persistent events, from a per-connection counter for ephemeral ones) and a typed `event:` name. A comment line `: ping` every 15 seconds and `retry: 3000`.
- Resume: honor `Last-Event-ID`. If the id is within the retained window, replay missed persistent events in order. If not, send `resync` so the client refetches snapshots.
- Backpressure and coalescing: per-connection queue with a cap. High-frequency events (`torrent.sample`) use latest-wins by torrent id. Non-sample events are never dropped: if the queue would overflow, send `resync` and clear it.
- Security: validate the admin session on connect and re-validate every 60 seconds (close with an `auth` event if the session ended or the role changed). Limit 3 connections per admin. Never include secrets, password hashes, tokens, IP addresses or raw email addresses in events (use ids and display names).
- Observability: log connect and disconnect with counts, never payloads.

## Y4.5 Client side

Create `src/features/admin/realtime/`:
- `useAdminStream(topics)`: ONE `EventSource` per browser tab shared by all components (a module-level manager with reference counting per topic). Exposes `status` (`connecting`, `live`, `reconnecting`, `stale`), `lastEventAt`, and a typed subscription API.
- Reconnect with exponential backoff and jitter. Track sequence continuity; on a gap or a `resync` event, refetch the snapshot over normal HTTP and replace local state.
- Visibility: when the tab is hidden for more than 60 seconds, close the stream and resync on return. Pause chart rendering when hidden.
- State: small store slices per topic. Components subscribe to slices, not to the stream.
- `StreamStatusPill`: a tiny live indicator component (green pulse live, amber reconnecting, red stale) used by later workstreams.
- `stale` means values on screen may be old. Components must show that state visibly and never extrapolate numbers.

## Y4.6 Presence

Server:
- `POST /api/presence/heartbeat` (authenticated user, rate limit one per 5 seconds): body `{ state: "visible" | "hidden", mediaAssetId? }`. Updates `UserPresence`: `lastHeartbeatAt`, state, coarse device label (from the user agent, no IP stored).
- `POST /api/presence/offline` (beacon on page hide or sign out).
- Sweeper every 10 seconds: ONLINE if the last heartbeat is within {{ONLINE_TTL_SECONDS}}, otherwise OFFLINE. Hidden tabs send a heartbeat every 30 seconds with `hidden` and show as AWAY. Publish `presence.changed` only when the computed state or the current media changes.
- "Watching now" comes from the server's own playback records, not the browser's claim: whenever the existing playback progress write arrives (the player already saves progress about every 10 seconds), set `currentMediaAssetId`, `currentTitleId`, `currentEpisodeId` and `currentSource = PLAYBACK` through the data-layer hook from Y4.3 (no change to the progress route). A user counts as watching until 30 seconds after the last progress write. If a heartbeat carries a `mediaAssetId`, accept it only when it matches an active playback record, otherwise ignore it.
- Admin snapshot function `getPresenceSnapshot()` returns online users with their current media (media asset id, title id, title name, episode label, position) and counts.

Client (viewer app, behind `adminPresence`):
- A tiny client that sends a heartbeat every {{HEARTBEAT_SECONDS}} seconds while the tab is visible (every 30 when hidden), only when signed in, stops on sign out, sends the offline beacon on `pagehide`. No UI.
- Disclose it: add one line to the Privacy Policy page text saying that admins can see whether you are online and which title you are watching. Show me the proposed text first.

## Y4.7 Health of the realtime system itself

- `GET /api/admin/system/status`: DB, event bus, SSE connections count, torrent engine, Telegram, disk space. Used later by the "System" pill in W1.
- A scheduled check every 30 seconds publishes `system.health.changed` only when the state changes.

## Y4.8 Tests

- Unit: bus delivery order, filters, post-commit semantics (rolled back transaction emits nothing), HMR singleton, queue coalescing, Last-Event-ID replay window.
- Integration: connect without auth (401), as a normal user (403), as admin (hello and snapshot arrive); perform a database write and receive the delta within 1 second; kill and reconnect with Last-Event-ID and receive the missed events in order; flood with samples and confirm coalescing and that no persistent event is lost; session expiry closes the stream.
- Presence: fake timers for TTL, AWAY and OFFLINE transitions, heartbeat rate limit, PLAYBACK priority over heartbeat claims, forged `mediaAssetId` ignored.
- Regression: the existing integration suite passes with the data-layer extension ON and OFF, with identical results.

## Y4.9 Phase gate

Flags OFF: zero regression differences against the Y1 baseline. Flags ON: a small dev-only page `/admin/__dev/stream` shows the raw event stream with status, sequence numbers and a button that triggers sample mutations. Update PROGRESS.md and `docs/realtime.md`. Stop and wait for "continue".
~~~

---

## 11. Workstream W1: Admin shell, vertical dock sidebar, visual system

~~~text
WORKSTREAM W1: ADMIN SHELL, VERTICAL DOCK SIDEBAR, VISUAL SYSTEM

Goal: a completely new look for the admin area, built on the vertical Sable Dock sidebar, with the same routes, the same permissions, and the same capabilities as before.

Branch: `feat/w1-admin-shell`. Flags: `adminRedesign`, `adminDock`. With `adminRedesign` OFF the old shell renders. Run only after Y2 to Y4.

## W1.0 Plan first

Using the Y1 inventory and screenshots, show: the new layout wireframe (ASCII), which existing layout, sidebar and top bar components are replaced (not deleted), the flag switch location, and the impact analysis. Wait for approval.

## W1.1 Flag-switched shell

- The admin layout renders the NEW shell when `adminRedesign` is ON and the OLD shell when OFF. Both stay in the codebase until the final cleanup.
- Admin routes, route guards, middleware and the admin role check stay exactly as they are. Do not add routes except where later workstreams list them.
- Existing page components (Dashboard, Media Library, Torrent Health, Users, Settings) stay mounted at the same paths. Pages are restyled and, in later workstreams, upgraded. Nothing is removed in this workstream.

## W1.2 Layout

```
+--------+---------------------------------------------------------------+
| Dock   |  Top bar: search | system status | alerts bell | admin menu     |
| (left) +---------------------------------------------------------------+
|        |  Page header: title, subtitle, primary add control            |
|        |  Page content (scrolls)                                       |
|        |                                                               |
|        +---------------------------------------------------------------+
|        |  Activity bar slot (reserved, built in W7)                    |
+--------+---------------------------------------------------------------+
```

- The dock sits at the left, fixed, full height with margin, in the `--z-dock` layer. The content area takes the rest. Page content gets bottom padding equal to `--activity-bar-height` so nothing hides behind the activity bar later. Reserve that slot and CSS variable now.
- Minimum supported width 1024 px. Below that the dock collapses (W1.3).
- Pitch black canvas. No full-bleed bright areas.

## W1.3 Vertical Sable Dock sidebar

Use `AdminDockNav` from Y2 (do not re-implement it).
- Items in this order: Dashboard, Media Library, Torrent Health, Users, Notifications, Settings. Icons from the existing icon set, labels always visible when expanded.
- Brand block at the top: the existing KAMUNATI logo and the "ADMIN" tag exactly as they look today (same assets).
- Active item highlight uses the accent. Hover and proximity springs follow the dock's feel (configured props from Y2).
- Live badges (from the realtime store, never invented): Notifications shows the unread admin alert count; Torrent Health shows the number of torrents that need attention (health score below the warning level, see Appendix D); Users shows the online count. A badge with zero is hidden.
- Collapse control: expanded (about 216 px) and collapsed (about 72 px, icons only with tooltips). The choice is stored per admin in local storage and synced through the existing admin preferences if they exist.
- Below 1024 px: collapsed by default, with a menu button that opens the dock as a drawer.
- Keyboard: Up and Down move focus, Home and End jump, Enter opens. Shortcuts `g d` Dashboard, `g m` Media Library, `g t` Torrent Health, `g u` Users, `g n` Notifications, `g s` Settings. Show a shortcuts help dialog on `?`.
- Reduced motion: no springs, simple highlight.
- The bottom of the dock stays free: the admin identity chip moves into the top bar avatar menu. This also fixes the overlap between the "Admin" label and the development "1 Issue" badge seen in the screenshot (do not touch the badge itself).

## W1.4 Top bar

- Global search (keep what it searches today: media, torrents, users). Improve: grouped results with type labels, keyboard navigation, `/` focuses it, supports `tmdb:603` and plain numbers (treated as a TMDB id lookup first), recent searches in local storage. Results link to the existing pages.
- System status pill: REAL status from `GET /api/admin/system/status` and the realtime `system.health.changed` event: Healthy, Degraded or Down, with a popover listing each check (database, torrent engine, Telegram, realtime stream, disk). If the old pill was static, replace its data source and note it.
- Alerts bell: placeholder that renders the real unread count slot; W4 fills it.
- Stream status: a small live indicator (from Y4) near the pill.
- Admin avatar menu: name, role, a link to Settings, a link back to the viewer app, sign out (use the existing sign-out flow).

## W1.5 Visual system

- Tokens in Appendix B. Colours come from the existing admin: page `#0A0A0A`, dock and top bar `#000000`, cards near `#040607`, table headers `#181228`, accent `{{ADMIN_ACCENT}}`, success `#5BD68A`, warning `#F2C94C`, info `#6CB6FF`. Do not invent new brand colours.
- Surfaces: glass cards with hairline borders (accent at 25 to 35 percent alpha), soft inner highlight, no heavy shadows.
- Typography: keep the existing UI font. Metric numerals use tabular figures. If the vendored Fragment Mono font is licensed for this use (Y2 check), you may use it for metric numerals only.
- Components restyled with tokens: buttons (solid accent for primary, `AdminBloomButton` for secondary), inputs, selects, tabs, tables (sticky header, row hover, density), badges, status dots, dialogs, drawers, popovers, toasts, skeletons, empty states, error states, pagination.
- Motion: subtle. Page content fades and rises 8 px on route change. Dock and toggles carry the personality. Respect the existing motion levels and reduced motion.
- Tables: the existing media table keeps its columns (Title, Type, Torrent Status, Actions) and gains nothing until W7. Only the look changes.
- Loading and empty states for every admin page, written in plain specific language.

## W1.6 Responsiveness and accessibility

- Verify at 1024, 1280, 1440 and 1920 px, with the dock expanded and collapsed.
- Landmarks: `header`, `nav` (dock, labelled), `main`. Skip link first. Visible focus everywhere.
- Contrast: AA for every text token on every surface.
- Axe: zero serious or critical violations on every admin page.

## W1.7 Tests

- Component: dock items, active state, badge rendering (zero hidden), collapse persistence, keyboard navigation, shortcut keys, flag OFF renders the old shell (snapshot).
- E2E: navigate all five existing pages through the dock, role guard unchanged (a normal user still gets 403 on `/admin`), search finds a media by name and by `tmdb:` prefix, collapse and reload keeps the choice.
- Visual: screenshots of all admin pages compared with the Y1 baseline, grouped into requested change, side effect, regression.
- Regression: every admin route from Y1 resolves and every existing admin action still works.

## W1.8 Phase gate

Flag OFF: zero regression differences. Flag ON: all pages render in the new shell at all widths, with screenshots. Update PROGRESS.md and `docs/admin-ui.md`. Stop and wait for "continue".
~~~

---

## 12. Workstream W2: Live dashboard cards

~~~text
WORKSTREAM W2: LIVE DASHBOARD CARDS

Goal: dashboard cards that are read-only, computed from real data, and updated in realtime. Every rule from section 6 of the Admin Master Context ("Data integrity rules") applies and is tested.

Branch: `feat/w2-live-cards`. Flag: `adminLiveCards`. With the flag OFF the old cards render exactly as before.

## W2.0 Plan first

Using the Y1 findings, show: where each existing card gets its number today, where the "24" for Active Users comes from, and which of the old values are real. List what will be replaced. Wait for approval.

## W2.1 The cards

Keep the four existing cards and their labels, and add four more. Grid of 4 by 2.

| Card | Meaning | Source of truth (server function) | Recomputed when |
|---|---|---|---|
| Total Titles | Titles that exist and are not removed | count of Title where `removedAt` and `deletedAt` are null | title created, removed, restored |
| Published | Titles that are Live | count of Title where status is PUBLISHED and not removed | live toggled, title created or removed |
| Pending Torrents | Keep the existing meaning (confirm in Y1). Default: torrents queued or waiting for metadata or not yet playable | count from Torrent status | torrent status changes |
| Active Users | Users who are online right now | presence snapshot, heartbeat within {{ONLINE_TTL_SECONDS}} seconds | `presence.changed` |
| Watching Now | Users currently playing something | presence records with `currentSource = PLAYBACK` and fresh | `presence.changed` |
| Swarm Peers | Total peers across active torrents | sum from the latest health samples | every torrent sample batch |
| Unlive Titles | Titles that are hidden but kept | count of PUBLISHED excluded and not removed | live toggled |
| Restricted Users | Users with at least one active restriction | count of distinct users with an active restriction | restriction created, lifted or expired |

If the existing "Pending Torrents" meaning differs from the default, keep the existing meaning and say so.

## W2.2 One function, two outputs

- Create `DashboardService.getSnapshot()` that returns every metric with `asOf` and a sequence number. It is the ONLY place metrics are computed. The snapshot endpoint and the realtime deltas call the same function.
- After each relevant domain event (table above), wait 250 ms (debounce), recompute only the affected metrics, and publish `dashboard.metric.changed` with the new FULL values (not increments) and the new sequence number. Also recompute everything every 5 seconds as a safety net so any missed event heals itself.
- Persist one value per metric per minute in a small table `DashboardMetricSample` (key, ts, value), retention 7 days (a new additive migration, approve it first). The sparkline uses this history. The delta chip ("+3 in the last hour") is computed on the server from these samples.

## W2.3 Card design

- Anatomy: label, value, a 60 minute sparkline (from the stored samples plus the live tail), delta chip, a small live pulse, and "Updated 2s ago" (relative time formatting is the only client-side computation).
- The value animates between server values (count tween about 400 ms, instant with reduced motion). The final displayed value always equals the last server value.
- Accent colours per card follow the existing admin colours (violet, green, yellow, blue) and tokens for the new ones.
- Each card links to the relevant page with a filter (for example Pending Torrents opens Torrent Health filtered to pending, Active Users opens Users filtered to online).
- States: loading skeleton, live, reconnecting (pulse turns amber), stale (values dimmed with an "Out of date" label and the time of the last update), error with a retry.
- Read-only: no click target edits anything. No input anywhere on a card.
- A "Pause live updates" control for people who do not want moving numbers (WCAG pause, stop, hide). Paused cards show a "Paused" tag and a button to catch up.
- Accessibility: each card is a labelled region, values are real text, the sparkline has a text alternative ("Total Titles, 12, up 2 in the last hour"). Value changes are NOT announced continuously (`aria-live="off"`).
- Layout shift: fixed number width using tabular figures so changes never move the layout.

## W2.4 Integrity enforcement

1. `scripts/check-live-metrics.mjs` (run in CI): fails if files under the dashboard folder contain `Math.random`, numeric literals assigned to metric values, `setInterval` loops that change displayed numbers, or hardcoded sample arrays outside tests and the seed.
2. Integration test `dashboard-integrity`: after each of these mutations, query the database directly and assert the card values from the snapshot endpoint AND from the SSE delta equal the database truth within 2 seconds: create media, toggle live, remove media, restore media, create user, heartbeat from a user, start and stop playback records, add a torrent, change a torrent status, add and lift a restriction.
3. Race test: perform 50 rapid mutations and assert the final delta equals the database truth (debounce and ordering work).
4. Disconnect test: drop the stream, confirm the UI shows stale, restore it, confirm resync and correct values.
5. Remove the old hardcoded value ("24" or whatever Y1 found) and add a test that fails if that literal returns.

## W2.5 Tests and gate

- Unit: snapshot function on fixtures, debounce logic, delta chip computation, tween ends on the exact value.
- Component: all states (loading, live, reconnecting, stale, paused), links, accessibility roles.
- E2E: open the dashboard in one tab, add a media in another, see the cards change without refresh; create a user and see the count; log a user in and see Active Users change; ban an activity and see Restricted Users change.
- Flag OFF: zero regression differences. Flag ON: all checks pass with screenshots.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 13. Workstream W3: Live torrent health graphs

~~~text
WORKSTREAM W3: LIVE TORRENT HEALTH GRAPHS

Goal: a Torrent Health page that shows the health of every torrent in the app with live graphs, searchable by TMDB id or by name, including how many people are live in each torrent.

Branch: `feat/w3-torrent-health`. Flag: `adminTorrentLive`. With the flag OFF the old Torrent Health page renders as before. The torrent engine is a protected zone: this workstream only READS from it.

## W3.0 Plan first

Show: the engine's existing public status accessors (from Y1) and what each one gives (peers, seeders versus leechers if available, speeds, availability, progress). State clearly which fields we can show truthfully. If seeders versus leechers is not exposed, propose a minimal read-only accessor and WAIT for approval. Never invent values. Show the chart library decision (reuse the existing one if it handles streaming well, otherwise add uPlot, a small canvas chart library, and justify it). Wait for approval.

## W3.1 Sampler service (server)

Create `src/server/torrent-health/`:
- `TorrentHealthSampler`: reads the engine's public status for every ACTIVE torrent. Interval {{LIVE_SAMPLE_SECONDS}} seconds while at least one admin stream is subscribed to the `torrents` topic. Independently, every 30 seconds always (so history exists even when nobody is watching).
- Sample fields: seeders, leechers, peersTotal, downloadBps, uploadBps, availability, progress, viewers, healthScore. `viewers` is the number of distinct signed-in users whose presence shows `currentSource = PLAYBACK` on a media asset linked to this torrent (from the presence records, not from the browser).
- Never expose peer IP addresses or peer identities. Counts and aggregates only.
- In-memory ring buffers per torrent for live samples (about 5 minutes at 2 seconds). Persist `FINE_30S` rows every 30 seconds and aggregate `COARSE_5M` rows every 5 minutes (average, with min and max of peersTotal kept in the row if the schema has room, otherwise average only). Retention job: FINE 24 hours, COARSE 30 days.
- Publish `torrent.sample` (coalesced latest-wins per torrent) and `torrent.state.changed` (status transitions detected by diffing) through the event bus.
- Health score: the formula in Appendix D, unit tested with a table of cases.
- Cost control: no work for torrents that are not active in the engine. For EVICTED or PAUSED torrents show the last known sample with an "Inactive" state. A manual "Run health check" action (existing endpoint) is the only way to wake one.
- Alert rules (feeding W4): zero seeders for 2 minutes becomes CRITICAL, availability below 1.0 for 2 minutes becomes WARNING, stalled download (no progress for 5 minutes while leechers exist) becomes WARNING, recovery becomes SUCCESS. Require 3 consecutive samples to change state (hysteresis) and dedupe alerts.

## W3.2 Endpoints

- `GET /api/admin/torrent-health`: summary (counts of healthy, at risk, dead, inactive, total peers, total viewers) and the list with latest sample and a 60 sample sparkline per torrent.
- `GET /api/admin/torrent-health/lookup?q=`: lookup by TMDB id (number or `tmdb:603`), by name (title name, original name, torrent name, fuzzy), or by infohash prefix (at least 6 hex characters). Returns matching torrents grouped by title (a series can have several torrents).
- `GET /api/admin/torrent-health/:torrentId/series?window=live|1h|24h|7d`: samples for charts. `live` returns the ring buffer. The longer windows return stored rows decimated to at most 300 points per series (LTTB or similar).
- Realtime: topics `torrents` (snapshot, `torrent.sample`, `torrent.state.changed`). Optional `torrentIds` filter so a detail view only receives its torrent.
- All admin only, rate limited, validated, audited where they change anything (they are read only apart from the existing action buttons).

## W3.3 Page design

Route `/admin/torrent-health` (existing path).
- Top strip (live): total torrents, healthy, at risk, dead, inactive, total swarm peers, total viewers now. Each from the server snapshot.
- Overview chart (live): stacked areas of peers for the top torrents by peers, with "Other" grouped. Window selector.
- Two panes below:
  - Left: search and list. One search box. Accepts a TMDB id, a name, or an infohash prefix, URL-synced (`?q=` and `?tmdb=`). Filters: all, healthy, at risk, dead, inactive, currently watched. Each row: poster thumb, title name (and season label), TMDB id chip, a health dot with the score, a sparkline, peers and viewers numbers. Sort by health, peers, viewers, name.
  - Right: detail for the selected torrent, with this header: title, TMDB id chip, torrent name, infohash (copy), status, linked media ids, season and episode mapping when relevant, and a health gauge from 0 to 100 with level text (Excellent, Good, Fair, Poor, Dead).
- Detail charts (all live, synchronized crosshair, shared time axis):
  1. Swarm peers: seeders line, leechers line, total area.
  2. People watching in the app: stepped line of viewers, and a small list of who is watching now (display name and media id, linking to the user).
  3. Speed: download and upload.
  4. Availability and progress.
- Window tabs: Live (about 5 minutes at 2 second resolution), 1 hour, 24 hours, 7 days. Longer windows load stored history and keep appending the live tail.
- Controls: pause live, legend toggles, "View as table" (the last N samples as an accessible table), export CSV of the visible window.
- Actions (reuse existing endpoints, no engine changes): Run health check, Pause, Resume, Pre-cache, Open in Media Library. Use `AdminBloomButton` for these secondary actions.
- Alert thresholds panel (per admin, stored with admin preferences): toggles with `AdminToggle` (tone state) for each rule from W3.1.

## W3.4 Chart implementation rules

- Render with Canvas, never one DOM node per point. Batch updates in `requestAnimationFrame`. Cap rendered points (decimation). Pause rendering when the tab is hidden.
- Colours from tokens: seeders success, leechers info, total accent, viewers warning, speed uses accent and info. Do not rely on colour alone: line styles (solid and dashed) and direct labels.
- Accessibility: charts have a text summary that updates politely every 10 seconds ("12 peers, 4 seeders, 2 people watching") and the table view.
- Reduced motion: no animated transitions, data still updates live.
- Memory: live buffers are bounded. A test runs the chart for 10 minutes of simulated samples and asserts bounded memory and DOM size.
- Stale handling: if the stream is disconnected, charts freeze and show "Out of date" with the time of the last sample. They never extrapolate.

## W3.5 Tests and gate

- Unit: health score table, hysteresis, decimation, lookup parsing (`tmdb:603`, `603`, text, infohash prefix, ambiguous cases), ring buffer bounds, viewers computed from presence fixtures.
- Integration: sampler against a fake engine, SSE flow for `torrent.sample`, series endpoint windows, retention job, a test that proves no IP address or peer identity appears in any response or event.
- Component: search behavior, list sorting, chart updates with streamed samples, table view, stale state.
- E2E: add a torrent in the test swarm, see it appear live, change peers in the test harness and watch the chart move, search by TMDB id and by name, start playback as a user and see the viewers line step up.
- Regression: existing torrent actions (health check, pause, resume, pre-cache) still work as before.
- Flag OFF: zero regression differences. Flag ON: all checks pass with screenshots and a short screen recording of the live chart.

Update PROGRESS.md and `docs/torrent-health.md`. Stop and wait for "continue".
~~~

---

## 14. Workstream W4: Notifications

~~~text
WORKSTREAM W4: NOTIFICATIONS (ADMIN ALERTS, BROADCASTS, USER DELIVERY)

Goal: (A) admins are notified in real time about any change in the web application, and (B) admins can send a notification message to every user or to one particular user, and users receive it.

Branch: `feat/w4-notifications`. Flags: `adminAlerts`, `adminBroadcast`. With both OFF nothing new is reachable.

## W4.0 Plan first

Show: the event to alert mapping table (Appendix C), the user-side delivery placement (toast host, inbox page, unread dot on an existing navigation item) with screenshots of where it would sit, and the impact analysis. The user-side placement is the only viewer-app change here and needs my approval. Wait for approval.

## W4A. Admin alerts: notify me when anything changes

### A.1 Alert service
- `AlertService` subscribes to the event bus and creates `AdminAlert` rows from the catalog in Appendix C (category, severity, title and body templates, entity link).
- Coalescing: events with the same `dedupeKey` within 60 seconds update the existing alert (`count` increases, `lastOccurredAt` moves) instead of creating a new row. Example: 12 edits to the same media in a minute become one alert "Media updated (12 changes)".
- Actor handling: an admin's own actions appear in their own list already marked as read ("You updated ..."), and remain unread for other admins.
- Publish `alert.created` and `alert.updated` to the admin stream. Unread counts are computed on the server per admin and pushed with each event.
- Retention: 90 days (purge job).

### A.2 Bell and drawer
- The bell in the top bar shows the live unread count (badge hidden at zero) and has an accessible name with the count.
- Clicking opens a right drawer: tabs All, Unread, Warnings and above. Filters by category. Grouped by day. Each item shows an icon, title, one-line summary, relative time (tooltip with the exact timestamp), and a link to the entity (media, torrent, user, setting). Item actions: Mark read, Mute this category.
- Header actions: "Mark all read" (use `AdminBloomButton`), "Preferences".
- Preferences panel: per category toggles using `AdminToggle` (tone add): In-app, Desktop, Sound. Stored per admin (`AdminAlertPref`). Defaults: in-app on, desktop off, sound off.
- Live toasts: WARNING and CRITICAL alerts and any change made by another admin show a toast. INFO events only raise the badge. At most 3 toasts visible, extras collapse into "+N more".
- Desktop notifications: request permission only after the admin clicks "Enable desktop notifications". Send only when the tab is hidden, and only for categories that enabled desktop. Click focuses the tab and navigates to the entity.
- Sound: one soft chime, off by default, volume low, never plays more than once per 5 seconds.
- Accessibility: drawer traps focus and restores it, CRITICAL alerts are announced assertively, everything else politely, all controls labelled.

### A.3 Coverage test
Write a test that triggers every event in Appendix C once and asserts that a matching alert is created with the right category, severity and link. If an event in the catalog has no alert mapping, the test fails.

## W4B. Broadcast: admin sends a message to users

### B.1 Admin page
New dock item and page `/admin/notifications` with tabs Compose, Sent, Alerts (the same list as the bell, full width).

Compose:
- Audience: All users, One user, or Selected users. User picker with search by display name or email, online dot, and a count of recipients. Banned users still receive notifications (ban does not block reading messages), but the picker marks them.
- Fields: title (max 80), message (plain text, max {{MAX_BROADCAST_CHARS}} with a live counter), type (Info, Update, Warning, Maintenance), optional link (choose an internal page or a title; external links are not allowed), optional expiry, schedule (Send now or a date and time).
- Options with `AdminToggle` (tone add): "Show as a popup to users who are online now", "Keep in inbox".
- Live preview exactly as users will see it: the toast and the inbox row.
- Buttons: "Send" (primary, shows the audience size in a confirmation: "Send to 128 users?", with an extra confirmation step for All users), "Send test to me" (`AdminBloomButton`), "Save as draft" (`AdminBloomButton`).
- Rate limit: 10 broadcasts per hour per admin. Server-side validation with the shared schema. Plain text only, escaped everywhere.

Sent:
- Table: title, audience, sent time, recipients, delivered, read, status (Sent, Scheduled, Recalled, Expired). Row actions: View stats, Recall (removes it from inboxes and cancels scheduled sends), Duplicate.

### B.2 Backend
- `POST /api/admin/notifications` creates the notification and recipients in one transaction (fan out to the audience at send time), or schedules it. A scheduler job sends scheduled ones. `GET /api/admin/notifications`, `POST /api/admin/notifications/:id/recall`, `GET /api/admin/notifications/:id/stats`.
- Writes an audit entry and emits `notification.sent`, which becomes an admin alert.
- Delivery stats: `deliveredAt` is set when the message was pushed to an online user's stream or when the user's inbox was fetched. `readAt` when opened.

### B.3 User-side delivery (the only viewer-app change in this workstream)
- `GET /api/notifications` (the user's inbox, newest first, cursor), `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`, `GET /api/notifications/stream` (a small SSE channel for the signed-in user with `notification.new` events, reconnect with `Last-Event-ID`).
- A toast host that shows incoming messages (respecting motion levels and the existing toast style) and an inbox page `/notifications` that lists messages with read and unread states and a "Mark all read" button. A small unread dot on one existing navigation item (location approved in W4.0).
- On sign in, unread messages are delivered immediately (this is also how the first-login notice in W8 reaches the user).
- Plain text rendering only. Internal links only. Expired and recalled messages do not appear.

## W4.4 Tests
- Unit: coalescing and dedupe, actor handling, preference filtering, validation, fan-out, recall, expiry, scheduler.
- Integration: every catalog event creates the right alert, unread counts per admin, audience resolution (All, One, Selected), rate limits, recipients are never leaked to other users, recalled messages disappear, SSE delivery with reconnect.
- Component: bell count, drawer filters, preferences toggles, compose validation, preview fidelity, confirmation flow, toast collapsing.
- E2E: admin A edits media and admin B sees the alert and toast; admin sends a broadcast to one user and that user sees the toast and inbox entry; send to all with two users; schedule one for 1 minute later; recall one.
- Security: XSS attempts in title and message render as text, external links rejected, only admins can call admin endpoints, users cannot read other users' messages.
- Regression: viewer app features unchanged except the approved placement.

## W4.5 Phase gate
Flags OFF: zero regression differences. Flags ON: all checks pass with screenshots (bell, drawer, compose, sent, user toast, inbox). Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 15. Workstream W5: Telegram source (backend and browser)

~~~text
WORKSTREAM W5: TELEGRAM SOURCE

Goal: the admin can browse a Telegram channel where torrent files and magnet links are stored, traverse it, and pick a torrent file or magnet link as the source for a media. This workstream builds the integration and the picker component. W6 plugs the picker into Add Media.

Branch: `feat/w5-telegram`. Flag: `adminTelegram`. With the flag OFF nothing new is reachable and the app does not contact Telegram.

## W5.0 Read the current Telegram docs first (mandatory)

Before writing code, read the CURRENT official Telegram Bot API documentation and confirm each of these facts, citing the doc page for each. Report any difference from what is written here, and adapt the plan to the docs, not to this text:
1. A bot receives `channel_post` and `edited_channel_post` updates for a channel only when the bot has been added to that channel as an administrator, and the update types must be listed in `allowed_updates`.
2. `getUpdates` (long polling) and a webhook cannot be used at the same time.
3. The Bot API cannot list or fetch the past messages of a channel. A bot only sees posts made after it became an admin (plus messages that are forwarded to it).
4. `getFile` downloads through the standard cloud Bot API are limited to 20 MB. Small `.torrent` files are far below that. A self-hosted Bot API server raises the limit.
5. Which field currently carries the origin of a forwarded message (for example `forward_origin`, with older names such as `forward_from_chat`).
6. Rate limit and `retry_after` behavior on HTTP 429.
Show me the confirmation table. Then show the plan and the impact analysis. Wait for approval.

## W5.1 Configuration (environment only)

- `TELEGRAM_BOT_TOKEN` (secret), `TELEGRAM_CHANNEL_ID` (numeric id such as `-100...`; `{{TELEGRAM_CHANNEL}}` may be a username, resolve it to the id with `getChat` at setup), `TELEGRAM_INGEST_MODE` (`polling` or `webhook`, default `polling`), `TELEGRAM_WEBHOOK_SECRET` (random, used in the URL path and in the `X-Telegram-Bot-Api-Secret-Token` header), `TELEGRAM_API_BASE` (default `https://api.telegram.org`).
- Validate with Zod at startup. If anything is missing the Telegram feature stays disabled and the rest of the app starts normally. Never crash the app because of Telegram.
- The token never reaches the browser, the database, logs, error messages or analytics. Add a test that greps responses and logs for the token.

## W5.2 Ingest worker

- Where it runs (Next.js): prefer a separate worker process (`npm run worker:telegram`) that shares the codebase and the database. Fallback: start a singleton from `instrumentation.ts` for the Node runtime only. Never start background loops inside route handlers. Use a database advisory lock or lease row so only one poller runs even if the dev server reloads.
- Polling mode: `getUpdates` with `allowed_updates = ["channel_post", "edited_channel_post", "message"]` (the `message` type is only used for forwarded files sent to the bot privately, see W5.4), a long poll timeout of about 30 seconds, and the update offset persisted in the database so restarts do not lose or repeat updates. Back off with jitter on errors, honor `retry_after` on 429.
- Webhook mode (optional, production): `POST /api/telegram/webhook/<secret-path>` verifying the path secret AND the secret token header in constant time, answering 200 quickly and processing asynchronously. Setting the webhook is a manual documented step (`docs/telegram.md`).
- ALLOWLIST: only index posts whose chat id equals `TELEGRAM_CHANNEL_ID`. Ignore every other chat, including private chats, except forwarded posts whose origin chat equals the channel (W5.4). Drop everything else silently.
- Classification of each post into `TelegramPost`:
  - TORRENT_FILE: a document whose file name ends in `.torrent` or whose MIME type is `application/x-bittorrent`.
  - MAGNET: text or caption containing one or more `magnet:?xt=urn:btih:` links. Extract and validate each with the existing magnet parser. Store the list.
  - VIDEO: a video or a video document. Indexed for information, shown in the picker as "Video file (not a torrent)" and not selectable.
  - OTHER: anything else, counted but not listed by default.
- Extract hashtags from text and caption. Store the file name, size, MIME type, `file_id`, `file_unique_id`, caption, date and message id.
- Edited posts update the existing row (`editedAt`). Telegram does not notify bots about deletions, so deleted posts cannot be detected. If a later file fetch fails because the file is gone, mark the row `removedAt` and tell the admin.
- Publish `telegram.post.indexed` through the event bus for each new TORRENT_FILE or MAGNET post.
- Never index or store file contents. Only metadata. Torrent files are downloaded only when the admin picks one.

## W5.3 Picking: fetching the torrent file

- `POST /api/admin/telegram/posts/:id/fetch-torrent`: call `getFile`, download from the configured API base over HTTPS, with a hard size cap of 5 MB and a timeout. Verify it is valid bencode, then run it through the EXISTING torrent intake service function (the same one the upload endpoint uses), not through a copy. Return the same torrent summary as the upload path (name, infohash, size, piece length, files, trackers). Apply the existing blocklist check and duplicate detection.
- `POST /api/admin/telegram/posts/:id/use-magnet` with the chosen magnet index: run the existing magnet metadata fetch (30 second timeout) and return the same summary.
- Errors are specific and friendly: file too large, not a valid torrent, Telegram unavailable, file no longer available.
- The Telegram download URL (which contains the token) is built on the server only and never returned.

## W5.4 Older files (the Bot API cannot read history)

Document in `docs/telegram.md` and show in the picker's empty state:
1. Make the bot an administrator of the channel, then re-post any older files you want to use. They are indexed immediately.
2. Forward old posts from the channel to the bot in a private chat. The worker indexes forwarded channel posts when the origin chat equals the channel (using whichever origin field the current docs specify).
3. Optional and OFF by default: an MTProto backfill module using a user session. Do NOT implement it unless I explicitly ask. If I ask, first explain the tradeoffs (a sensitive session string to store encrypted, Telegram's rules about automated user accounts, rate limits) and wait for my decision.

## W5.5 Endpoints (admin only)

- `GET /api/admin/telegram/status`: enabled, mode, bot username (from `getMe`), channel title, last update time, indexed counts by kind, last error. Never the token.
- `POST /api/admin/telegram/test`: verifies the token with `getMe`, the channel with `getChat`, and that the bot is an administrator (`getChatMember`). Returns a checklist of results.
- `GET /api/admin/telegram/posts?kind=&q=&before=&after=&limit=`: cursor by message id (newest first), full-text search over file name, caption and hashtags, date filters. Each item also reports `alreadyUsedBy` (title name and id) when its infohash is already linked.
- `GET /api/admin/telegram/posts/:id`, plus the two fetch endpoints above.
- All validated with Zod, rate limited, audited when they download or change anything.

## W5.6 The picker component

Create `src/features/admin/telegram/TelegramPicker.tsx`, reusable by W6 and the Settings page.

Behavior and layout:
- A file-browser feel. Breadcrumb "Channel > {channel title}". Posts are grouped under date headers (Today, Yesterday, then month and year). This is how the admin traverses the channel: scroll down to load older posts (cursor based, virtualized), or use the "Jump to date" control to load posts around a date.
- Filter chips: Torrent files, Magnet links, All. Search box over file name, caption and hashtags (debounced).
- Each row: kind icon, file name (or magnet display name), size, date and time, caption excerpt, hashtag chips, and an "Already used in {title}" badge when applicable.
- Detail pane on the right (or below on narrow screens): full caption, file details, parsed magnets, message link (copy), and the main action "Use this torrent" (primary) or "Use this magnet". Secondary actions use `AdminBloomButton` ("Copy message link", "Refresh").
- Multi-select mode (off by default, on when the media is a series with several season torrents): pick several torrents in order.
- Live: new posts arrive through `telegram.post.indexed` and appear behind a "N new files" pill at the top (the list never jumps under the cursor).
- Keyboard: Up and Down move through rows, Enter selects, `/` focuses search.
- States: not configured (a setup card with the checklist from Appendix G and a link to Settings), configured but empty (instructions from W5.4), loading skeletons, error with retry, rate limited.
- No Telegram data leaves the admin area. Nothing is sent to any third party except Telegram.

Settings: add an "Integrations" section with a Telegram card: status, channel title, bot username, last update, indexed counts, an `AdminToggle` (tone state) to enable or disable the integration, and a "Test connection" `AdminBloomButton` that runs the checklist. The token is never displayed.

## W5.7 Tests (no real network)

- A small fake Bot API server in the test harness (MSW or a local express app) that serves `getUpdates`, `getMe`, `getChat`, `getChatMember`, `getFile` and file downloads.
- Unit: classification fixtures (torrent document, magnet in text, magnet in caption, several magnets, video, OTHER, forwarded post from the channel, forwarded post from a different chat), allowlist, edits, offset persistence, 429 backoff, size cap, invalid bencode rejected, token never in logs or responses.
- Integration: post appears in the browse endpoint within 3 seconds, fetch-torrent returns a summary through the existing intake, duplicates and blocklisted infohashes are reported, search and cursor pagination.
- Component: picker states, grouping, jump to date, new-posts pill, keyboard navigation, multi-select.
- Security: only admins reach any endpoint, webhook path and header verification, Telegram unreachable does not break the app.
- Flag OFF: zero regression differences.

## W5.8 Phase gate
With the fake Bot API: post a `.torrent` document, see it in the picker, pick it, see the parsed summary. `docs/telegram.md` includes the setup checklist (Appendix G). Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 16. Workstream W6: Add Media v2 with final overview card

~~~text
WORKSTREAM W6: ADD MEDIA V2

Goal: a new Add Media flow without the privacy and rights step, with three ways to choose the torrent source (Telegram channel, uploaded file, manual magnet link), on and off options, and a final overview card showing every detail before anything is saved.

Branch: `feat/w6-add-media-v2`. Flag: `adminAddMediaV2`. With the flag OFF the existing Add Media flow runs exactly as before. Run after W5.

## W6.0 Plan first

Using Y1, list the existing steps and fields. State exactly which parts stay as they are, which step is removed (privacy and rights), and which are new. Show the wizard wireframe and the overview card wireframe. Wait for approval.

## W6.1 Entry point

- In Media Library, the Add Media trigger becomes `AdminOrbButton` with the visible label "Add Media" (replaces the "+ Add Media" button when the flag is ON). The empty state sentence ("No media found. Click "Add Media" to get started.") stays and points to the same control.
- The flow opens at `/admin/media/new`. Drafts are resumable at `/admin/media/:id/edit?step=` and autosave as in the existing flow. If the existing flow is a dialog, keep its container type unless the audit shows it cannot hold the new steps (then ask).

## W6.2 Steps

Keep every existing step and field in its current order, except the removed one. New or changed parts are marked.

1. Details (existing). Includes title, type, category if it exists, TMDB id, synopsis, year, genres, cast and so on. TMDB id is stored on the title (Y3).
2. Artwork (existing).
3. Source (CHANGED): the torrent or magnet source, with three tabs.
   - Telegram channel: embeds `TelegramPicker` (W5). Picking a torrent calls fetch-torrent and shows the torrent summary card. Picking a magnet shows the magnet summary after the metadata fetch.
   - Upload torrent file: the existing drag and drop intake with the same 5 MB cap and validations.
   - Magnet link: paste field with live validation (must contain `xt=urn:btih:`), "Fetch details" button (30 second metadata timeout using the existing engine function), a clear timeout message that explains the torrent may have no peers, and "Retry". Without metadata the flow cannot continue to file mapping (offer "Save as draft").
   - Common: after a source is confirmed, show the summary card (name, infohash, total size, piece size, file count, trackers count) with a "Change source" button. Changing a confirmed source asks "Replace the current source?" and keeps the draft otherwise.
   - Duplicate and blocklist checks: if the infohash is already used by another title, show which title and offer "Use existing torrent" or "Cancel". If blocklisted, explain and block.
4. File mapping (existing): main file for a movie, episode mapper for a series. Unchanged logic.
5. Subtitles (existing).
6. Options (NEW): `AdminToggle` switches (tone add) with explicit labels:
   - "Go live after saving" (default OFF).
   - "Notify all users about this title" (default OFF, only enabled when going live).
   - "Pre-cache the start of the video" (only if the existing engine action is available).
   - Any other option the audit finds already exists in the old flow (for example "Feature on the home page") keeps its place here.
   Each toggle shows a one-line description. Disabled options explain why.
7. Overview (NEW): the final overview card (W6.3).

REMOVED: the privacy and rights step. Remove it from the UI, from the step list, from the stepper, from the validation schema of the Add Media payload, and from the server-side publish validation (when the flag is ON, rights fields are optional and never block saving or going live). Do NOT drop database columns, do NOT delete existing rights data, and do NOT change how existing titles display. If the old edit screens would otherwise block saving because of rights fields, make those fields optional there too, under the same flag, and tell me.

## W6.3 Final overview card

A large modal card in the `--z-modal` layer (opens automatically after the last step, and from a persistent "Review" button in the stepper). It shows EVERY detail of what is about to be added, read-only, in sections. Each section has a small "Edit" `AdminBloomButton` that closes the card and jumps to that step.

Sections:
1. Header: poster, backdrop and any hover banner previews, name, original name, type and category, year, runtime, maturity rating, language and country, genres, TMDB id, tagline.
2. Synopsis (scrollable) and cast and crew.
3. Source: kind badge (Telegram, Upload or Magnet). For Telegram: channel title, file name, size, posted date and time, message link. For all torrents: name, infohash (copy button), total size, piece size, trackers count, a collapsed file tree. For magnet: infohash and trackers.
4. File mapping: for a movie the chosen file with size; for a series a table of seasons and episodes with the mapped file, and flagged problems (unmapped, duplicate, gaps).
5. Subtitles: language, label, default flag.
6. Options: each toggle and its value.
7. Checks: blocking errors (red) and warnings (amber), for example missing poster, no seeders found in the quick check, duplicate source, unmapped episodes, no synopsis. Blocking errors disable the confirm button and explain what to fix with a link to the step.
8. What will happen: plain-language sentences generated from the draft, with live numbers from the server: "This will add 'Title' as a Movie in Anime, attach 1 torrent (4.2 GB), make it live and notify 128 users."

Buttons: "Back" (`AdminBloomButton`), "Save as draft" (`AdminBloomButton`), "Confirm and add" (primary). After a successful save show a success state with "Open in Media Library" and "Add another" (`AdminBloomButton`).
Accessibility: the card is a dialog with a labelled heading, focus trapped and restored, Escape closes it (no loss of the draft), sections navigable by keyboard, the confirm button is not the default focus.

## W6.4 Saving

- `POST /api/admin/media` (v2): one transaction creating the title, torrent link, media assets, mapping, subtitles references and the `MediaActivity` row (action CREATED, with a full snapshot), then, if chosen, setting live and creating the broadcast. Requires an idempotency key header so a double click or a retry never creates two titles.
- If going live fails validation, the title is still saved as a draft and the response explains why.
- Emits events: `media.created`, `media.went_live` (if applicable), `notification.sent` (if applicable). They feed the dashboard, activity bar and admin alerts through the bus.
- Audit entry with the actor and the summary. No secrets, no file contents.
- The existing endpoints stay untouched and working.

## W6.5 Tests

- Wizard: each source path completes (Telegram via the fake Bot API, upload, magnet with a local test swarm), source switching confirmation, duplicate and blocklist handling, magnet timeout handling.
- Rights removal: no rights step in the stepper, no rights fields in the payload, publish validation accepts a title without rights data, existing titles with rights data still render, the old flow (flag OFF) still requires what it required.
- Overview fidelity test: for a fully filled draft, every field in the draft appears in the card with the right value (a test that walks the draft schema and fails when a field is not shown).
- Idempotency: submitting twice with the same key creates one title.
- E2E: add a media via Telegram, confirm, then see it in the media table, the dashboard counters change live, the activity bar gets a new row (after W7), an admin alert is created, and when "Notify all users" was on, a user receives the notification.
- Regression: the old Add Media flow (flag OFF) and all existing media actions behave as before.

## W6.6 Phase gate
Flag OFF: zero regression differences. Flag ON: all checks pass with screenshots of every step and the overview card at 1280, 1440 and 1920 px. Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 17. Workstream W7: Media activity bar

~~~text
WORKSTREAM W7: MEDIA ACTIVITY BAR

Goal: a bar docked at the bottom of the admin that lists the media you uploaded, modified and removed, with metadata, change history and date and time stamps, where you can modify, toggle live, or delete a media directly in its row, without opening a card.

Branch: `feat/w7-activity-bar`. Flag: `adminActivityBar`. With the flag OFF the admin shell has no bar and everything else is as before. Run after W6 (it consumes events from earlier workstreams).

## W7.0 Plan first

Show the bar wireframe (collapsed, expanded, a row in normal, expanded-history and edit mode), the row view model, and how history is recorded for changes made anywhere (see W7.3). Wait for approval.

## W7.1 The bar

- Docked at the bottom of the admin content area (right of the dock sidebar), in the `--z-activity-bar` layer. It is part of the layout, not an overlay: it publishes its current height in `--activity-bar-height`, and page content pads itself by that amount (use a ResizeObserver so collapsed, expanded and resized states never cover content).
- Collapsed (about 56 px): "Activity" label, a live pulse, the latest event in one line ("Edited 'Title' 12s ago by Admin"), a count of events today, and an expand button.
- Expanded: height about 40 percent of the viewport by default. A drag handle resizes it (up to 70 percent). Height and open state are remembered per admin. Keyboard: `a` toggles it, Escape collapses it.
- Header inside the expanded bar: filter chips All, Uploaded, Modified, Removed, Live, Unlive; search (title, TMDB id, infohash prefix); source filter (Telegram, Upload, Magnet); date range; sort (last activity, created, title). Result count. A hide button (also in the admin menu as a preference) removes the bar entirely.
- Visible on every admin page.

## W7.2 Rows

The list shows one row (one "bar") per media, newest activity first, including removed media. Rows are horizontal and compact.

Row content, left to right:
- Small poster thumbnail, title and a chip for type and category, TMDB id chip.
- Source badge (Telegram, Upload, Magnet) and a short infohash with a copy button.
- Torrent health dot with the score (live from W3), and total size.
- Live switch: `AdminToggle` (tone state) with the label "Live". ON means live, OFF means unlive.
- Timestamps: Created (absolute with relative tooltip), Last modified with the admin's name, and Removed (when applicable). Absolute times use the admin's locale and time zone, with seconds, and a tooltip with UTC.
- Actions: Edit (pencil), History (chevron), Delete (bin).

Row states:
- Normal, Expanded (history), Editing, Confirming delete, Busy (server working), Removed (dimmed, "Removed" badge, shows Restore and "Delete permanently").
- A row being edited is pinned: realtime updates never move or replace it. If something else changes that media meanwhile, a small inline banner says "Changed by {name} just now. Reload this row?".

## W7.3 History: "modifications made" with timestamps

- Expanding a row (History chevron, `aria-expanded`) reveals, inside the same row, a timeline of `MediaActivity` entries newest first: action (Uploaded, Modified, Went live, Went unlive, Source changed, Removed, Restored), actor, exact timestamp, and change chips that say what changed: "Synopsis edited", "Poster replaced", "Category: Movie to Anime", "Year: 2019 to 2020", "TMDB id set to 603". Long text changes show a short before and after excerpt on click, inline.
- ALL changes are captured, wherever they are made (the old media table, the new Add Media flow, API calls, scripts), through the single data-layer hook from Y4.3. The hook builds the diff: tracked fields only (name, original name, type, category, year, runtime, synopsis, tagline, maturity, language, country, genres, TMDB id, status, artwork keys, source kind and reference, infohash, subtitles added or removed), ignores noise (`updatedAt`, counters, denormalized fields), truncates long text (store a hash plus the excerpt), and records binary changes as "replaced" with the new hash. Entries are append-only.
- History persists after the media is removed or permanently deleted (the title snapshot stays in the row).

## W7.4 Inline modify (no card, no modal)

- The Edit button turns the row into an inline editor, inside the bar. Quick fields: title, original title, year, category, TMDB id, genres (chips), synopsis (auto-growing text area with a counter), maturity rating. Buttons: "Save" (primary, small) and "Cancel" (`AdminBloomButton`). Validation uses the shared schemas with inline messages.
- Saving calls the existing title update endpoint (reuse it) with its version check. A conflict shows the inline message above and offers to reload the row.
- "Replace thumbnail": a small drop target inside the editor using the existing artwork upload endpoint.
- "Replace source" (build this after the core works): an inline disclosure with compact versions of the three source options (Telegram picker in compact mode, upload, magnet). It uses the safe replace behavior: keep media asset ids stable where the mapping matches so watch progress and subtitles survive, show an inline impact preview ("2 episodes change, 1 loses its file"), require confirmation, and remove the old torrent only after the new mapping is saved and probed. If the existing replace endpoint is not there, build it in the admin service layer without touching the engine.
- "Open full editor" (`AdminBloomButton`) is available for deep edits, but nothing in the bar requires it.

## W7.5 Live toggle

- The switch shows `busy` until the server confirms. It never changes appearance on an optimistic guess.
- Turning ON: the existing publish validation runs (rights fields are no longer required). If it fails, the row shows the exact reasons inline with a link to fix them, and the switch stays OFF.
- Turning OFF: if people are watching this media right now (count from presence), an inline popover asks: "N people are watching. Keep playback until they finish, or stop now?" (default: keep). New sessions are blocked immediately. Stopping now uses the playback restriction hook from W8.
- Each change creates `WENT_LIVE` or `WENT_UNLIVE` history entries and publishes events (dashboard, alerts, activity).

## W7.6 Delete (remove) and restore

- The bin turns the row into a confirm state inline: "Remove 'Title'? It stays in the trash for {{TRASH_RETENTION_DAYS}} days." with Remove (danger) and Cancel (`AdminBloomButton`). When viewers are present the same "keep or stop" choice appears.
- Remove sets `removedAt` and `removedById`, makes it unlive, keeps all data. The row remains in the list as Removed. A toast offers Undo for 10 seconds.
- Removed rows show "Restore" and "Delete permanently". Permanent deletion needs a typed confirmation of the title and is recorded in history (the snapshot remains). A scheduled job permanently deletes items after the retention period, logs it, and keeps the snapshot row.
- Existing delete actions elsewhere keep working and are captured by the same history hook.

## W7.7 Backend

- `GET /api/admin/media-activity/rows?filter=&q=&source=&from=&to=&sort=&cursor=`: the row view model (title fields, latest activity, last modifier, health score, viewers, live state, removed state). Cursor pagination by last activity.
- `GET /api/admin/media-activity/:titleId/history?cursor=`: the timeline.
- `POST /api/admin/titles/:id/live` with `{ live, stopActiveStreams? }`, `POST /api/admin/titles/:id/remove`, `POST /api/admin/titles/:id/restore`, `DELETE /api/admin/titles/:id/permanent` (typed confirmation in the body).
- All admin only, validated, audited, rate limited. They call the same services as the existing endpoints.
- Realtime: topic `activity` with `activity.new` (a new row or a changed row, with the full new row view model). Snapshot on connect.

## W7.8 Performance and accessibility

- Virtualize the list (use the existing virtualization library if present). 1000 rows must scroll smoothly. Rows have stable keys and memoized content. A realtime update re-renders only its row.
- Animations: a brief highlight on changed rows, new rows slide in (opacity and transform only), respecting motion levels.
- Semantics: the list is a labelled region; each row has an accessible name (title and state); every row action is a real button with a label; expanded state uses `aria-expanded`; the inline editor traps nothing and Escape cancels it. Live changes to the bar are announced politely in a summarized way ("3 new activities"), not per event.
- The bar must never trap keyboard focus or cover the page's last row of content.

## W7.9 Tests

- Unit: diff generator (tracked fields, noise ignored, truncation, binary), row view model, filters, undo window logic, retention job.
- Integration: every kind of title change creates the right history entry regardless of origin (old table action, new flow, direct API), live toggle with and without viewers, remove, restore, permanent delete with typed confirmation, conflict handling.
- Component: all row states, pinned editing row with banner, keyboard operation, collapsed and expanded layout variable updates, a11y roles.
- E2E: add a media, see its row appear; edit inline and see the history chip and timestamp; toggle live and watch the dashboard and a viewer's catalog change; delete and restore; two admins in two tabs see each other's changes live.
- Performance: 1000 rows scroll test, update burst test (100 events in 5 seconds).
- Regression: the old media table and its actions behave as before.

## W7.10 Phase gate
Flag OFF: zero regression differences. Flag ON: all checks pass with screenshots (collapsed, expanded, history, editing, delete confirm, removed). Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 18. Workstream W8: User management, closed signup, dual login, presence

~~~text
WORKSTREAM W8: USER MANAGEMENT, CLOSED SIGNUP, DUAL LOGIN, PRESENCE

Goal: only admins create, remove and restrict users. There is no signup. Users sign in with the password the admin designated; after their first login they can also sign in with their email account (same email id). Admins see who is online and what media they are watching.

Branch: `feat/w8-user-access`. Flags: `closedSignup`, `dualLogin`, `adminUserAccess`, `adminPresence`. With all OFF the old behavior is exactly as before. Run after W4 (the first-login notice uses notifications).

## W8.0 Plan first

Using Y1's auth inventory, show: every place signup is referenced (links, routes, emails, tests), how sessions are created today (the existing "create session for user" function), how passwords are hashed, the exact diff proposed for the playback endpoints (see W8.5), and the impact analysis. If sessions cannot be created by a callable function without touching token logic, STOP and propose the smallest addition. Wait for approval.

## W8.1 Closed signup (`closedSignup`)

- Remove the signup link, button and page. `/signup` and any alias redirect permanently to `/login`. Remove "Create account" text from the login page and any email templates.
- The registration endpoint returns `403 SIGNUP_DISABLED`. Keep the code in place (do not delete it) until final cleanup.
- Nothing may create an account except an admin action in this workstream. In particular, OAuth sign-in (W8.3) never creates accounts.
- Update or retire tests that depend on public signup only after I approve each one by name.

## W8.2 Admin Users page (`adminUserAccess`)

Restyle the existing Users page in the new shell and add the features below. Existing capabilities (list, role change, suspend, sessions) keep working.

Table:
- Columns: avatar, display name, email, role, status, online dot (live), current media, last seen, first login, sign-in methods (chips: Password, Google or Own password), active restrictions (chips), created by and date.
- Online dot states from presence: Online (green), Away (amber), Offline (grey). Updates live through the admin stream, with a stale indicator when disconnected.
- Current media cell: the title name, the media asset id as a chip (`media #123`, copy button), the episode label and position when relevant, and how long ("for 14 min"). Clicking opens that title in the Media Library. Empty when not watching.
- Filters: All, Online, Watching now, Restricted, Never signed in, Admins. Search by name, email or media id.
- Add User: `AdminOrbButton` with the visible label "Add User".

Add User dialog:
- Fields: display name, email (unique, case-insensitive), role (USER by default; ADMIN only selectable by SUPER_ADMIN), designated password.
- Designated password: "Generate" (16 random characters from a secure generator, with a copy button) or type one (minimum 10 characters, strength shown with the existing strength logic if the app has it). The plaintext password is shown ONCE after creation in a "Credentials" card with "Copy email and password". It is never stored, never logged, never sent by email by the app, and never returned again.
- Options with `AdminToggle` (tone add): "Account active" (default ON), "Allow sign-in with email account after first login" (default ON), "Send the first-login notice" (default ON).
- Buttons: "Create user" (primary), "Cancel" (`AdminBloomButton`).
- Server: validates, hashes with the existing hashing function and parameters, creates the user (and the single profile if the profile model exists), sets `createdByAdminId`, writes the audit entry `USER_CREATED_BY_ADMIN`, emits `user.created`. Rate limited.

Per-user actions (drawer or inline menu):
- Reset designated password (generate or type, shown once, revokes that user's sessions, audited).
- Revoke all sessions.
- Sign-in method switches: `AdminToggle` (tone state) for "Password sign-in" and "Email-account sign-in". The server enforces that at least one stays ON.
- Remove user: permanent deletion. Confirmation requires typing the username and re-entering the admin's own password, with a short cooldown on the final button. Rules enforced on the server: an admin cannot delete themselves here, the last SUPER_ADMIN can never be deleted, an ADMIN cannot delete another ADMIN or a SUPER_ADMIN, a SUPER_ADMIN can delete ADMIN and USER. In one transaction delete the user's data (sessions, tokens, auth methods, presence, profile and preferences, watch progress and events, My List, ratings, search history, reviews, notifications and recipients, restrictions), keep audit and report history with personal data removed, write a tombstone (hashes only), and invalidate everything (stream tokens fail because the user no longer exists). If a permanent-deletion implementation already exists from an earlier pack, REUSE it and only wire the UI.

## W8.3 Dual login (`dualLogin`)

Methods:
- Method A, always: the designated password (the existing credentials login, unchanged).
- Method B, available after the first successful Method A login (`firstLoginAt` is set): the user's own email account on the same email id, according to `{{EMAIL_LOGIN_MODE}}`.

HARD RULE: the app never asks for, receives, proxies, or stores a user's email-provider password. No "enter your Gmail password" field, no IMAP or SMTP password checks, ever. The email account's own password is typed only on the provider's own sign-in page.

Mode `oauth` (default):
- A "Continue with Google" button on the login page (providers from `{{OAUTH_PROVIDERS}}`). Use a maintained library (the one already used for auth if any, otherwise a small well-known OIDC client) with Authorization Code plus PKCE, `state` and `nonce`, scopes `openid email profile`.
- Matching: require `email_verified` to be true, compare the provider email with `User.email` case-insensitively, and sign in ONLY if that user exists. Never create an account. Never link by an unverified email. If no user matches, show a neutral message: "This email isn't enabled for access. Ask the admin." (no hint about which emails exist).
- Gating: the account must have `firstLoginAt`, `emailLoginAllowed` true and no active LOGIN restriction. Otherwise show the right neutral message ("Sign in with the password your admin gave you first" or "Your access is paused").
- On the first successful provider sign-in create `UserAuthMethod(OAUTH_EMAIL)` with the provider account id, then reuse the existing session creation function so sessions, cookies and CSRF behave exactly like password logins. Record `lastUsedAt`.
- Config: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_REDIRECT_BASE`. Document the Google Cloud setup (consent screen, authorized redirect URIs for localhost and production) in `docs/oauth.md`. Secrets only in environment variables.
- Protect against open redirects on any `next` parameter, replay of the state, and session fixation.

Mode `own-password` (only if I choose it):
- After the first login the user can set a second password (in Settings, reusing the existing change-password UI if present). Store it hashed in `UserAuthMethod(OWN_PASSWORD)`.
- The same login form accepts either password for the same email. Rate limits and lockout apply per account across both passwords. Error messages never reveal which password was wrong.

The login page:
- Signup is gone. The form signs in with the designated password.
- Add exactly ONE notice card, with the text in Appendix F, and nothing else informational. It explains only the dual-login behavior. In mode `oauth` the "Continue with Google" button sits under the form.
- Everything else about the login page stays as it is today.

First-login notification:
- On the first successful login (any method A), set `firstLoginAt` and create one `Notification` of kind `FIRST_LOGIN_NOTICE` for that user (idempotent: unique per user and kind) with the text in Appendix F. It is delivered immediately as a toast and appears in the inbox (W4). Emit `user.first_login` so admins get an alert.

Audit and events: `LOGIN_SUCCESS` (method), `FIRST_LOGIN`, `OAUTH_LINKED`, `LOGIN_BLOCKED` (reason), without secrets.

## W8.4 Presence view (`adminPresence`)

Reuse Y4. The Users table and a user drawer show: online state, last seen, device label (coarse), and the current media (title name, `media #id`, episode, position). A "Watching now" filter and the Active Users and Watching Now dashboard cards use the same presence snapshot. If the admin stream is disconnected, the dots show a stale state.

## W8.5 Restrictions: ban and unban activities

Activities: Sign in, Watching, Reviewing (extensible). Reuse the existing restriction table if one exists (extended in Y3).

UI (user drawer, "Access" panel): three rows, each with `AdminToggle` (tone state). ON means allowed (check mark), OFF means banned (dash).
- Turning a row OFF opens an inline popover (not a modal) asking for a reason (required, 5 to 500 characters) and a duration (24 hours, 7 days, 30 days, custom date, permanent). On confirm the toggle shows `busy` until the server confirms, then shows OFF with "Banned until {date}" or "Banned until lifted", and a small reason line.
- Turning a row ON lifts the restriction (optional note). The switch shows `busy` until confirmed.
- The table shows restriction chips and the "Restricted" filter works. History of restrictions is visible in the drawer.

Enforcement (server):
- Sign in restriction: rejects both login methods and revokes existing sessions immediately. The message is neutral: "Your access is paused. Contact the admin."
- Watching restriction: a single shared `assertAllowed(userId, "WATCH")` call at the TOP of each playback handler (watch session creation, stream, HLS, subtitles). This is the only permitted change to those protected files. Show me the exact diff for approval BEFORE applying it. Use a 15 second cache that is invalidated immediately when a restriction is created or lifted. Active streams stop within 15 seconds because their next request fails with 403 `WATCH_RESTRICTED` (reason and expiry in the body). Publish an event so an open player can show the message at once.
- Reviewing restriction: review create and edit endpoints call `assertAllowed(userId, "REVIEW")` and return 403 `REVIEW_RESTRICTED`.
- Restrictions end automatically at expiry (computed on read). Audit entries and events: `RESTRICTION_ADDED`, `RESTRICTION_LIFTED`. An optional in-app notification tells the user (W4), controlled by a toggle in the Add Restriction popover.
- Viewer-side messages use existing UI patterns: the player shows a calm message with the reason and end date, play buttons are disabled with a tooltip, the review form shows a notice.

## W8.6 Backend (all admin endpoints validated, rate limited, audited)

See Appendix E: user create, reset password, remove (permanent), revoke sessions, method switches, restrictions create and lift, presence snapshot, plus the login related endpoints (OAuth start and callback, first-login hook).

## W8.7 Tests

- Signup: `/signup` redirects, registration endpoint returns 403, no signup links remain, OAuth never creates accounts.
- Create user: both password modes, plaintext password appears only in the creation response, hash stored with the existing parameters, duplicate email rejected, role rules, audit entry without secrets.
- Login: Method A unchanged for existing accounts (existing tests green), Method B gated by `firstLoginAt`, matching rules (verified email only, case-insensitive, no match gives the neutral message), LOGIN restriction blocks both methods and kills sessions, at-least-one-method rule, first-login notification created exactly once, enumeration safety, rate limits, OAuth flow tests with a mocked provider (no real Google), state and nonce checks, open-redirect checks.
- A review item and a test that confirm there is no code path that collects an email-provider password.
- Restrictions: lifecycle (create, enforce, expire, lift), enforcement on every playback endpoint within 15 seconds, review endpoints, cache invalidation, race between lift and apply.
- Deletion: every user-owned table empty afterwards (test that seeds all of them), other users untouched, rules (self, last SUPER_ADMIN, ADMIN versus ADMIN), tombstone has no personal data, stream tokens stop working.
- Presence: online, away and offline transitions in the table, current media from playback records, forged heartbeat media ignored, live updates over the stream.
- E2E: admin creates a user, the user logs in with the designated password and sees the toast and inbox notice; the user then signs in via the mocked provider; admin turns off Watching and an active playback stops with the message; admin lifts it; admin removes the user and sign-in fails; admin sees the user's online dot and `media #id` while they watch.
- Regression: every existing login, logout, role and session behavior.

## W8.8 Phase gate
All flags OFF: zero regression differences. Flags ON: all checks pass with screenshots (login page with the notice, Users table, Add User dialog, Access panel, restricted viewer states). Update PROGRESS.md, `docs/oauth.md` and `docs/user-access.md`. Stop and wait for "continue".
~~~

---

## 19. Prompt Y-QA: Full regression, performance, accessibility and security pass

~~~text
PROMPT Y-QA: FULL REGRESSION, PERFORMANCE, ACCESSIBILITY AND SECURITY PASS

Run after W1 to W8 are merged. Do not add features. Find and fix problems only, with minimal fixes that do not touch protected zones without approval.

## QA.1 Regression against the Y1 baseline

1. Re-run every check in `docs/admin-baseline/quality.md` and produce a table: check, baseline, now, difference, explained or unexplained.
2. Walk every row of `admin-inventory.md` and `auth-inventory.md`: Works, Works but changed as requested, or Broken. Any Broken row is a blocker: fix it, add a test, explain the cause.
3. Re-capture the Y1 screenshots and diff them. Group differences into requested change, side effect, regression. Show me the side effects and regressions with before and after images.
4. Route map check: every route from Y1 still resolves, every new redirect works (including `/signup`), and the viewer app's pages (home, browse, title, watch, my list, settings) are unchanged apart from the approved hooks.

## QA.2 Flag matrix

Run the full test suite for: all flags OFF (must equal baseline), all flags ON, each flag ON alone, and these pairs: `adminRedesign` with `adminDock`, `adminRealtime` with `adminLiveCards`, `adminTelegram` with `adminAddMediaV2`, `closedSignup` with `dualLogin`. Any crash or broken UI in any combination is a defect, because flags must be independent.

## QA.3 ThreeUI integrity

- `npm run verify:threeui` passes. Show the table.
- Confirm only the four variants in use ship in the admin bundle (inspect the bundle analysis). Confirm the viewer bundle did not grow.
- Confirm `FORKS.md` lists every fork with its diff, and that each fork reproduces the original visuals and interactions apart from the documented change.
- Verify in the browser: Sable Dock vertical (hover spring, keyboard, collapse), Liquid Orb (interaction, keyboard), Modern toggle in both tones (stretching knob, check-to-dash, keyboard, screen reader state), Bloom Outline Button (ink bloom, magnetic drift, sliding label).
- Reduced motion fallbacks work for all four.

## QA.4 Performance

- Admin dashboard with the live stream running: 55 fps or better while cards update, charts stream and the dock is used. Record a trace.
- Torrent health with 100 simulated torrents: sampler CPU cost, SSE bandwidth per admin, chart render cost, memory over 30 minutes (bounded).
- SSE: connections per admin tab (exactly one), reconnect behavior, behavior with 5 admin tabs open, no listener or EventSource leaks after 100 route changes.
- Activity bar with 1000 rows: scroll, expand, burst of 100 events in 5 seconds.
- Data-layer event extension overhead (report the measured number).
- Next.js specifics: the stream route works in `next start`, is not buffered, and releases resources on client disconnect.
- Lighthouse on the dashboard and the viewer home: no drop of more than 3 points versus baseline.

## QA.5 Accessibility

- Axe on every admin page and the login page, zero serious or critical violations.
- Keyboard-only walkthrough: dock, search, alerts drawer, notification compose, torrent health list and charts (table view), Telegram picker, the whole Add Media flow including the overview card, activity bar (row actions, inline edit, delete confirm), Users page, Access toggles and popovers.
- Screen reader pass on: the dock, toggles (state announced), alerts drawer, overview card, activity bar rows, restriction popover.
- Reduced motion and zoom at 200 percent: no broken layout.
- Contrast: AA for all text tokens on all admin surfaces.

## QA.6 Security review of the new surface

For each finding give severity, evidence (file and line), exploit scenario, fix.
- Realtime: SSE authorization on connect and during the session, role changes close the stream, no secrets or personal data in events (emails, IPs, tokens), per-admin connection limits, event replay cannot leak events from topics the admin did not request.
- Presence and notifications: users cannot read other users' presence or notifications, forged heartbeat media ignored, XSS in notification titles and bodies and in alert text (render as text), external links rejected, rate limits.
- Telegram: allowlist of the channel id, webhook secret verification, token never in logs, responses, bundles or the database (run a grep over build output and logs), download size cap, bencode validation, only the fixed Telegram host is contacted, behavior when Telegram is down.
- OAuth and login: state and nonce, PKCE, verified email only, no account creation, no linking by unverified email, open redirect on `next`, enumeration (neutral messages, equal timing), rate limits and lockout across both methods, session fixation, cookie flags unchanged. Confirm there is NO code path that collects an email-provider password.
- Restrictions: bypass attempts (old stream token, direct HLS or subtitle URLs, cached sessions, SSE), cache invalidation timing, race between lift and apply.
- Permanent deletion: authorization matrix, re-authentication, replay of the confirmation request, partial failure, leftover personal data in any table, logs or audit entries.
- Admin create user: the designated password appears only once in the response, never in logs or the database in plaintext, strength policy.
- Activity bar and Add Media: idempotency, injection through the inline editor, upload validation, mass assignment (clients cannot set `removedAt`, `liveAt`, restrictions through the generic update endpoint).
- Every new route has authentication, authorization, validation and a test (a route-table test asserts it).
- Secrets: nothing secret in the browser bundle, `.env.example` complete, no secret in the repository history (scan).

## QA.7 Data safety

- Migrations apply on a clean database and on a copy of the dev database, each down-migration note works, the Prisma (or equivalent) schema and OpenAPI diffs versus baseline show additions plus the single approved nullability relaxation only.
- Retention jobs (health samples, alerts, event log, trash purge, Telegram index if applicable) run and delete only what they should (test with fixtures).
- Rehearse the rollback plan in Appendix J on a copy.

## QA.8 Integrity of live numbers

Run the `check-live-metrics` script and the `dashboard-integrity` suite. Add a final manual check: change data directly in the database and confirm the cards and tables follow within 5 seconds (the safety net recompute).

## QA.9 Report

Write `docs/admin-baseline/qa-report.md` with all tables, every defect (severity, status, fix commit), remaining known issues, and a go or no-go recommendation. Do not claim a pass without evidence. Then STOP and wait for my decision.
~~~

---

## 20. Prompt Y-FINAL: Flag cleanup and final report

~~~text
PROMPT Y-FINAL: FLAG CLEANUP AND FINAL REPORT

Only run this after I confirm the QA report and have used the new admin for a while. It removes temporary scaffolding, carefully, one flag at a time.

1. Order, one commit per flag: `adminActivityBar`, `adminAddMediaV2`, `adminTelegram`, `adminBroadcast`, `adminAlerts`, `adminTorrentLive`, `adminLiveCards`, `adminPresence`, `adminUserAccess`, `dualLogin`, `closedSignup`, `adminDock`, `adminRedesign`, `adminRealtime`.
   - Remove the flag checks so the new behavior is the only behavior.
   - Remove the old code path ONLY if nothing else imports it (verify with the real dependency graph). Candidates: the old admin shell, the old sidebar and top bar, the old dashboard cards, the old Add Media flow, the old Torrent Health page, the old signup page and registration route (keep the registration code only if I say so).
   - Keep deprecated endpoints for one more release and document them.
   - Run the full suite and the regression comparison after each flag removal.
2. Remove the `featureFlags` module only after all flags are gone.
3. Update docs: `docs/admin-ui.md`, `docs/realtime.md`, `docs/torrent-health.md`, `docs/telegram.md`, `docs/oauth.md`, `docs/user-access.md`, `docs/api.md`, `docs/admin-guide.md` (how to add media from Telegram, how to read the dashboard, how to send notifications, how to ban an activity, how to remove a user), and `FORKS.md`.
4. Search for `TODO`, `FIXME`, `console.log`, hardcoded hex colours and durations in components, unused exports and dependencies. Fix or list each.
5. Write `docs/ADMIN_OVERHAUL_REPORT.md`: what changed, mapped one by one to the 16 requests in section 1 of the pack with evidence (tests, screenshots), what differs from the original request and why, known limitations (for example, Telegram's Bot API cannot read old posts), and follow-up ideas.

Do not claim anything is done without evidence.
~~~

---

## 21. Appendix A: ThreeUI manifest (files, hashes, configured props)

These values come from the registered bundles you provided. `docs/threeui-manifest.json` must be generated from this appendix, and `scripts/verify-threeui.mjs` must fail on any difference. Never edit the manifest to make a mismatch pass.

Source revisions: RectangleButtons `ff30e28c2781`, SkeuomorphicToggleCollection `3e19e7fec9ac`, LiquidMetalButton `76624e881a3a`, AnimatedTopDock `5a736cd3c1f6f19802f61ebb10e1701b9f7aa26e`.

Bundles:
- https://threeui.com/source-code/rectangle-buttons.json
- https://threeui.com/source-code/skeuomorphic-toggle.json
- https://threeui.com/source-code/liquid-metal-button.json
- https://threeui.com/source-code/animated-top-dock.json

Configured usage (starting props):

| Component | Variant | Props |
|---|---|---|
| RectangleButtons | `bloom-outline-button` | `mode="dark" hue={-52} saturation={1.00} brightness={1.00}` |
| SkeuomorphicToggleCollection (tone add) | `modern` | `mode="auto" speed={1.50} size={0.84} opacity={1.00} hue={73} saturation={1.03} brightness={1.02}` |
| SkeuomorphicToggleCollection (tone state) | `modern` | `mode="auto" speed={1.50} size={0.84} opacity={1.00} hue={-97} saturation={1.03} brightness={1.02}` |
| LiquidMetalButton | `circle` | none |
| AnimatedTopDock | `sable` | `proximity={122} spring={0.19} damping={0.70} widthGrowth={17} heightGrowth={16} drop={3.5}` |

```json
{
  "shared": [
    { "path": "src/shaders/threeui.css", "sha256": "efe4447139f1358dd8e9be68edf6fa46cbefbd1de423a4d6c439ca61d2c8eccf" }
  ],
  "components": {
    "RectangleButtons": {
      "revision": "ff30e28c2781",
      "files": [
        { "path": "src/shaders/rectangle-buttons/RectangleButtons.tsx", "sha256": "ff30e28c278193a90f63c93aba77bc6c5c6a8a8f01ec8882392957851146f083" },
        { "path": "src/shaders/section-elements/SectionElements.tsx", "sha256": "c3602974a5be61abdbb040e7416504e2682f42616d60b6a73437dc3b04637b78" },
        { "path": "src/shaders/section-elements/section-elements.css", "sha256": "91abd6ed53f463673d0eb2c3c91040c3574287663ca1313e6d92b8448f0b6d11" },
        { "path": "src/shaders/neuform-isolated/NeuformIsolatedEffects.tsx", "sha256": "fe9856234253bc3c1a13b3afb84f3d84644dfa6d578e7203bb3e1dd5eced1b75" },
        { "path": "src/shaders/neuform-isolated/sources/launch-button.html", "sha256": "db8303b70c0322d0c7877b32e8230ce906111ee746fa5460f8aeedf59915a900" },
        { "path": "src/shaders/neuform-isolated/sources/dot-border-button.html", "sha256": "eb3ef1de8c8af80bf3f532630c60ed4ee90f10cd645d136f284417e75bda6584" },
        { "path": "src/shaders/neuform-isolated/sources/floating-dots-cta.html", "sha256": "28f53a8d14920bbfede14b0cf096ebddef5dfbee87d46cfc70bdfb612c5796da" },
        { "path": "src/shaders/neuform-isolated/sources/sliding-text-cta.html", "sha256": "e24ce6a519cfbafe082deb6eedb801b97b36ba6b8ccea9a81166c9b6edb6e770" },
        { "path": "src/shaders/neuform-isolated/sources/gradient-beam-cta.html", "sha256": "90a5961c1e7374ecf1d4efa1e3ef051048a08567933491a91c67280d4eac9a42" },
        { "path": "src/shaders/neuform-isolated/sources/gradient-pill-button.html", "sha256": "8fcb0596004786b6a72ca7bf1b2c379ef28ccf78f9de606a83d1572567a8986b" },
        { "path": "src/shaders/neuform-isolated/sources/generate-button.html", "sha256": "e99ab802a1e1f1a7b1444727e26197c43f8cfe328ca6e2cd45b6fbb3bce694c6" },
        { "path": "src/shaders/neuform-isolated/sources/glassmorphism-cta.html", "sha256": "b535a5f6e778924906fa1625cf610841b847d52c17487dad83215dd5921a3863" },
        { "path": "src/shaders/neuform-isolated/sources/spinning-border-button.html", "sha256": "d7150ca6ca4ad7975ba183c368b25a5de266e6a018c801b89720b8e8e3fab8a7" },
        { "path": "src/shaders/neuform-isolated/sources/gradient-cta.html", "sha256": "05e611c9ec16848e00ce81e4c8e186167da592c49755408cbc563c2ea611458d" },
        { "path": "src/shaders/lumen-cta/LumenCta.tsx", "sha256": "437b62c7b9b3009f1fc80fc24e81f2014c1bab9567ba1afcff314b72c6b0b519" },
        { "path": "src/shaders/lumen-cta/lumen-cta.css", "sha256": "a19f7e01d0a0580afaedfaccd7a1acb1a74a004ded3e5269d59da986e085c151" },
        { "path": "src/shaders/lumen-cta/sources/lumen.html", "sha256": "8992e7c0ceb4c306502f5c296f1fd3e8c8602372d1a217fa1f3b5e49445ec28d" }
      ],
      "binaryAssets": [
        { "path": "src/shaders/section-elements/assets/sf-light.woff2", "bytes": 42420, "sha256": "839aeb08fa40d65bb15375f966694ba84ea734a86307e6894005a85597e8ff98" },
        { "path": "src/shaders/section-elements/assets/sf-regular.woff2", "bytes": 36296, "sha256": "14a89688aab531bfbf3ace6d2e80f3bab95e9bbd8d6a96c6a5a8fcdcd3dba0f2" },
        { "path": "src/shaders/section-elements/assets/sf-medium.woff2", "bytes": 41808, "sha256": "ef8ab5de42a601c6258d5a196ca95b41153c30050fc8dcae01ac2124d7883cf6" },
        { "path": "src/shaders/section-elements/assets/sf-semibold.woff2", "bytes": 42084, "sha256": "4a2bbcd0a3f5772503ad26bf9d3d1147c8a03841f8613a71005948a55058faa3" },
        { "path": "src/shaders/section-elements/assets/sf-bold.woff2", "bytes": 40116, "sha256": "bf987268f3fe5aa2497ba50e446a24d27c2983ef14e708251b89b2bc695e52c9" }
      ]
    },
    "SkeuomorphicToggleCollection": {
      "revision": "3e19e7fec9ac",
      "files": [
        { "path": "src/shaders/skeuomorphic-toggle/SkeuomorphicToggleCollection.tsx", "sha256": "944ee582c2578e470e98f83ea7931018a85b87e44198ef2819613d1a76643150" },
        { "path": "src/shaders/skeuomorphic-toggle/ModernToggle.tsx", "sha256": "d6545c319a3123ac573756d0d3725e73c279143ea470a48256101222cb37fa16" },
        { "path": "src/shaders/skeuomorphic-toggle/modern-toggle.css", "sha256": "2748dc81ffd1f8506c56f6cd316a522df8f5f7bbeda751017a88efb2fc892674" },
        { "path": "src/shaders/skeuomorphic-toggle/GlassToggle.tsx", "sha256": "406eda34475c2d87b699690097ae50e9e3064dedcacda4cabb3dd8c282122a9b" },
        { "path": "src/shaders/skeuomorphic-toggle/glassToggleScene.ts", "sha256": "a708e388eaec0a1feab2b97b59e523eda92c5083202bf0015d7554d9928c4895" },
        { "path": "src/shaders/skeuomorphic-toggle/glass-toggle.css", "sha256": "d87d193e981e191dbab386f1dc7dbcfbe46fb709bcc7085305455acd217765f3" },
        { "path": "src/shaders/skeuomorphic-toggle/ShaderToggle.tsx", "sha256": "69bfab67ebe67b1e886c66c69451a64db9241267d922bfe774dc491df1f592ef" },
        { "path": "src/shaders/skeuomorphic-toggle/shaderToggleScene.ts", "sha256": "6eadd83c7abeaadb2bb4a9c44624234050f7faf6a36af6ace8738b36f9dfb673" },
        { "path": "src/shaders/skeuomorphic-toggle/shaderToggleGlsl.ts", "sha256": "12eef096246b9fe460ab256e0369b846266a3e87fe5869760dc4e67c9bfa0b57" },
        { "path": "src/shaders/skeuomorphic-toggle/shader-toggle.css", "sha256": "c57012bddaaa4bfe1e18d19c23188f43d79e44fccf9d9e1e15454cd57e4f34cd" },
        { "path": "src/shaders/skeuomorphic-toggle/toggleMode.ts", "sha256": "2ed0a1183b05b22c990f385d6e457bf6b3a11bf5749c84aae44ee9b1d0e406b8" },
        { "path": "src/shaders/neuform-isolated/NeuformBatchEffects.tsx", "sha256": "dc68c51bea26b922965de44b4fb8d6c432607508fb2b61e16ed60d245da1a69f" },
        { "path": "src/shaders/neuform-isolated/sources/skeuomorphic-toggle.html", "sha256": "3e19e7fec9ac3339f29c888341aad1f6f4009d1c1d76f0231c3ad24a6ce49b5a" }
      ],
      "binaryAssets": []
    },
    "LiquidMetalButton": {
      "revision": "76624e881a3a",
      "files": [
        { "path": "src/shaders/liquid-metal-button/LiquidMetalButton.tsx", "sha256": "89b940bab445f17fafb444a7833b3c785d24c86a28156d8ad231e18de9503e11" },
        { "path": "src/shaders/liquid-metal-button/liquid-metal-button.html", "sha256": "76624e881a3aecbd79b473d9c51f53c7157d47052abd0f9dc28fefd223b0a819" }
      ],
      "binaryAssets": []
    },
    "AnimatedTopDock": {
      "revision": "5a736cd3c1f6f19802f61ebb10e1701b9f7aa26e",
      "files": [
        { "path": "src/shaders/animated-top-dock/AnimatedTopDock.tsx", "sha256": "50ddbba7ebc81565f42bd14dda34efb45e7b18c1aa47e97f196256ffedb4478f" },
        { "path": "src/shaders/animated-top-dock/topDockController.ts", "sha256": "506ab23d4d42cf1b5bc89131e7714586ee107381bb18d9b0302766e9a1dee2bd" },
        { "path": "src/shaders/animated-top-dock/retroPixelField.ts", "sha256": "54f0469be51dfce2da7ce37c952d42c583cc7996794bf96d1ea0b2bb35d94115" },
        { "path": "src/shaders/animated-top-dock/glassParticleField.ts", "sha256": "bc9f07ae6da33b28f82303ea937095806f8e3a2ab08bd1301ae8457aaf0c3464" }
      ],
      "binaryAssets": [
        { "path": "src/shaders/fonts/fragment-mono.woff2", "bytes": 15176, "sha256": "4f4dc27f4a770c0d02fde800daa836c8adc0d1e423b28da74baaf0d1cc3ab96c" }
      ]
    }
  }
}
```

Notes for the agent:
- Several bundles include variants we do not use (other button styles, glass and shader toggles, other dock renderers). They are vendored because the registered bundle requires them, but they must not ship in the admin bundle (rule 7.7).
- Hash mismatch, a missing file, a different byte length, or an unreachable bundle means STOP and report. Do not substitute a recreated file.

---

## 22. Appendix B: Design tokens and current admin palette

Colours sampled from your admin screenshot. They are the starting point, not a new brand.

```css
:root {
  /* surfaces (sampled) */
  --adm-page: #0A0A0A;
  --adm-dock: #000000;
  --adm-topbar: #000000;
  --adm-card: #040607;
  --adm-table-head: #181228;
  --adm-nav-active: #130619;

  /* accent and status (sampled) */
  --adm-accent: #BF40FA;
  --adm-accent-soft: rgb(191 64 250 / 0.16);
  --adm-border: rgb(191 64 250 / 0.28);
  --adm-success: #5BD68A;
  --adm-warning: #F2C94C;
  --adm-info: #6CB6FF;
  --adm-danger: #FF6B6B;

  /* text */
  --adm-text: #ECEAF4;
  --adm-text-muted: #A5A3B8;

  /* chart roles */
  --adm-chart-seeders: var(--adm-success);
  --adm-chart-leechers: var(--adm-info);
  --adm-chart-total: var(--adm-accent);
  --adm-chart-viewers: var(--adm-warning);

  /* layout */
  --adm-dock-width: 216px;
  --adm-dock-width-collapsed: 72px;
  --adm-topbar-height: 72px;
  --activity-bar-height: 0px; /* updated at runtime */

  /* layers */
  --z-content: 0;
  --z-sticky: 20;
  --z-dock: 40;
  --z-activity-bar: 45;
  --z-popover: 60;
  --z-modal: 70;
  --z-toast: 80;

  /* motion */
  --dur-fast: 150ms;
  --dur-base: 250ms;
  --dur-slow: 450ms;
}
```

Map these to the existing token names if the app already has them (the earlier theming system used `--c-*` names). Do not create a parallel token system: alias instead.

---

## 23. Appendix C: Realtime protocol and event catalog

### SSE frame

```
id: 48213
event: dashboard.metric.changed
data: {"v":1,"seq":48213,"ts":"2026-10-03T06:15:02.114Z","topic":"dashboard","payload":{"asOf":"2026-10-03T06:15:02.100Z","metrics":{"publishedTitles":12}}}
```

Rules:
- `v` is the protocol version. `seq` equals the SSE `id` for persistent events.
- Control events: `hello` (server time, connection id, protocol version), `snapshot.<topic>`, `resync` (client must refetch snapshots), `auth` (session ended or role changed, the stream closes).
- A comment line `: ping` every 15 seconds. `retry: 3000` is sent once.
- Persistent events are replayable through `Last-Event-ID` for 24 hours. Ephemeral events (`torrent.sample`, `presence.changed` bursts) are not replayed, so a gap triggers a snapshot refetch.

### Topics

`dashboard`, `torrents`, `presence`, `activity`, `alerts`, `users`.

### Event catalog

| Event | Category | Alert severity | Alert text (template) | Link |
|---|---|---|---|---|
| `media.created` | MEDIA | INFO | "Media added: {title}" | media |
| `media.updated` | MEDIA | INFO | "Media updated: {title} ({n} changes)" | media |
| `media.removed` | MEDIA | WARNING | "Media removed: {title}" | media (trash) |
| `media.restored` | MEDIA | INFO | "Media restored: {title}" | media |
| `media.went_live` | MEDIA | SUCCESS | "{title} is live" | media |
| `media.went_unlive` | MEDIA | INFO | "{title} is no longer live" | media |
| `media.source_changed` | MEDIA | INFO | "Source changed: {title}" | media |
| `torrent.added` | TORRENT | INFO | "Torrent added: {name}" | torrent |
| `torrent.state.changed` | TORRENT | INFO or CRITICAL (error) | "Torrent {name}: {from} to {to}" | torrent |
| `torrent.health.degraded` | TORRENT | WARNING | "Health dropped: {name} ({score})" | torrent |
| `torrent.health.dead` | TORRENT | CRITICAL | "No seeders: {name}" | torrent |
| `torrent.health.recovered` | TORRENT | SUCCESS | "Recovered: {name}" | torrent |
| `torrent.removed` | TORRENT | WARNING | "Torrent removed: {name}" | torrents |
| `telegram.post.indexed` | MEDIA | INFO | "New file in Telegram: {fileName}" | picker |
| `telegram.status.changed` | SYSTEM | WARNING or SUCCESS | "Telegram {connected or problem}" | settings |
| `user.created` | USER | INFO | "User created: {name}" | user |
| `user.first_login` | USER | INFO | "{name} signed in for the first time" | user |
| `user.removed` | USER | WARNING | "User removed: {name}" | users |
| `user.password_reset` | USER | WARNING | "Password reset for {name}" | user |
| `user.methods.changed` | USER | INFO | "Sign-in methods changed for {name}" | user |
| `user.oauth.linked` | USER | INFO | "{name} linked their email account" | user |
| `auth.login_blocked` | ACCESS | WARNING | "Blocked sign-in: {name}" | user |
| `auth.failed_login_burst` | ACCESS | WARNING | "Many failed sign-ins for {name}" | user |
| `restriction.added` | ACCESS | WARNING | "{activity} banned for {name}" | user |
| `restriction.lifted` | ACCESS | INFO | "{activity} allowed again for {name}" | user |
| `restriction.expired` | ACCESS | INFO | "Ban expired: {activity} for {name}" | user |
| `notification.sent` | NOTIFICATION | INFO | "Message sent to {audience}" | notifications |
| `notification.recalled` | NOTIFICATION | INFO | "Message recalled" | notifications |
| `settings.changed` | SETTINGS | INFO | "Setting changed: {key}" | settings |
| `system.health.changed` | SYSTEM | WARNING, CRITICAL or SUCCESS | "System {state}: {check}" | system |
| `system.disk.low` | SYSTEM | WARNING | "Disk space low ({free})" | system |
| `system.engine.restarted` | SYSTEM | WARNING | "Torrent engine restarted" | torrents |
| Telemetry only (no alert): `dashboard.metric.changed`, `torrent.sample`, `presence.changed`, `activity.new` | | | | |

Every event carries: id, type, occurredAt, actor (admin id, user id or system), entity type and id, request id when available, and a minimal payload. No emails, IP addresses, tokens or password data.

---

## 24. Appendix D: Torrent health score formula and sampling rules

All inputs come from the engine's real status. Missing inputs are never invented: a component without data is excluded and the weights are renormalized, and the UI says which inputs were unavailable.

Components (each 0 to 1):
- `A` availability: `min(1, availability)` where availability is the number of distributed copies reported by the engine.
- `S` seeders: `min(1, seeders / 10)`.
- `T` throughput: if the file is complete or seeding then 1, otherwise `min(1, downloadBps / targetBps)` with `targetBps` default 1.5 MB/s (a setting).
- `P` swarm size: `min(1, peersTotal / 25)`.
- `R` reachability: 1 if at least one tracker responded or DHT found peers, otherwise 0.

Score: `round(100 * (0.35*A + 0.30*S + 0.20*T + 0.10*P + 0.05*R))`

Rules:
- If seeders is 0 and availability is below 1: cap the score at 40.
- If peersTotal is 0 and the data is not fully cached locally: cap the score at 15.
- If the file is fully cached locally: raise the score to at least 80 and show "Cached locally".

Levels: 90 to 100 Excellent, 70 to 89 Good, 50 to 69 Fair, 25 to 49 Poor, 0 to 24 Dead. "At risk" means below 50. The sidebar badge counts torrents below 50 that are linked to a live media or have viewers.

Table-driven unit tests must cover: no peers, peers without seeders, healthy swarm, complete cached torrent, missing inputs renormalized, boundary scores, caps.

Sampling:
- Live samples every {{LIVE_SAMPLE_SECONDS}} seconds while an admin is subscribed to `torrents`. Ring buffer of 150 samples per torrent (about 5 minutes).
- Persisted `FINE_30S` rows every 30 seconds always. Retention 24 hours.
- Persisted `COARSE_5M` rows every 5 minutes. Retention 30 days.
- Chart windows: live 5 minutes, 1 hour (from FINE), 24 hours (from FINE), 7 days (from COARSE), decimated to at most 300 points per series.
- Alert hysteresis: three consecutive samples to change a state.

---

## 25. Appendix E: API endpoint reference

Auth column: U signed-in user, A admin, S super admin, P public, T token or secret. All new routes need validation, authorization, rate limits where relevant, tests and an entry in the API docs.

### Realtime, system, presence

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/admin/stream | A | Multiplexed SSE stream (topics query) |
| GET | /api/admin/dashboard | A | Dashboard snapshot (same function as the deltas) |
| GET | /api/admin/system/status | A | Health of database, engine, Telegram, stream, disk |
| POST | /api/presence/heartbeat | U | Online heartbeat |
| POST | /api/presence/offline | U | Offline beacon |
| GET | /api/admin/presence | A | Presence snapshot (online users and current media) |

### Torrent health

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/admin/torrent-health | A | Summary and list with sparklines |
| GET | /api/admin/torrent-health/lookup | A | Lookup by TMDB id, name or infohash prefix |
| GET | /api/admin/torrent-health/:torrentId/series | A | Chart series for a window |

### Alerts and broadcasts

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/admin/alerts | A | Alerts list with unread state |
| POST | /api/admin/alerts/:id/read | A | Mark read |
| POST | /api/admin/alerts/read-all | A | Mark all read |
| GET | /api/admin/alerts/prefs | A | Alert preferences |
| PUT | /api/admin/alerts/prefs | A | Save preferences |
| POST | /api/admin/notifications | A | Send or schedule a broadcast |
| GET | /api/admin/notifications | A | Sent list |
| POST | /api/admin/notifications/:id/recall | A | Recall |
| GET | /api/admin/notifications/:id/stats | A | Delivered and read counts |
| GET | /api/notifications | U | My inbox |
| POST | /api/notifications/:id/read | U | Mark read |
| POST | /api/notifications/read-all | U | Mark all read |
| GET | /api/notifications/stream | U | SSE for new notifications |

### Telegram

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/admin/telegram/status | A | Connection status and counts |
| POST | /api/admin/telegram/test | A | Connection checklist |
| GET | /api/admin/telegram/posts | A | Browse the index (cursor, filters, search) |
| GET | /api/admin/telegram/posts/:id | A | One post |
| POST | /api/admin/telegram/posts/:id/fetch-torrent | A | Download and parse the torrent file |
| POST | /api/admin/telegram/posts/:id/use-magnet | A | Use a magnet from a post |
| POST | /api/telegram/webhook/:secret | T | Webhook receiver (webhook mode only) |

### Media

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/admin/media | A | Add Media v2 (idempotent) |
| GET | /api/admin/media-activity/rows | A | Activity bar rows |
| GET | /api/admin/media-activity/:titleId/history | A | Change timeline |
| POST | /api/admin/titles/:id/live | A | Live or unlive |
| POST | /api/admin/titles/:id/remove | A | Remove to trash |
| POST | /api/admin/titles/:id/restore | A | Restore |
| DELETE | /api/admin/titles/:id/permanent | A | Permanent deletion (typed confirmation) |

Existing title, torrent and subtitle endpoints stay unchanged.

### Users and access

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/admin/users | A | Extended list (presence, methods, restrictions) |
| POST | /api/admin/users | A | Create user with designated password (ADMIN role needs S) |
| POST | /api/admin/users/:id/reset-password | A | New designated password |
| POST | /api/admin/users/:id/revoke-sessions | A | Revoke sessions |
| PATCH | /api/admin/users/:id/methods | A | Allow or disallow a sign-in method |
| DELETE | /api/admin/users/:id | A | Permanent deletion (rules apply) |
| GET | /api/admin/users/:id/restrictions | A | Restrictions list |
| POST | /api/admin/users/:id/restrictions | A | Ban an activity |
| DELETE | /api/admin/users/:id/restrictions/:rid | A | Lift |

### Authentication

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | P | Now returns 403 SIGNUP_DISABLED when `closedSignup` is ON |
| GET | /api/auth/oauth/:provider/start | P | Begin provider sign-in (PKCE, state, nonce) |
| GET | /api/auth/oauth/:provider/callback | P | Complete provider sign-in (never creates accounts) |
| POST | /api/auth/second-password | U | Set own second password (mode own-password only) |

Error codes added: `SIGNUP_DISABLED`, `LOGIN_RESTRICTED`, `WATCH_RESTRICTED`, `REVIEW_RESTRICTED`, `FIRST_LOGIN_REQUIRED`, `EMAIL_LOGIN_NOT_ENABLED`, `METHOD_REQUIRED`, `FORBIDDEN_TARGET`, `CONFIRMATION_REQUIRED`, `DUPLICATE_SOURCE`, `SOURCE_BLOCKLISTED`, `TELEGRAM_DISABLED`, `TELEGRAM_FILE_TOO_LARGE`, `TELEGRAM_FILE_GONE`, `IDEMPOTENCY_REPLAY`, `BROADCAST_RATE_LIMITED`.

---

## 26. Appendix F: Copy text

Plain, specific, friendly. Use these as written unless I change them.

### Login page notice (the only notice on the page)

Title: `Good to know`

Mode oauth:
> Your admin gave you a password to sign in. After your first sign-in you can also use your email account (the same email address) to sign in. Both ways keep working, so use whichever is easier. We never see your email password. You type it only on your email provider's own page.

Mode own-password:
> Your admin gave you a password to sign in. After your first sign-in you can also set your own password for the same email address. Both passwords keep working, so use whichever is easier.

### First-login notification

Title: `You can now sign in with your email account too`

Mode oauth:
> You're in. From now on you can also sign in with your email account using the same email address ({maskedEmail}). The password from your admin keeps working too. We never see your email password.

Mode own-password:
> You're in. You can now set your own password for {maskedEmail} in Settings. The password from your admin keeps working too.

### Neutral messages

| Situation | Message |
|---|---|
| Wrong password or unknown email | `Email or password is incorrect.` |
| Provider email has no account | `This email isn't enabled for access. Ask the admin.` |
| Email sign-in before the first login | `Sign in with the password your admin gave you first.` |
| Email sign-in switched off for the user | `Email sign-in isn't turned on for your account. Use the password from your admin.` |
| Sign in banned | `Your access is paused. Contact the admin.` |
| Watching banned | `Watching is turned off for your account.` followed by the reason and the end date or `until further notice` |
| Reviewing banned | `Reviews are turned off for your account.` followed by the reason and the end date |
| Signup page visited | redirect to the login page, no message |

### Admin copy

- Credentials card after creating a user: `Copy these now. The password is shown only once.`
- Telegram picker empty state: `No files indexed yet. Post a .torrent file in your channel, or forward older ones to the bot.`
- Telegram not configured: `Connect your Telegram channel to pick torrent files from it.` with a button to Settings.
- Overview card, "what will happen": `This will add "{title}" as a {category}, attach {n} torrent ({size}), {liveState} and {notifyState}.` where `liveState` is `make it live` or `keep it as a draft`, and `notifyState` is `notify {count} users` or `not send any notification`.
- Remove media: `Remove "{title}"? It stays in the trash for {days} days.`
- Live OFF with viewers: `{n} people are watching. Keep playback until they finish, or stop now?`
- Stale data: `Out of date. Last update {time}.`
- Reconnecting: `Reconnecting to live updates...`

### Privacy policy line (show me the final wording before adding it)

> Administrators can see whether you are online and which title you are watching, so they can run and support the service.

---

## 27. Appendix G: Telegram setup checklist

Verify each point against the current official Telegram Bot API documentation, as Prompt W5 requires.

1. Create a bot with BotFather and copy the token into `TELEGRAM_BOT_TOKEN`. Never commit it or paste it into chat, logs or the browser.
2. Create or choose the channel where you store files. Add the bot as an ADMINISTRATOR of that channel. Without admin rights the bot does not receive channel posts.
3. Get the channel's numeric id (it starts with `-100`) and put it into `TELEGRAM_CHANNEL_ID`.
4. Choose the mode. Local development: `polling`. Production over HTTPS: `webhook`, with a random `TELEGRAM_WEBHOOK_SECRET`, and register the webhook once (documented in `docs/telegram.md`). Polling and webhook cannot run at the same time.
5. Start the worker (`npm run worker:telegram`).
6. In Admin, open Settings, Integrations, Telegram and press Test connection. Expect: token valid, channel found, bot is administrator.
7. Post a `.torrent` file in the channel. It should appear in the Telegram picker within a few seconds.
8. Older files: re-post them, or forward them to the bot in a private chat. The Bot API cannot read the channel's history.
9. If the token leaks: revoke it in BotFather, put the new one in the environment, restart the worker.
10. Large files: `.torrent` files are tiny. The standard cloud Bot API limits downloads to 20 MB, so do not store video files for the app to download through Telegram.

---

## 28. Appendix H: Acceptance checklist

Every line needs evidence (test name, file or screenshot).

### Shell and components
- [ ] New admin shell with the vertical Sable Dock sidebar, all five existing pages reachable, plus Notifications.
- [ ] Dock: hover spring, keyboard navigation, collapse, drawer on narrow screens, live badges.
- [ ] All four ThreeUI components vendored byte for byte, `verify:threeui` passes, only the used variants ship, forks documented in `FORKS.md`.
- [ ] Liquid Orb for Add Media and Add User. Modern toggle (hue 73) for options inside the add forms. Modern toggle (hue -97) for live and unlive and ban and unban. Bloom Outline Button for secondary actions.
- [ ] The "1 Issue" badge investigated and reported. No overlap with the sidebar.

### Live data
- [ ] Dashboard cards read-only, computed server-side, updated in realtime, with sparklines, stale states and pause control.
- [ ] No hardcoded or random numbers (the old "24" is gone, CI check passes).
- [ ] Integrity test passes for every mutation type.
- [ ] Torrent Health: live charts of seeders, leechers, total peers, viewers, speed and availability, health score, windows (live, 1h, 24h, 7d).
- [ ] Search by TMDB id, by name and by infohash prefix. No peer IP addresses anywhere.

### Notifications
- [ ] Admin alerts for every event in the catalog, with bell, drawer, toasts, preferences, desktop and sound options.
- [ ] Broadcast to all users, to one user, to selected users, with preview, scheduling, recall and delivery stats.
- [ ] Users receive toasts and have an inbox. Plain text only, internal links only.

### Add Media
- [ ] Privacy and rights step removed from the flow and from publish validation. No columns dropped.
- [ ] Source from Telegram, from an uploaded file, or from a magnet link, all working. Duplicate and blocklist handling.
- [ ] Options step with toggles. Final overview card showing every detail with Edit shortcuts, checks, and a "what will happen" summary.
- [ ] Saving is atomic and idempotent.

### Telegram
- [ ] Bot indexes channel posts (allowlisted channel only). Picker with date groups, jump to date, search, filters, live new-files pill.
- [ ] Token never exposed. Worker is a single instance. Tests run with a fake Bot API.
- [ ] Older-files guidance documented. No MTProto backfill built.

### Activity bar
- [ ] Docked bottom bar, collapsible and resizable, visible on every admin page, never covering content.
- [ ] Rows for uploaded, modified and removed media with metadata and exact timestamps.
- [ ] History timeline with change chips inside the row. Captures changes from every origin.
- [ ] Inline edit, live toggle (with viewers choice), delete with undo, restore, permanent delete. No card or modal needed.

### Users and access
- [ ] Signup closed (page redirects, endpoint 403). Only admins create accounts.
- [ ] Admin creates users with a designated password shown once. Admin can remove users permanently with strong confirmation and role rules.
- [ ] Dual login: designated password always; after first login the user's email account works too (mode oauth, no account creation, verified email only). No email-provider password is ever collected.
- [ ] Login page shows only the dual-login notice. First-login notification delivered once.
- [ ] Ban and unban Sign in, Watching, Reviewing with reason and duration, enforced server-side within 15 seconds, and clear viewer messages.
- [ ] Admin sees online state and the media id and title each user is watching, live.

### Non-interference
- [ ] All flags OFF equals the Y1 baseline.
- [ ] Every flag works alone and in the tested pairs.
- [ ] No protected zone changed except the approved `assertAllowed` calls and the approved read-only engine accessor (if any).
- [ ] No existing test deleted, skipped or weakened.
- [ ] Schema and OpenAPI diffs show additions plus the single approved nullability relaxation only.
- [ ] Viewer app bundle size unchanged.

---

## 29. Appendix I: Regression checklist

Run after every workstream and at the end. Use the Y1 inventories as the master list. These are the minimum.

Admin (existing behavior)
- [ ] Sign in as admin, role guard (a normal user gets 403 on `/admin`), sign out.
- [ ] Dashboard loads. Media table lists titles with Type and Torrent Status. Existing row actions work.
- [ ] Existing Add Media flow (flag OFF) completes and publishes.
- [ ] Torrent Health (flag OFF) shows what it showed before. Health check, pause, resume, pre-cache work.
- [ ] Users page: list, role change, suspend, sessions.
- [ ] Settings page saves.
- [ ] Global search finds media, torrents and users.

Viewer app (must be unchanged)
- [ ] Sign in with an existing account and the existing password, sign out.
- [ ] Home, browse, title page, search.
- [ ] Play a title: direct and HLS, seek, subtitles, progress saved, resume.
- [ ] My List, ratings, settings and appearance.
- [ ] Existing notifications or toasts behave as before.

Platform
- [ ] Lint, typecheck, unit, component, integration, e2e, accessibility and security tests.
- [ ] Production build succeeds, bundle sizes compared with baseline, `verify:threeui` passes.
- [ ] Health endpoints green. Migrations apply on a clean database.
- [ ] No new console errors or warnings in browser or server logs.

---

## 30. Appendix J: Rollback plan and utility prompts

### Rollback plan

1. Instant: turn the relevant flag OFF (environment or site setting). No deploy needed if flags are runtime-readable. The old behavior returns.
2. Code: every workstream is its own branch and merge commit. Revert the merge commit.
3. Data:
   - Additive migrations may stay in place, they are harmless. Use the documented down-migration notes only if required.
   - The nullability relaxation (rights fields) has its own down-migration note. Existing data is never touched.
   - Removed media can be restored from the trash within {{TRASH_RETENTION_DAYS}} days.
   - Permanent user deletion and permanent media deletion cannot be undone. Restore from the database backup into a scratch database if ever needed.
   - The Telegram index can be rebuilt from new or forwarded posts, but it cannot recover history from before the bot became an administrator.
4. Secrets: if the Telegram token or the OAuth client secret leaks, rotate it (BotFather, Google Cloud console) and restart.
5. Always back up the database before applying any migration or script in a real environment.

### Utility prompts

#### J1. Resume in a fresh Antigravity task

~~~text
Read the Master Context, the Admin Master Context and PROGRESS.md. Summarize in 10 lines: which workstream we are in, which flags exist and their state, what is done, what is broken, and the next three actions. Run lint, typecheck and tests and report. Change nothing until I say go.
~~~

#### J2. A number on the dashboard looks wrong

~~~text
The card "[name]" shows [value] but I expect [value]. Do not change anything yet. Run the snapshot endpoint and the direct database query for that metric, show both, and show the last 10 SSE events for that metric with their sequence numbers. Explain the cause (missing event trigger, debounce, stale cache, wrong definition, a hardcoded value) and propose the smallest fix with a test that fails before and passes after. Never fix it by adjusting the displayed number.
~~~

#### J3. Live updates stop or lag

~~~text
Live updates stop or lag in [page]. Open the browser network panel and report the state of `/api/admin/stream` (connected, buffered, closed, reconnecting), response headers, and the last event ids. Check whether anything (middleware, compression, proxy, dev server) buffers the response, whether the abort cleanup runs on the server, whether there is more than one EventSource per tab, and whether the queue hit its cap (resync events). Explain the cause, fix the smallest thing, and add a regression test.
~~~

#### J4. A ThreeUI component looks or behaves wrong

~~~text
The ThreeUI component [name] looks or behaves differently from the published source. First run `npm run verify:threeui` and show the table. If any hash differs, STOP and report; do not edit vendor files. If hashes pass, compare the adapter and any fork against the vendored source using `FORKS.md`, find what we changed or how we configured it, and show the diff. Fix only the adapter or the documented fork. Do not recreate the component from its appearance.
~~~

#### J5. Telegram files are not showing up

~~~text
New files in the Telegram channel do not appear in the picker. Do not change code yet. Run the Test connection checklist and report each result. Check: bot is an administrator of the channel, the channel id matches, polling versus webhook mode (only one can be active), the worker is running as a single instance, the stored update offset, rate limit errors, whether the post type is classified as OTHER, and whether the post was made before the bot became an administrator. Explain the cause and the smallest fix.
~~~

#### J6. Something else broke

~~~text
After the overhaul, [feature] no longer works as before. Steps: [steps]. Expected: [expected]. Actual: [actual]. Error output: [paste].
Check the Y1 inventory and baseline to confirm the old behavior. Toggle each flag off one at a time to find the workstream responsible and report. Explain the root cause, write a failing test, make the smallest fix that does not touch protected zones, and run the regression comparison. Tell me if the same flaw can affect anything else.
~~~

#### J7. Explain it to me

~~~text
Explain how [the realtime stream, the data-layer event hook, presence, the Telegram ingest worker, the dual login flow, the restriction enforcement, the activity bar history] works as if I am a third-year computer science student who knows Java and basic web development. Use one Mermaid diagram, walk through one real interaction from start to finish, name the exact files involved, and list the three most likely things to break and how to debug each.
~~~

#### J8. Context overflow recovery

~~~text
The session is getting long. Update PROGRESS.md with everything a fresh session needs: decisions, current step, open issues, flags and their state, exact commands, and file paths of work in progress. Commit all work. Then list the files I should open in the next session. Do not start new work.
~~~

---

End of pack. Paste Prompt Y0 into your Antigravity rules, run Y1, review the baseline, then go one prompt at a time.
