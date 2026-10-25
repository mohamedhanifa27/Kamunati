<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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

```css
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
