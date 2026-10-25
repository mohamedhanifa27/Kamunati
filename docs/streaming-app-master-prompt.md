# Streaming App Master Prompt Pack

A Netflix-style web app that streams from torrents, with a user side, an admin side, and deep personalization (theme colour, fonts, animations and more).

Written for Claude (Claude Code or a claude.ai Project) and Google Antigravity. Every prompt sits inside a `~~~` block. Copy only what is inside the block.

---

## Table of contents

1. How to use this pack
2. Variables to fill in first
3. Prompt 0: Master Context (paste once, keep persistent)
4. Prompt 0B: Adopt an existing frontend (use if your UI already exists)
5. Phase 1: Project bootstrap and repo structure
6. Phase 2: Design system and theming engine
7. Phase 3: User side frontend
8. Phase 4: Admin side frontend
9. Phase 5: Database and backend foundation
10. Phase 6: Auth, roles and security
11. Phase 7: Admin API (torrent upload, metadata, series management)
12. Phase 8: Torrent streaming engine
13. Phase 9: Player integration, subtitles and watch progress
14. Phase 10: Preferences sync, search, ratings and recommendations
15. Phase 11: Performance, caching and resilience
16. Phase 12: Testing
17. Phase 13: Docker, CI/CD and deployment
18. Phase 14: Documentation and final audit
19. Appendix A: Theme presets (JSON)
20. Appendix B: Animation catalog
21. Appendix C: API endpoint reference
22. Appendix D: Acceptance checklist
23. Appendix E: Utility prompts (bug fix, review, resume, refactor)

---

## 1. How to use this pack

1. Fill in the variables in section 2. Replace every `{{PLACEHOLDER}}` in the prompts with your values, or paste the filled table at the top of Prompt 0 and let the AI substitute.
2. Paste Prompt 0 once, as persistent project instructions (see the tool notes below).
3. Run the phases in order. One phase per session or agent task. Do not combine phases.
4. At the end of each phase, run the phase gate: install, lint, typecheck, test, build, run, click through the new screens, then commit.
5. Keep `PROGRESS.md` updated. It is how a fresh session picks up exactly where the last one stopped.
6. If your frontend already exists, run Prompt 0B after Prompt 0, then skip the parts of Phases 1 to 4 that it covers.

### Tool-specific notes

**Claude Code**
- Save Prompt 0 as `CLAUDE.md` in the repo root so it loads automatically in every session.
- Start each phase by asking for a plan, review it, then approve the edits.
- Clear the session between phases. `PROGRESS.md` carries the memory.
- Backend and streaming phases (5 to 9) benefit most from running the code, so use Claude Code for them.

**claude.ai (Project)**
- Create a Project and paste Prompt 0 into the project instructions.
- Start each chat by uploading or pasting the current `PROGRESS.md`.
- claude.ai cannot run your repository or your torrent engine. Paste real error output back to it.
- It is a good fit for design exploration (Phase 2), code review, and writing documentation.

**Google Antigravity**
- Put Prompt 0 into the workspace's persistent rules or instructions area. The exact location depends on your version, so check its docs.
- Give each phase to the agent as its own task. Ask for a task list and implementation plan before any code.
- If your version supports a browser-driving agent, ask it to run the dev server, open the app, and capture screenshots of every screen it builds, at desktop and mobile widths.
- Keep one agent on the frontend and another on the backend only after Phase 5 defines the API contract. Never let two agents edit the same files.

### Rules that apply to every tool

- If the AI starts inventing requirements, paste the relevant part of Prompt 0 back at it.
- If a phase output is too big, ask it to finish in numbered steps and stop after each one.
- Ask for the smallest working version first, then polish.
- Never accept "TODO" or mocked logic in a phase marked complete.

---

## 2. Variables to fill in first

| Variable | What to enter | Example |
|---|---|---|
| `{{APP_NAME}}` | Product name (avoid existing brand names) | Reelhouse |
| `{{TAGLINE}}` | One line under the logo | Watch what is yours to watch |
| `{{DEFAULT_THEME}}` | Preset id from Appendix A | midnight-marquee |
| `{{DEFAULT_HEADING_FONT}}` | Font for titles | Sora |
| `{{DEFAULT_BODY_FONT}}` | Font for reading text | Inter |
| `{{DEFAULT_ANIMATION_LEVEL}}` | off, minimal, standard, expressive | standard |
| `{{DOMAIN}}` | Production domain | reelhouse.example.com |
| `{{ADMIN_EMAIL}}` | First admin account email | you@example.com |
| `{{CONTENT_SOURCE}}` | What content you will host | Own films, public domain, Creative Commons |
| `{{DEPLOY_TARGET}}` | Where it runs | A VPS with Docker |
| `{{SIGNUP_MODE}}` | open or invite-only | invite-only |

---

## 3. Prompt 0: Master Context

Paste this once. In Claude Code, save it as `CLAUDE.md`. In Antigravity, save it as the persistent workspace rules. In claude.ai, paste it into the Project instructions.

~~~text
# MASTER CONTEXT: {{APP_NAME}}

You are a senior full-stack engineer and product designer building a complete streaming web application called {{APP_NAME}} ("{{TAGLINE}}"). Treat this document as the source of truth for the whole project. Re-read it at the start of every session.

## 1. Product summary

{{APP_NAME}} is a Netflix-style video streaming web app with two sides:

- USER SIDE: browse, search, watch movies and TV series, keep a watchlist, resume playback, rate titles, and personalize the whole interface (theme colours, fonts, animation level, layout density and more).
- ADMIN SIDE: a protected dashboard where admins upload torrent files (or paste magnet links), write movie and TV series metadata, map torrent files to movies or episodes, manage artwork and subtitles, curate homepage rows, manage users, handle reports, and monitor the torrent engine.

Playback is powered by torrents. The server downloads pieces of the file in playback order and serves them to the browser over HTTP range requests, so the viewer can start watching before the download finishes. The browser never needs a torrent client.

## 2. Personas

1. Viewer: wants to find something to watch in seconds, resume where they stopped, and make the app look and feel the way they like.
2. Admin: wants to publish a film or a whole series in minutes: upload the torrent, fill in details, map episodes, publish.
3. Owner (super admin): wants control over signups, storage limits, branding, and takedowns.

## 3. Goals

- Playback starts within about 5 seconds when the torrent is healthy, and seeking works.
- A complete, polished user experience on desktop, tablet and phone.
- A complete admin workflow with no database editing required.
- Personalization that feels instant: themes, fonts and animations apply live without reloading.
- Production-ready: secure, tested, containerized, documented.

## 4. Non-goals (do not build these)

- No DRM, no payment or subscription billing, no social features beyond ratings and watchlists.
- No scraping of external sites and no automatic discovery of torrents.
- No bundled catalog. All content is added by the admin.
- No native mobile apps in this project. The web app must be responsive and installable as a PWA.

## 5. Content and legal policy (hard requirements)

{{APP_NAME}} only hosts content the operator has the right to distribute: {{CONTENT_SOURCE}}. Build the product so this policy is enforced by the software:

- Every title has a required "rights basis" field: own work, public domain, Creative Commons (with license name and URL), or licensed (with notes). A title cannot be published without it.
- The admin must tick an attestation checkbox at publish time confirming they have the right to distribute the content.
- Provide Terms of Service, Privacy Policy, and a Content Policy / Takedown page with a contact form.
- Provide a "Report this title" action for viewers and an admin queue to review reports.
- Provide a one-click takedown action for admins: unpublish, stop and delete torrent data, add the infohash to a blocklist, and write an audit log entry.
- Never hardcode, seed, or suggest copyrighted torrents. For demos and tests use only Blender Foundation open movies (such as Big Buck Bunny, Sintel, Tears of Steel) and similar freely licensed works.

## 6. Tech stack (use exactly this unless I approve a change)

| Layer | Choice |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router, TanStack Query, Zustand, Framer Motion (package: motion or framer-motion), Tailwind CSS using CSS variables for design tokens |
| Backend | Node.js 20 LTS, Express, TypeScript, Zod for validation, pino for logging |
| Database | PostgreSQL with Prisma ORM (SQLite allowed for quick local dev only if the schema stays identical) |
| Queue and cache | Redis with BullMQ (transcode jobs, rate limits, short caches) |
| Torrent engine | `webtorrent` running on the server, `parse-torrent` for .torrent parsing |
| Media tools | FFmpeg and ffprobe (remux, transcode, thumbnails, probing) |
| Auth | Email and password with argon2 hashing, JWT access token plus rotating refresh token in httpOnly cookies |
| Uploads | multer with strict size and type limits, files stored on a mounted volume (S3-compatible storage optional later) |
| Testing | Vitest, React Testing Library, Supertest, Playwright, axe-core |
| Delivery | Docker multi-stage builds, docker-compose, nginx reverse proxy, GitHub Actions CI |

Note: recent `webtorrent` versions are ESM-only. Configure the backend as ESM from the start (`"type": "module"`, NodeNext module resolution).

## 7. Design principles

- The interface has a point of view. Do not ship generic template design. Pick deliberate typography, spacing and colour, and commit to them.
- Everything visual is driven by design tokens (CSS variables). No hardcoded colours, radii, fonts or durations in components.
- Personalization is a core feature, not a settings afterthought: theme, fonts, density, corner radius, card style, animation level and speed are all user-controlled and applied live.
- Motion has a purpose. Use motion to confirm actions, show what changed, and create one memorable signature moment. Respect `prefers-reduced-motion` always.
- Accessibility floor: WCAG AA contrast (warn when a custom theme fails), visible keyboard focus, full keyboard navigation, semantic HTML, ARIA only where needed, captions support, responsive down to 360px width.
- Copy is plain and specific. Buttons say what they do ("Save changes", not "Submit"). Errors say what went wrong and how to fix it. Empty states invite an action.

## 8. Engineering rules

- TypeScript strict mode everywhere. No `any` without a comment explaining why.
- One source of truth for types: shared Zod schemas in a `packages/shared` workspace, imported by both apps.
- Validate every request body, query and param with Zod. Never trust the client.
- Never log secrets, tokens, passwords or full torrent file contents.
- All configuration through environment variables, validated at startup with a typed config module. Provide `.env.example`.
- Database changes only through Prisma migrations. Never edit the database by hand.
- Small, focused commits using Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- No dead code, no commented-out code, no placeholder logic, no fake data in code paths that ship. Seed data lives only in the seed script and uses freely licensed demo content.
- Prefer boring, well-known libraries over clever custom code.
- Every new endpoint ships with validation, authorization, tests and an entry in the API docs.

## 9. Working agreement

1. At the start of each phase: read this document and `PROGRESS.md`, then write a short plan (files to create or change, risks, questions). Wait for my approval before editing files.
2. Ask at most 5 clarifying questions, all at once. If I do not answer, state your assumptions explicitly and continue.
3. Work in small numbered steps. After each step, run lint, typecheck and relevant tests, and fix problems before moving on.
4. At the end of each phase: run the full phase gate (install, lint, typecheck, test, build, run), then update `PROGRESS.md` and summarize what changed, what was verified, and what is left.
5. Never silently skip a requirement. If something cannot be done, say so and propose an alternative.
6. Do not start the next phase until I write "continue".

## 10. PROGRESS.md protocol

Create and maintain `PROGRESS.md` in the repo root with these sections:

- Current phase and step
- Completed phases (one line each, with date)
- Decisions made (stack changes, naming, tradeoffs)
- Known issues and follow-ups
- How to run everything locally (exact commands)
- Environment variables added so far

Update it at the end of every phase and whenever a decision changes the plan.

## 11. Definition of done (for every phase)

- Code compiles with zero TypeScript errors and zero lint errors.
- Tests for the phase pass, and new logic has tests.
- The app runs locally with the documented commands.
- Every new screen is responsive, keyboard accessible, and works with every theme preset.
- No console errors or warnings in the browser during normal use.
- `PROGRESS.md` and `.env.example` are updated.
~~~

---

## 4. Prompt 0B: Adopt an existing frontend

Use this if you already built the UI with Antigravity, Claude or anything else. Run it after Prompt 0. It audits first and changes nothing until you approve the plan.

~~~text
I already have a frontend for {{APP_NAME}} in this repository. Do NOT rebuild it from scratch. Audit it, then adapt it to the Master Context.

STEP 1: AUDIT (read only, no edits)
1. List the framework, build tool, routing library, state management, styling approach and component library in use.
2. Map every route and screen that exists. Mark each as: matches the Master Context, partial, or missing.
3. List every place where colours, fonts, radii, shadows, spacing or animation durations are hardcoded.
4. List every place that uses mock or hardcoded data (arrays, JSON files, fake API calls).
5. Check accessibility basics: semantic landmarks, focus styles, alt text, contrast, keyboard use of carousels and modals.
6. Check responsiveness at 360, 768, 1280 and 1920 px.
7. Report bundle size and any obvious performance problems.

STEP 2: GAP REPORT
Produce a table: Requirement from Master Context | Current state | Work needed | Effort (S/M/L).

STEP 3: MIGRATION PLAN
Propose the smallest sequence of steps to:
- Move to the stack in Master Context section 6 (or justify keeping what exists if it is equivalent).
- Introduce the design token system and the theming engine from Phase 2 without changing the visual identity until I approve.
- Replace all mock data with a typed API client layer (`src/api/`) that can point at a mock server first and the real backend later.
- Fill in missing user and admin screens from Phases 3 and 4.

Stop after the plan and wait for my approval. When I approve, implement it in small steps, committing after each, and update PROGRESS.md.
~~~

---

## 5. Phase 1: Project bootstrap and repo structure

~~~text
PHASE 1: PROJECT BOOTSTRAP

Goal: a clean monorepo that installs, lints, typechecks, builds and runs with one command each.

Create this structure (npm workspaces):

```
{{APP_NAME}}/
  apps/
    web/                 React + Vite + TypeScript frontend
    api/                 Express + TypeScript backend
  packages/
    shared/              Zod schemas, shared types, constants
  infra/
    docker/              Dockerfiles, nginx config
    compose/             docker-compose files
  docs/
  scripts/
  .github/workflows/
  CLAUDE.md or workspace rules   (Master Context)
  PROGRESS.md
  README.md
  .env.example
  package.json           workspaces and root scripts
  tsconfig.base.json
  .editorconfig
  .gitignore
  .nvmrc                 Node 20
```

Tasks:
1. Initialize the workspaces and root scripts: `dev` (runs web and api together), `build`, `lint`, `typecheck`, `test`, `format`.
2. Configure TypeScript strict mode with a shared base config. The api uses ESM with NodeNext resolution. The web uses Vite defaults with strict enabled.
3. Add ESLint (typescript-eslint, react-hooks, jsx-a11y, import ordering) and Prettier with one shared config.
4. Add Husky with lint-staged to lint and format on commit, and commitlint for Conventional Commits.
5. In `apps/web`: Vite, React Router, TanStack Query, Zustand, Tailwind (configured to read CSS variables), Framer Motion, an `src/` layout with `app/`, `pages/`, `features/`, `components/`, `lib/`, `api/`, `styles/`, `hooks/`, `stores/`.
6. In `apps/api`: Express app factory (`createApp`) separate from the server entry, typed config module with Zod env validation, pino logger with request IDs, centralized error handler, `GET /api/health` returning status, version and uptime, graceful shutdown.
7. In `packages/shared`: export a first Zod schema (health response) and prove both apps import it.
8. Add `.env.example` with every variable used so far, each with a comment.
9. Write a README with prerequisites, install, run, test, and project layout.
10. Add a minimal GitHub Actions workflow that runs install, lint, typecheck, test and build.

Phase gate: `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run dev` all succeed. The web app shows a placeholder page that calls `/api/health` and displays the result.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 6. Phase 2: Design system and theming engine

This phase is the heart of the personalization. Take your time here.

~~~text
PHASE 2: DESIGN SYSTEM AND THEMING ENGINE

Goal: a token-driven design system where users can change theme colours, fonts, density, corner radius, card style and animation level, and see the change instantly, everywhere, with no flash on page load.

Before writing code, do the design planning pass and show it to me:
1. Design plan: a palette of 4 to 6 named base colours (with hex), the two typefaces and their roles, a layout concept for the home screen described in prose plus an ASCII wireframe, and 3 to 5 principles that make {{APP_NAME}} look like itself rather than a template.
2. Review that plan against the brief. If any part looks like the default you would produce for any streaming app (generic red on black, identical rounded cards, tracked-out all-caps labels above every heading), revise it and tell me what you changed.
3. Pick ONE signature moment for the product (for example an app-load intro or the title-card expansion) and describe it. Everything else stays quiet.
Wait for my approval of the plan, then build.

## 2.1 Token architecture

Create `apps/web/src/styles/tokens.css` and a typed TypeScript mirror in `src/lib/theme/tokens.ts`. All tokens are CSS custom properties on `:root`, overridden by `[data-theme="<id>"]`, `[data-density]`, `[data-radius]`, `[data-motion]`.

Color tokens (each as a space-separated RGB triplet so Tailwind opacity utilities work, or as OKLCH, pick one and stay consistent):
- `--c-bg`, `--c-bg-elevated`, `--c-surface`, `--c-surface-raised`, `--c-surface-hover`
- `--c-border`, `--c-border-strong`
- `--c-text`, `--c-text-muted`, `--c-text-subtle`, `--c-text-on-primary`
- `--c-primary`, `--c-primary-hover`, `--c-primary-active`, `--c-primary-soft`
- `--c-accent`, `--c-accent-soft`
- `--c-success`, `--c-warning`, `--c-danger`, `--c-info`
- `--c-overlay` (modal scrim), `--c-hero-gradient-from`, `--c-hero-gradient-to`
- `--c-focus-ring`

Typography tokens:
- `--font-heading`, `--font-body`, `--font-mono`
- `--fs-scale` (user font size multiplier, 0.9 to 1.3)
- A modular type scale: `--fs-xs` through `--fs-4xl`, each multiplied by `--fs-scale`
- `--fw-regular`, `--fw-medium`, `--fw-bold`, `--fw-heading`
- `--lh-tight`, `--lh-normal`, `--lh-relaxed` (serif body gets slightly more line height)
- `--ls-heading`, `--ls-body`
- Keep body line length under 80 characters.

Shape and depth tokens:
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-pill` (all derived from a single `--radius-base` driven by the user's corner setting: sharp, soft, round)
- `--shadow-1` through `--shadow-4`, `--shadow-focus`
- `--blur-glass` for translucent nav and panels

Spacing tokens:
- `--space-1` through `--space-12` multiplied by `--density` (compact 0.85, comfortable 1, spacious 1.2)
- `--page-gutter`, `--row-gap`, `--card-gap`

Motion tokens:
- `--dur-instant` (80ms), `--dur-fast` (150ms), `--dur-base` (250ms), `--dur-slow` (450ms), `--dur-cinematic` (900ms), all multiplied by `--motion-speed` (0.5 to 2)
- `--ease-standard`, `--ease-out`, `--ease-in`, `--ease-spring` (as cubic-bezier or spring config), `--ease-emphasized`
- `--motion-level` as a data attribute: `off`, `minimal`, `standard`, `expressive`

Layout tokens:
- `--card-aspect-poster` (2/3), `--card-aspect-wide` (16/9)
- `--card-width` driven by the user's card size (small, medium, large)
- `--nav-height`, `--sidebar-width`

Rule: components may only use tokens. Add an ESLint rule or a CI script that fails the build if a hex colour, a raw `px` font size, or a raw `ms` duration appears in component files.

## 2.2 Theme presets

Ship the presets from Appendix A as typed objects in `src/lib/theme/presets.ts`. Each preset defines every colour token and may also suggest default fonts and radius. Presets: midnight-marquee, daylight-matinee, neon-arcade, forest-reel, crimson-classic, slate-ocean, high-contrast. Add a "System" mode that follows `prefers-color-scheme` and maps to one dark and one light preset chosen by the user.

## 2.3 Custom theme builder

Build a custom theme builder (inside the user settings) with:
- Colour pickers for: background, surface, primary, accent, text.
- Automatic derivation of every other token from those five (hover, active, soft, border, muted text, on-primary text) using OKLCH math in `src/lib/theme/derive.ts`, with unit tests.
- Live WCAG contrast checking for text on background, text on surface, and on-primary text on primary. Show a clear pass or fail badge with the ratio. If it fails AA, offer a "Fix automatically" button that nudges lightness until it passes.
- A live preview panel that renders a mini home screen (hero, a row of cards, a button set, a form field) using the draft theme before saving.
- Save as a named custom theme. Allow up to 5 saved custom themes per profile.
- Export theme as JSON, import theme from JSON (validated with Zod, reject unknown keys), reset to preset.
- "Randomize palette" button that produces a harmonious palette (analogous, complementary, triadic options) that still passes contrast.

## 2.4 Fonts

- Self-host fonts using `@fontsource` packages or bundled WOFF2. No third-party font CDN calls (privacy and speed).
- Curated heading fonts: Sora, Space Grotesk, Outfit, Manrope, DM Serif Display, Playfair Display, Bebas Neue.
- Curated body fonts: Inter, Manrope, Source Sans 3, Lora, Atkinson Hyperlegible (accessibility), and an optional dyslexia-friendly option.
- Load only the selected fonts, on demand, latin subset, `font-display: swap`, preload the default pair, and define metric-compatible fallback stacks to avoid layout shift.
- A font picker with a live preview sentence per font, grouped by heading and body, with a "Pair suggestions" shortcut (three tested pairings).
- Font size slider (90% to 130%), letter-spacing option (normal, relaxed), and a toggle to use the body font for headings.

## 2.5 Animation system

Implement the animation system described in Appendix B. Requirements:
- A central `MotionProvider` exposing `level`, `speed`, `reducedMotion` and helpers (`useMotion()`), so no component decides on its own whether to animate.
- Four levels:
  - off: no transitions or animations at all, instant state changes.
  - minimal: opacity-only fades, no movement, no parallax, no autoplaying loops.
  - standard: opacity and transform transitions, hover and press feedback, page transitions, skeleton shimmer.
  - expressive: everything in standard plus the signature moment, shared-element transitions, parallax, spring physics, particle bursts, view-transition theme switch.
- If `prefers-reduced-motion: reduce` is set, default to `minimal`. The user may explicitly choose a higher level in settings, and the app must remember it, but never raise motion on its own.
- If `navigator.connection.saveData` is true or the device is low-power, default to `minimal` unless the user chose otherwise.
- Only animate `transform` and `opacity` (plus `filter` sparingly). Never animate layout properties like width, height, top or left in hot paths.
- A speed multiplier (0.5x to 2x) applied to every duration token and every Framer Motion transition via the provider.
- Pause looping animations when the tab is hidden.
- A reusable set of primitives: `<Reveal>`, `<Stagger>`, `<PressScale>`, `<HoverLift>`, `<PageTransition>`, `<SharedCard>`, `<Skeleton>`, `<AnimatedNumber>`, `<Toast>`. Each reads the motion level and degrades gracefully.

## 2.6 No flash of wrong theme

- Add a tiny inline script in `index.html` that runs before React and reads the saved preferences from `localStorage`, then sets `data-theme`, `data-density`, `data-radius`, `data-motion` and the CSS variables for custom themes on `<html>`.
- Set `color-scheme` and the `<meta name="theme-color">` to match the active theme.
- Guard everything with try and catch, because storage can be unavailable.

## 2.7 Preferences store and persistence

Create `useAppearanceStore` (Zustand) with this shape, validated by a shared Zod schema in `packages/shared`:

```ts
type AppearancePrefs = {
  themeMode: 'preset' | 'custom' | 'system';
  presetId: string;
  systemDarkPresetId: string;
  systemLightPresetId: string;
  customThemes: CustomTheme[];       // max 5
  activeCustomThemeId: string | null;
  headingFont: string;
  bodyFont: string;
  fontScale: number;                 // 0.9 to 1.3
  letterSpacing: 'normal' | 'relaxed';
  density: 'compact' | 'comfortable' | 'spacious';
  radius: 'sharp' | 'soft' | 'round';
  cardStyle: 'poster' | 'wide' | 'minimal';
  cardSize: 'small' | 'medium' | 'large';
  rowStyle: 'carousel' | 'grid';
  heroStyle: 'video' | 'poster-split' | 'minimal';
  navLayout: 'top' | 'sidebar';
  motionLevel: 'off' | 'minimal' | 'standard' | 'expressive';
  motionSpeed: number;               // 0.5 to 2
  autoplayPreviews: boolean;
  glassEffects: boolean;
  filmGrain: boolean;
  subtitleStyle: { size: number; color: string; background: string; edge: 'none' | 'shadow' | 'outline' };
  updatedAt: string;
};
```

- Apply changes live to the DOM through one `applyAppearance(prefs)` function.
- Persist to `localStorage` immediately (debounced 150ms).
- Server sync is added in Phase 10. Design the store now so a `syncFromServer` and `pushToServer` method can be added without refactoring. Conflict rule: the newer `updatedAt` wins.

## 2.8 Appearance settings UI

Build the settings panel as a route (`/settings/appearance`) and also as a quick-access drawer from the nav (a palette icon). Sections:
1. Theme: preset gallery (live-preview thumbnails), light/dark/system, custom builder entry.
2. Typography: heading font, body font, size, letter spacing, pair suggestions.
3. Layout: density, corner style, card style and size, row style, hero style, nav layout.
4. Motion: level, speed slider, autoplay previews, a "Preview animations" button that plays a short demo of the current level.
5. Effects: glass blur, film grain.
6. Subtitles: size, colour, background, edge style, with a live caption preview over a sample frame.
7. Reset: reset a section or everything, with confirmation.

Every control updates the whole app live. The panel itself is keyboard accessible with labeled controls.

## 2.9 Component library

Build these themed, accessible components in `src/components/ui/` with a small showcase page at `/dev/components` (dev only) that renders them under every preset:
Button (primary, secondary, ghost, danger, icon, loading), IconButton, Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, Slider, Tabs, Accordion, Modal, Drawer, Dropdown menu, Tooltip, Toast, Badge, Chip, Avatar, ProgressBar, ProgressRing, Skeleton, EmptyState, ErrorState, Pagination, DataTable, FormField, FileDropzone, ColorPicker, ConfirmDialog.

Use Radix UI primitives (or equivalent headless library) for behavior and accessibility, styled only with tokens.

Phase gate:
- Switching presets, fonts, density, radius and motion level updates the showcase page instantly with no reload and no layout break.
- No flash of default theme on hard reload.
- Contrast checker unit tests pass, derivation tests pass.
- The tokens lint rule passes.
- Lighthouse accessibility score of 95 or higher on the showcase page.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 7. Phase 3: User side frontend

Built against a typed mock API first, so the whole experience can be judged before the backend exists. The mock layer must be swappable for the real API with a single config change.

~~~text
PHASE 3: USER SIDE FRONTEND

Goal: every viewer-facing screen, fully designed, animated, responsive and personalizable, running against a typed mock API.

## 3.0 API client layer and mock server

1. Create `apps/web/src/api/` with one module per resource (`auth`, `titles`, `episodes`, `search`, `watchlist`, `progress`, `ratings`, `collections`, `preferences`, `reports`). Each function is typed with the shared Zod schemas and validates responses at runtime.
2. Create a mock implementation using MSW (Mock Service Worker) that serves realistic data for about 40 titles (25 movies, 15 series with seasons and episodes). Use only freely licensed demo content and generic placeholder artwork generated locally (gradient posters with the title text). No copyrighted posters or names.
3. A single env flag `VITE_USE_MOCKS=true` turns the mock server on. In production builds it must be impossible to enable.
4. TanStack Query setup: sensible stale times, retry rules (no retry on 4xx), query key factory, optimistic updates for watchlist and ratings.

## 3.1 App shell and navigation

- Top navigation (default) and a collapsible left sidebar variant, switchable in settings.
- Nav items: Home, Series, Movies, New and Popular, My List, a search entry, the appearance quick drawer (palette icon), notifications placeholder, and the profile menu.
- The top nav is transparent over the hero and becomes a blurred glass bar after scrolling (smooth, token-driven).
- Mobile: bottom tab bar (Home, Search, My List, Profile) plus a hamburger drawer for the rest.
- Skip-to-content link, landmarks (`header`, `nav`, `main`, `footer`), and a visible focus ring on everything.
- Global keyboard shortcuts: `/` focuses search, `g h` goes home, `g l` goes to My List, `?` opens a shortcuts help dialog.
- Route-level code splitting with a branded loading state.
- Error boundary per route with a friendly error page and a retry button.

## 3.2 Public and auth screens

1. Landing page (logged out): hero with the product name and tagline, a short explanation of how it works, a scrolling sample row of demo titles, a sign-up call to action, and a footer with legal links. This page is where the signature moment (Phase 2) may live, if it is an intro animation. It must be skippable and play once per session.
2. Sign up: email, username, password (with strength meter), confirm password, invite code field (shown only when signups are invite-only), terms checkbox. Inline validation with Zod, clear error messages.
3. Sign in: email or username, password, "remember me", forgot password link.
4. Forgot and reset password screens (UI only now, wired in Phase 6).
5. Email verification notice screen.
6. Profile picker ("Who is watching?"): up to 5 profiles per account, avatar choices, add and edit profile, kids profile toggle, a manage mode. The picker has an entrance animation at standard and expressive levels.

## 3.3 Home

Layout from top to bottom:
1. Hero billboard for the featured title (from admin-managed hero slots). Three hero styles from settings:
   - video: backdrop image that cross-fades to a muted trailer or preview after 3 seconds if autoplay previews are on, with a mute toggle.
   - poster-split: poster on one side, text on the other, slow background drift.
   - minimal: static backdrop, title, buttons.
   Hero shows title logo or name, a two-line synopsis, maturity badge, year, genres, and buttons: Play (or Resume), More info, Add to My List. Hero rotates through up to 5 slots with accessible controls (pause, previous, next, dots).
2. Rows (each row has a title, optional "See all", and a carousel or grid layout per settings):
   - Continue Watching (progress bars on cards, hidden if empty)
   - My List
   - Trending now (ranked cards with big numbers 1 to 10, only if the numbers represent a real ranking)
   - New releases
   - Because you watched {title}
   - One row per top genre
   - Admin-curated collections
3. Footer with legal links and the app version.

Carousel behavior: native scroll with snap, arrow buttons that appear on hover or focus, keyboard arrow navigation within a row, drag with inertia on desktop, swipe on touch, edge fade, lazy-loaded images with blur-up placeholders, virtualization for rows with more than 50 items.

## 3.4 Title card and hover preview

- Card shows poster or wide art, with a progress bar when relevant and a small badge (New, Series, Leaving soon) only when true.
- Hover intent (about 400ms) or keyboard focus expands a preview card: art (and a muted preview clip if autoplay previews are on), title, match or rating, maturity, runtime or seasons, genres, quick actions (Play, Add to list, Like, Dislike, More info). The expansion originates from the card's position and never clips off-screen at the edges of a row.
- Touch devices: tap opens the detail modal directly, no hover preview.
- All card variants (poster, wide, minimal) share one component driven by the `cardStyle` and `cardSize` preferences.

## 3.5 Title detail

Two presentations of the same content:
- Modal: opens from the card with a shared-element animation (expressive level), closes with Escape or outside click, traps focus, updates the URL (`/browse?title=slug`) so it is shareable and back-button friendly.
- Full page (`/title/:slug`): used on direct visits and refresh.

Content:
- Backdrop with gradient, logo or title, tagline, metadata line (year, maturity, runtime or seasons, quality badges such as HD or captions available).
- Actions: Play or Resume, Add to My List, Like or Dislike, Share (copies link), Report.
- Synopsis, cast and crew, genres, content warnings, rights information (license shown in a subtle line, for example "Creative Commons BY 3.0").
- For series: season selector and an episode list (thumbnail, number, title, runtime, synopsis, watched state, progress bar). Episodes animate in with a stagger at standard and above. "Next up" highlighting.
- Trailer button that opens an inline player.
- More like this row.

## 3.6 Browse, filters and search

- Browse pages for Movies and Series: filter bar (genre, year range, maturity, sort by: popular, newest, A to Z, rating), applied filters as removable chips, URL-synced filters, infinite scroll or "Load more" (configurable), skeleton grid while loading, empty state with a reset-filters button.
- Search: opens as an overlay or page. Debounced instant results (title, cast, genre), keyboard navigation through results, highlighted matches, recent searches (stored locally, clearable), "no results" state with suggestions, voice search not required.
- Search results page `/search?q=` with the same card grid and filters.

## 3.7 My List, history and ratings

- My List: grid with sort (recently added, A to Z), remove with an undo toast, empty state with a link to browse.
- Watch history page: list with progress, "remove from history" action, clear all with confirmation.
- Ratings: thumbs up and thumbs down on cards and detail pages, with a tiny bounce at standard and above, optimistic updates.

## 3.8 Watch page and player UI

Build `/watch/:titleSlug` (movies) and `/watch/:titleSlug/:episodeId` (episodes). The player is a custom component around the native `<video>` element.

Controls:
- Play and pause, a seek bar with: played range, buffered range, and a separate "available from peers" indicator in a subtler tone, hover time tooltip, and thumbnail previews when sprite sheets exist.
- Volume with mute and keyboard control, playback speed (0.5x to 2x), fullscreen, picture-in-picture, theatre mode.
- Audio track and subtitle menus (language, size), subtitle styling from the user's appearance settings.
- Quality or mode menu (direct, remuxed, transcoded) shown only when more than one is available.
- Skip intro and skip recap buttons driven by admin-defined markers, sliding in at standard and above.
- Next episode: countdown card near the end with a cancel button, then autoplay.
- Resume prompt: "Resume from 34:12" or "Start over" when progress exists.
- Controls auto-hide after 3 seconds of inactivity (fade), reappear on movement or focus. The cursor hides with them.
- Buffering indicator (ring), error overlay with specific messages and a Retry button, and a "Waiting for peers" state that explains the torrent is warming up and shows a live peer count.
- Torrent stats overlay (toggle with `i`): peers, download speed, buffer health in seconds, current file, stream mode.

Keyboard: Space or `k` play and pause, `j` and `l` back and forward 10s, arrow keys seek 5s and change volume, `f` fullscreen, `m` mute, `c` captions, `t` theatre mode, `<` and `>` speed, `0` to `9` jump to a percentage, `Esc` exits fullscreen.

Touch: double-tap left and right to seek, tap to show or hide controls, a long-press for 2x speed, vertical swipe on the left or right edge for brightness or volume (optional), orientation lock in fullscreen where supported.

Accessibility: every control labeled, controls reachable by keyboard in a logical order, live region announcements for state changes, captions on by default if the user's profile prefers them.

For now the player plays a local sample video through the mock API. Real streaming comes in Phase 8 and 9.

## 3.9 Account and profile settings

- Account: email, username, password change, active sessions with a "sign out everywhere" button, delete account with a confirmation and a data export button.
- Profile: name, avatar, kids mode, maturity limit, language, subtitle preferences, autoplay next episode, autoplay previews.
- Appearance: the full Phase 2 settings panel.
- Legal pages: Terms of Service, Privacy Policy, Content Policy and Takedown request form (UI only).

## 3.10 Installable PWA

- Web app manifest with name, icons, theme colour that follows the active theme at runtime, and shortcuts (Continue watching, Search).
- Service worker caching the app shell and static assets only. Never cache video bytes or authenticated API responses.
- Offline page that explains the app needs a connection to stream.
- Install prompt handled gracefully, never nagging.

## 3.11 Responsive and quality requirements

- Test at 360, 768, 1280 and 1920 px. No horizontal scrolling on the page body, ever.
- Touch targets at least 44px.
- Every screen works under every preset from Appendix A, in every density, and with every motion level.
- All images have alt text or are marked decorative. Lazy-load below-the-fold images.
- Lighthouse on Home and Title pages: performance 85 or higher on a mid-range mobile profile, accessibility 95 or higher.

Phase gate:
- Click through every screen above on desktop and mobile widths against the mock API.
- Switch theme, font, density, radius, card style and motion level while on Home, Title detail and Watch, and confirm each updates live with no breakage.
- Component and page tests for: card hover logic, carousel keyboard navigation, player keyboard shortcuts, and the resume prompt.
- Zero console errors.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 8. Phase 4: Admin side frontend

~~~text
PHASE 4: ADMIN SIDE FRONTEND

Goal: a complete, protected admin area where an admin can publish a movie or a whole TV series end to end, manage torrents, curate the homepage, manage users and handle reports. Still running against the typed mock API (extend the mock server with admin endpoints).

The admin area lives under `/admin`, uses its own layout (left sidebar, top bar with breadcrumbs, a compact density default), and inherits the same token system and appearance settings as the user side. Admin routes are lazy-loaded in a separate chunk so viewers never download admin code.

## 4.0 Access control in the UI

- A `RequireRole` route guard: `ADMIN` and `SUPER_ADMIN` only. Non-admins get a 403 page, logged-out visitors are redirected to sign in and returned after login.
- Admin navigation items are hidden when the role lacks permission (for example, only SUPER_ADMIN sees Site settings and Users role editing).
- Never rely on hiding UI for security. Phase 6 enforces everything on the server.

## 4.1 Admin layout

- Sidebar: Dashboard, Titles, Torrents, Collections and Hero, Users, Reports and Takedowns, Site settings, Audit log. Collapsible, with icons, a badge on Reports for open items.
- Top bar: breadcrumbs, a global admin search (titles, users, torrents by infohash), a "New title" quick action, theme quick-switch, and the profile menu.
- Page header pattern: title, short description, primary action on the right.
- Consistent empty, loading (skeleton) and error states across every admin screen.
- Keyboard shortcuts: `n` new title, `/` search, `g d` dashboard, `g t` titles.

## 4.2 Dashboard

KPI cards (animated number counters at standard and above):
- Total titles, published titles, drafts.
- Active torrents and total cache size versus quota (progress ring).
- Active streams right now, peak streams today.
- Registered users and new signups this week.
- Open reports.

Charts (Recharts or similar, themed through tokens, draw-in animation at standard and above, accessible data table fallback):
- Plays per day (last 30 days).
- Top 10 titles by plays.
- Torrent health: peers over time for the most-watched torrents.
- Bandwidth: download and upload per day.

Panels:
- Recent activity feed (publishes, takedowns, signups, errors).
- Attention list: torrents with zero peers, titles missing artwork or subtitles, failed transcodes, cache above 85 percent of quota.

## 4.3 Titles list

- Data table: poster thumb, name, type (Movie or Series), status (Draft, Scheduled, Published, Unpublished, Takedown), rights basis, torrent health dot, updated at, created by.
- Search, filters (type, status, genre, rights basis, has torrent issues), sort, column visibility toggle, pagination or virtual scroll.
- Bulk actions with confirmation: publish, unpublish, add to collection, change maturity rating, delete (soft delete with 30 day restore).
- Row actions: edit, preview as viewer, duplicate, view in torrent manager, takedown.
- Saved views (for example "Drafts missing artwork").

## 4.4 Create and edit title wizard (the core admin workflow)

A multi-step wizard with a persistent side summary, autosave of drafts every 10 seconds, a "Save and exit" button, and step validation. Steps can be revisited in any order after the first pass.

Step 1: Basics
- Type: Movie or TV Series.
- Name, original name, slug (auto from name, editable, uniqueness check as you type), tagline.
- Synopsis (markdown-lite with a character counter), release year, runtime (movies), maturity rating, original language, country.
- Genres (multi-select with create-new), tags, keywords.
- Cast and crew: add people with name, role (Director, Writer, Actor, etc.), character name, order (drag to reorder).
- Content warnings (optional multi-select).
- Optional "Fetch from TMDB" button (only shown when a TMDB key is configured in Site settings). It pre-fills fields from a search result and the admin reviews every field before saving. Show the required TMDB attribution wherever its data is used.

Step 2: Artwork
- Upload poster (2:3), backdrop (16:9), and title logo (transparent PNG or SVG), plus optional trailer URL or uploaded trailer file.
- Built-in cropper with fixed aspect ratios, zoom, and a focal point selector so responsive crops keep the subject in frame.
- Automatic generation of sizes and WebP versions on the server (mock in this phase).
- A live preview showing the artwork as a card, a hero, and a detail page header, under the currently active theme.
- Validation: minimum resolution, file size limit, allowed types.

Step 3: Media (torrent upload and file mapping)
- Two input methods in tabs: "Upload .torrent file" (drag and drop zone, size limit 5 MB) and "Paste magnet link".
- After parsing, show a Torrent summary card: name, infohash, total size, piece size, number of files, trackers count, creation date.
- File tree view of the torrent contents with sizes. Non-video files are greyed out and unselectable, but subtitle files (.srt, .vtt, .ass) are detected and offered as subtitle imports.
- Movie: select the main video file (auto-selects the largest video file) and optionally mark extras.
- TV Series: an episode mapper:
  - Auto-detect season and episode numbers from file names (patterns like S01E02, 1x02, "Episode 2") and propose a mapping.
  - A table where each row is a file and the admin picks season and episode via dropdowns, with drag-and-drop reordering and a "renumber sequentially" action.
  - Conflict warnings (two files mapped to one episode, gaps in numbering, unmapped video files).
  - Support for multiple torrents per series (for example one torrent per season). The admin can attach another torrent and map it separately.
- Probe results per file shown after the server analyzes it: container, video codec, audio codecs, duration, resolution, and a clear playback verdict: "Plays directly", "Needs remux (fast)", "Needs transcode (slow)" with an explanation. Admin can choose a processing mode per file.
- Torrent health check button: connects, reports peer count and tracker status within 20 seconds, and warns if the torrent looks dead.

Step 4: Episodes and seasons (series only)
- Seasons accordion: season number, name, synopsis, poster.
- Episodes table with inline editing: number, name, synopsis, runtime, air date, thumbnail upload, mapped file badge, intro start and end markers (with a small scrubbable preview to set them), recap markers.
- Bulk tools: add N episodes at once, auto-fill names from a pasted list (one per line), renumber, move episodes between seasons, delete with confirmation.

Step 5: Subtitles
- Upload .srt, .vtt or .ass files, or import ones detected in the torrent.
- Per file: language (searchable list), label, default flag, forced flag. Server converts everything to WebVTT.
- A preview player to check sync, with a "shift all by N seconds" tool.

Step 6: Rights and compliance
- Rights basis (required): Own work, Public domain, Creative Commons, Licensed.
- For Creative Commons: license name and license URL (required). For Licensed: license notes or reference (required).
- Source credit (author or studio) and a source URL if applicable.
- The publish attestation checkbox: "I confirm I have the right to distribute this content on this service." Required to publish.
- A plain-language summary of what the Content Policy requires.

Step 7: Review and publish
- A full summary of all steps with warnings (missing artwork, no subtitles, torrent unhealthy, unmapped episodes) that must be acknowledged or fixed.
- A "Preview as viewer" button that opens the title page as it will appear, using a signed preview token that works only for the admin.
- Publish options: Publish now, Schedule for a date and time, or Save as draft.
- After publishing: success state with a link to the live page, and a "Add another title" action.

Wizard UX details:
- Progress stepper at the top with completion and error indicators.
- Unsaved changes guard when navigating away.
- Step transitions animate at standard and above (slide with fade), cross-fade at minimal, instant when off.
- Upload progress uses an animated ring with stage chips: Uploading, Parsing, Probing, Ready.

## 4.5 Series manager (after creation)

A dedicated screen for managing an existing series: the seasons and episodes tree on the left, an editor on the right, add torrent for a new season, remap files, publish individual episodes, schedule future episode releases (episodes can be Published, Scheduled or Hidden individually), and an "episode availability" matrix showing which episodes have healthy torrents.

## 4.6 Torrent manager

- Table: name, infohash (copy button), linked titles, status (Queued, Downloading, Seeding, Paused, Error, Evicted), progress, peers, download and upload speed, cache size, last accessed.
- Row detail drawer: file list with per-file progress and priority, trackers with status, peer list (anonymized to counts and speeds only), piece map visualization (animated at expressive level), recent log lines.
- Actions: pause, resume, re-verify data, remove data but keep metadata, remove completely, "Test stream" (opens a small player), update trackers, set seeding limit (ratio or hours).
- Global controls: total cache usage versus quota, a "Run cleanup now" button, global upload and download rate limits, maximum concurrent active torrents.
- Live updates every 2 seconds through server-sent events (mocked for now) with a visible "Live" indicator and automatic fallback to polling.
- Blocklist tab: infohashes that can never be added, with reason and date.

## 4.7 Collections and hero management

- Collections: create rows such as "Weekend picks" with a name, description, visibility, and items. Add titles through search and reorder by drag and drop. Types: Manual, By genre (auto), Newest (auto), Most played (auto).
- Homepage layout editor: drag rows into the order viewers will see, toggle visibility, set maximum items per row, and preview the result.
- Hero slots: choose up to 5 featured titles, order them, choose a custom tagline and a custom backdrop crop for each, set optional start and end dates.

## 4.8 Users

- Table: avatar, username, email, role, status (Active, Suspended, Unverified), created, last seen, profiles count.
- Actions: view details, change role (SUPER_ADMIN only), suspend or unsuspend, force password reset, revoke all sessions, delete account.
- Invite management when signups are invite-only: generate invite codes with optional expiry and usage limits, list them, revoke them, see who used each.
- Every destructive action requires a confirm dialog that names the user.

## 4.9 Reports and takedowns

- Queue of viewer reports: title, reason (Copyright, Wrong information, Broken playback, Inappropriate, Other), details, reporter, date, status (Open, Investigating, Resolved, Rejected).
- Detail view with the title preview, the reporter's message, internal notes, and actions: Resolve, Reject, Unpublish title, Full takedown (stop torrent, delete data, blocklist infohash, notify the reporter).
- Takedown requests submitted from the public Content Policy form land in the same queue with a "Rights holder request" tag and a visible response-time indicator.

## 4.10 Site settings (SUPER_ADMIN)

- Branding: app name, tagline, logo, favicon, default theme preset, default fonts, default animation level, and whether users may override them.
- Access: signup mode (open, invite-only, closed), email verification required, default maturity limit for new profiles.
- Streaming: maximum concurrent streams per user, per site, cache quota, default seeding limits, tracker list (add, remove, test), per-torrent idle eviction time.
- Integrations: TMDB API key (optional), SMTP settings with a "send test email" button.
- Legal: editable Terms, Privacy and Content Policy pages (markdown with preview), takedown contact email.
- Maintenance mode toggle with a custom message.
- Every change writes an audit log entry.

## 4.11 Audit log

- Table of: time, actor, action, entity, summary, IP address. Filters by actor, action type, entity type and date range. A detail drawer with before and after values for changes. Export to CSV. Read-only for everyone.

## 4.12 Admin quality requirements

- Everything in the admin area is keyboard accessible and works at 1024 px width and up. Basic read access works down to tablet width. A graceful "Use a larger screen to edit" message on phones for the wizard and torrent manager, while the dashboard and reports remain usable.
- All forms use shared Zod schemas with inline errors, and every submit button shows a loading state and prevents double submission.
- Long operations (probing, transcoding) show a persistent job tray in the top bar listing running jobs, with progress, cancel and retry.
- Table state (sort, filters, page) lives in the URL.

Phase gate:
- Walk the full workflow on mock data: create a movie with a torrent upload, create a series with a three-episode mapping, schedule a title, curate a collection, run a takedown, change site branding.
- Component and flow tests for: the episode auto-mapper (pattern detection unit tests with at least 15 file name samples), the wizard autosave, the role guard, and the takedown confirmation.
- Zero console errors, accessibility score of 95 or higher on dashboard and wizard.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 9. Phase 5: Database and backend foundation

~~~text
PHASE 5: DATABASE AND BACKEND FOUNDATION

Goal: the real backend skeleton, a complete Prisma schema, migrations, a seed script, and the API contract that the frontend already expects.

## 5.1 Contract first

1. Read every function in `apps/web/src/api/` and every mock handler. Those define the contract.
2. Move any request or response schema that is not yet in `packages/shared` into it. The shared Zod schemas are the single source of truth.
3. Produce `docs/api.md` listing every endpoint (method, path, auth, request, response, errors), derived from the shared schemas. Appendix C of the master pack is the starting list. Show me any endpoint you want to add or change before implementing.
4. Generate an OpenAPI document from the Zod schemas (for example with zod-to-openapi) and serve Swagger UI at `/api/docs` in non-production environments only.

## 5.2 Prisma schema

Model these entities. Use UUID primary keys (`@default(uuid())`), `createdAt` and `updatedAt` on everything, enums for fixed sets, and explicit indexes on every foreign key and every column used in filters or sorting.

User and identity
- `User`: id, email (unique, lowercased), username (unique), passwordHash, role (USER, ADMIN, SUPER_ADMIN), status (ACTIVE, SUSPENDED, UNVERIFIED), emailVerifiedAt, lastLoginAt, deletedAt.
- `Profile`: id, userId, name, avatarKey, isKids, maturityLimit, language, autoplayNext, autoplayPreviews, subtitleLanguage, subtitlesDefaultOn. Max 5 per user, enforced in code and tested.
- `ProfilePreferences`: profileId (unique), data (JSON validated by the shared AppearancePrefs schema), version, updatedAt.
- `Session`: id, userId, refreshTokenHash, userAgent, ipAddress, createdAt, lastUsedAt, expiresAt, revokedAt.
- `EmailToken`: id, userId, type (VERIFY, RESET), tokenHash, expiresAt, usedAt.
- `InviteCode`: id, code (unique), createdById, maxUses, usedCount, expiresAt, revokedAt.
- `InviteRedemption`: inviteCodeId, userId, redeemedAt.

Catalog
- `Title`: id, type (MOVIE, SERIES), slug (unique), name, originalName, tagline, synopsis, releaseYear, runtimeMinutes (movies), maturityRating, originalLanguage, country, status (DRAFT, SCHEDULED, PUBLISHED, UNPUBLISHED, TAKEDOWN), publishedAt, scheduledFor, posterKey, backdropKey, logoKey, trailerUrl, trailerAssetKey, focalPoint (JSON), rightsBasis (OWN, PUBLIC_DOMAIN, CREATIVE_COMMONS, LICENSED), rightsLicenseName, rightsLicenseUrl, rightsNotes, sourceCredit, sourceUrl, attestedById, attestedAt, createdById, deletedAt, tmdbId (optional), playCount (denormalized), searchVector (generated tsvector for full-text search).
- `Genre`: id, slug (unique), name. `TitleGenre`: titleId, genreId.
- `Person`: id, name. `TitleCredit`: titleId, personId, role (DIRECTOR, WRITER, ACTOR, PRODUCER, OTHER), characterName, sortOrder.
- `ContentWarning` and `TitleContentWarning` (many to many).
- `Season`: id, titleId, number, name, synopsis, posterKey. Unique on (titleId, number).
- `Episode`: id, seasonId, number, name, synopsis, runtimeMinutes, airDate, stillKey, status (PUBLISHED, SCHEDULED, HIDDEN), scheduledFor, introStartSec, introEndSec, recapStartSec, recapEndSec. Unique on (seasonId, number).

Media and torrents
- `Torrent`: id, infohash (unique, lowercase hex), name, magnetUri, torrentFileKey (stored .torrent file), totalSize, pieceLength, pieceCount, trackers (JSON), files (JSON: index, path, size), status (QUEUED, DOWNLOADING, SEEDING, PAUSED, ERROR, EVICTED), cachedBytes, lastAccessedAt, seedRatioLimit, seedHoursLimit, uploadedById, blocklisted flag.
- `MediaAsset`: id, torrentId, fileIndex, filePath, sizeBytes, container, videoCodec, audioCodecs (JSON), width, height, durationSec, playMode (DIRECT, REMUX, TRANSCODE), processingStatus (PENDING, PROCESSING, READY, FAILED), processedKey (remuxed or HLS output location), errorMessage, titleId (for movies, nullable), episodeId (for episodes, nullable, unique). Exactly one of titleId or episodeId is set.
- `Subtitle`: id, mediaAssetId, language, label, isDefault, isForced, fileKey (WebVTT), source (UPLOAD, TORRENT).
- `TorrentBlocklist`: infohash (unique), reason, addedById, addedAt.

Viewer activity
- `WatchProgress`: profileId, mediaAssetId, positionSec, durationSec, completed, updatedAt. Unique on (profileId, mediaAssetId).
- `WatchEvent`: id, profileId, titleId, episodeId (nullable), startedAt, secondsWatched (for analytics, pruned after 90 days).
- `WatchlistItem`: profileId, titleId, addedAt. Unique on the pair.
- `Rating`: profileId, titleId, value (UP, DOWN). Unique on the pair.

Curation
- `Collection`: id, slug, name, description, kind (MANUAL, GENRE, NEWEST, MOST_PLAYED), genreId (nullable), maxItems, isVisible, sortOrder.
- `CollectionItem`: collectionId, titleId, sortOrder.
- `HeroSlot`: id, titleId, taglineOverride, backdropCrop (JSON), startsAt, endsAt, sortOrder.

Operations
- `Report`: id, titleId, reporterUserId (nullable for public takedown requests), reporterEmail, reason, details, source (VIEWER, RIGHTS_HOLDER), status (OPEN, INVESTIGATING, RESOLVED, REJECTED), resolutionNote, handledById.
- `AuditLog`: id, actorId (nullable for system), action, entityType, entityId, before (JSON), after (JSON), ipAddress, userAgent, createdAt. Append-only: no update or delete code paths.
- `SiteSetting`: key (unique), value (JSON), updatedById.
- `Job`: tracked by BullMQ, but mirror status in the database for the admin job tray: id, type, status, progress, payload, error, createdById.

## 5.3 Migrations, seed and database rules

- Create the initial migration. Add a Postgres full-text search index on Title (name, originalName, synopsis) and a trigram index for fuzzy name matching (enable `pg_trgm`).
- Seed script (`npm run db:seed`) creating: a SUPER_ADMIN from `{{ADMIN_EMAIL}}` with a random password printed once to the console, genres, content warnings, and 6 demo titles using only freely licensed Blender Foundation films with proper rights fields filled. Seeding must be idempotent.
- Soft delete for Title and User (filter `deletedAt` in a single repository layer so it cannot be forgotten).
- Wrap multi-step writes in transactions.
- A repository layer (`apps/api/src/repositories/`) that is the only code importing Prisma. Services call repositories. Routes call services.

## 5.4 API structure

```
apps/api/src/
  app.ts                 createApp()
  server.ts              entry, graceful shutdown
  config/                typed env config
  middleware/            auth, requireRole, validate, rateLimit, error, requestId
  routes/                one file per resource, thin handlers
  services/              business logic
  repositories/          Prisma access
  jobs/                  BullMQ workers (probe, remux, transcode, cleanup)
  torrent/               engine, stream server, health (Phase 8)
  storage/               file storage abstraction (local disk, S3 later)
  lib/                   errors, pagination, slug, crypto, time
  tests/
```

- Standard error shape: `{ error: { code, message, details? } }` with stable machine-readable codes.
- Cursor-based pagination for infinite lists, offset pagination for admin tables. Consistent response envelope.
- A `validate({ body, query, params })` middleware using Zod. Unknown keys are stripped or rejected consistently.
- Implement the read-only public catalog endpoints now (list titles, get title by slug, seasons and episodes, genres, collections, hero slots, search) so the frontend can switch from mocks to the real API for browsing.

## 5.5 Frontend switch-over

- Set `VITE_USE_MOCKS=false` and make the web app run against the real API for everything implemented so far. Fix every contract mismatch by changing the shared schema, not by patching in the client.

Phase gate:
- `npm run db:migrate`, `npm run db:seed`, `npm run dev` work from a clean clone using the README.
- The browse, title detail, search and collection screens render real seeded data.
- Repository and service tests for catalog queries, soft delete, full-text search and pagination pass.
- OpenAPI document generates and validates.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 10. Phase 6: Auth, roles and security

~~~text
PHASE 6: AUTH, ROLES AND SECURITY

Goal: secure authentication, role-based access control, profile management, and a hardened API.

## 6.1 Authentication

- Registration: validate email and username uniqueness (case-insensitive), password policy (minimum 10 characters, check against a small common-password list, strength meter on the frontend), invite code enforcement when `signupMode` is invite-only, terms acceptance recorded with a timestamp and version.
- Password hashing with argon2id and sensible memory and time parameters, configurable by env, with a test asserting the parameters.
- Login: constant-time comparison, generic error messages ("Email or password is incorrect"), lockout or progressive delay after repeated failures per account and per IP, suspended users blocked with a clear message.
- Tokens:
  - Short-lived access JWT (15 minutes) in an httpOnly, Secure, SameSite=Lax cookie.
  - Rotating refresh token (30 days) in a separate httpOnly cookie scoped to the refresh path, stored hashed in the `Session` table.
  - Refresh token reuse detection: if a rotated token is used again, revoke the entire session family and force re-login.
- Endpoints: register, login, logout, logout-all, refresh, me, change password, request email verification, verify email, forgot password, reset password, list sessions, revoke session.
- Email: a mailer abstraction with an SMTP implementation and a console implementation for dev. Verification and reset emails with single-use, hashed, expiring tokens. Templates are plain, accessible HTML with a text alternative.

## 6.2 Authorization

- `requireAuth` and `requireRole('ADMIN' | 'SUPER_ADMIN')` middleware.
- A permissions map (`canPublishTitle`, `canManageUsers`, `canEditSiteSettings`, `canTakedown`) used by services, not scattered role checks.
- Profile ownership checks: any endpoint with a `profileId` verifies it belongs to the authenticated user.
- Kids profiles and maturity limits are enforced on the server in catalog queries, search and streaming. Never trust the client for this.
- Admin endpoints under `/api/admin/*` all pass through one admin router with auth, role check and audit logging attached once.

## 6.3 CSRF and cookies

- Because cookies carry the session, add CSRF protection: SameSite cookies plus a double-submit CSRF token header for all state-changing requests, or a custom header requirement verified server-side. Document which approach and why.
- CORS: explicit allowlist from env, credentials enabled only for those origins.

## 6.4 Hardening

- `helmet` with a strict Content-Security-Policy: scripts from self only, images from self and data URIs, media from self, connect to self, frame-ancestors none. Document any required relaxations.
- Rate limits with Redis-backed counters: login and register (strict), forgot password (strict), search (moderate), stream token issuing (moderate), admin writes (moderate), global default.
- Request body size limits, JSON only unless the route accepts multipart.
- Input validation on everything. Output encoding: never return password hashes, token hashes or internal fields (use explicit response DTOs).
- Uploads: allowlist by magic number as well as extension, size caps (torrent 5 MB, images 10 MB, subtitles 2 MB), random server-generated file names, storage outside the web root, path traversal tests.
- SSRF protection for any server-side URL fetch (poster by URL, TMDB, trackers): block private, loopback and link-local address ranges, enforce timeouts and size limits.
- Security headers for the frontend nginx config (HSTS, no-sniff, referrer policy, permissions policy).
- Secrets only from environment. Fail startup if production secrets are missing or are the example defaults.
- Dependency audit in CI, with a policy for high-severity findings.
- Production error responses never include stack traces.

## 6.5 Audit logging

- A `recordAudit({ actor, action, entityType, entityId, before, after, req })` helper called by every admin mutation, every login failure burst, role changes, takedowns and settings changes.
- Redact sensitive fields before storing.

## 6.6 Frontend wiring

- Wire sign up, sign in, sign out, profile picker, account settings, forgot and reset password, email verification and sessions screens to the real endpoints.
- A silent refresh flow in the API client: on a 401, try one refresh, replay the request once, otherwise redirect to sign in. Guard against refresh stampedes with a single in-flight promise.
- Admin route guards now use the real `me` response.

Phase gate:
- Auth integration tests: register, login, refresh rotation, reuse detection, logout-all, password reset, lockout, role enforcement on every admin route (a test that iterates the route table and asserts that each `/api/admin` route rejects anonymous and USER requests).
- Manual check: a USER visiting `/admin` sees 403, and calling an admin endpoint directly returns 403.
- Security checklist in `docs/security.md` completed with evidence for each item.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 11. Phase 7: Admin API

~~~text
PHASE 7: ADMIN API (TORRENT UPLOAD, METADATA, SERIES MANAGEMENT)

Goal: every admin screen from Phase 4 works against the real backend, except live playback (Phase 8 and 9). All routes live under `/api/admin`, require ADMIN or SUPER_ADMIN, and write audit logs.

## 7.1 Torrent intake

1. `POST /api/admin/torrents/parse` (multipart, field `file`):
   - Accept only `.torrent` files up to 5 MB. Verify it is valid bencode before parsing.
   - Parse with `parse-torrent`. Return: name, infohash, total size, piece length, piece count, trackers, file list (index, path, size), creation date, comment. Never trust file paths: normalize them and reject any containing `..`, absolute paths or null bytes.
   - Reject if the infohash is in `TorrentBlocklist` (return a clear error naming the reason category).
   - If the infohash already exists, return the existing `Torrent` and the titles it is linked to instead of creating a duplicate.
   - Store the original `.torrent` file in storage under a server-generated key. Create the `Torrent` row with status QUEUED but do NOT start downloading yet.
2. `POST /api/admin/torrents/parse-magnet` with `{ magnetUri }`:
   - Validate the magnet format and extract the infohash and trackers.
   - Ask the torrent engine to fetch metadata only (no file data), with a 30 second timeout. Return the same summary as above or a clear timeout error that explains the torrent may have no peers.
3. `GET /api/admin/torrents`, `GET /api/admin/torrents/:id`, `PATCH /api/admin/torrents/:id` (seeding limits, trackers), `DELETE /api/admin/torrents/:id` (remove data and metadata, blocked if linked to published titles unless `force=true`).
4. `POST /api/admin/torrents/:id/health-check`: connect, wait up to 20 seconds, report peers, trackers status and whether metadata and the first pieces of the selected file are reachable.
5. Blocklist endpoints: list, add, remove.

## 7.2 Media probing

- After a torrent is linked to a title or episode, enqueue a BullMQ job `probe`:
  - Download only what is needed for analysis (the head and tail of the file, where container metadata lives) by prioritizing those pieces, then run `ffprobe` against the partial file or a range-backed input.
  - Save container, video codec, audio codecs, resolution, duration and bitrate on `MediaAsset`.
  - Decide the playback verdict:
    - DIRECT: MP4 (H.264 video, AAC audio) with the `moov` atom at the start, or WebM (VP9 or AV1 with Opus).
    - REMUX: video codec is browser-compatible but the container is not (for example MKV with H.264), or the `moov` atom is at the end. Fast, no re-encode.
    - TRANSCODE: audio codec the browser cannot play (AC3, DTS, TrueHD) or an unsupported video codec (HEVC in most browsers, MPEG-2, VC-1).
  - Record the verdict and a human-readable reason that the wizard shows.
- Jobs report progress and write to the `Job` table so the admin job tray shows them. Support cancel and retry. Add timeouts and a concurrency limit from config.
- `GET /api/admin/jobs` and `GET /api/admin/jobs/stream` (server-sent events) for the job tray.

## 7.3 Titles, seasons, episodes

- Full CRUD for titles with the wizard's autosave semantics: `POST /api/admin/titles` creates a DRAFT, `PATCH /api/admin/titles/:id` accepts partial updates and validates only what is present, with an `If-Match` style version check (optimistic concurrency) to prevent two admins overwriting each other.
- Slug uniqueness endpoint for live checking: `GET /api/admin/titles/slug-check?slug=`.
- Seasons and episodes: create, update, delete, reorder, bulk create (`count`), bulk rename from a list, move episode between seasons.
- Media mapping: `PUT /api/admin/titles/:id/media` takes the torrent id and an array of `{ fileIndex, episodeId | null }` mappings. Validate that: file indexes exist and are video files, no two files map to one episode, episodes belong to the title. Create or update `MediaAsset` rows and enqueue probe jobs.
- Server-side episode auto-mapper endpoint `POST /api/admin/torrents/:id/suggest-mapping` using the same pattern logic as the frontend (put the pattern code in `packages/shared` so both use it, with the 15+ file name test cases).
- Publish: `POST /api/admin/titles/:id/publish` with `{ attested: true, scheduleFor? }`. Enforce server-side:
  - rights basis present, plus license name and URL for Creative Commons, plus notes for Licensed,
  - attestation true (store who and when),
  - a poster exists,
  - at least one playable media asset (movies), or at least one playable episode (series),
  - infohash not blocklisted.
  Return a structured list of blocking errors and non-blocking warnings.
- Scheduled publishing: a BullMQ repeatable job (every minute) publishes titles and episodes whose `scheduledFor` has passed, writing audit logs as the system actor.
- Unpublish, restore (from soft delete within 30 days), duplicate title (copies metadata, not media).
- Takedown: `POST /api/admin/titles/:id/takedown` with a reason: sets status TAKEDOWN, stops and deletes torrent data for torrents used only by this title, adds infohashes to the blocklist, closes linked reports as Resolved, and writes an audit entry. The operation must be idempotent and wrapped so a partial failure leaves a clear state to retry.

## 7.4 Artwork and subtitles

- Image upload endpoints for poster, backdrop, logo and episode stills. Validate with magic numbers, enforce minimum resolution and aspect ratio tolerance, strip metadata, and generate responsive WebP variants with `sharp` (for example 200, 400, 800 and 1600 px widths) plus a tiny blurred placeholder (base64 or BlurHash) saved on the record for blur-up loading.
- Apply the focal point when producing crops.
- Serve images through a cacheable route with long-lived immutable cache headers and content-hashed keys.
- Subtitle upload: accept SRT, VTT and ASS. Detect encoding (handle UTF-8, UTF-16 and common legacy encodings), convert to WebVTT, validate cue structure, support a time shift parameter at upload and as a later edit. Reject files that look like binary data.
- Import subtitle files found inside a torrent: download just those small files and process them the same way.

## 7.5 Curation, users, reports, settings

- Collections CRUD with reorder. Auto collections (genre, newest, most played) resolved at read time with caching.
- Hero slots CRUD with start and end dates, order and per-slot overrides.
- Users: list, detail, change role (SUPER_ADMIN only, cannot demote the last SUPER_ADMIN), suspend, unsuspend, force reset, revoke sessions, delete (anonymize, keep audit trail). Invite code endpoints.
- Reports: list with filters, detail, status changes with notes, convert a report into a takedown.
- Public endpoints (rate limited): `POST /api/reports` (viewer report) and `POST /api/takedown-requests` (rights holder form, with email validation and a simple honeypot field).
- Site settings: typed get and put per group (branding, access, streaming, integrations, legal, maintenance), validated by shared schemas, secrets (SMTP password, TMDB key) encrypted at rest with a key from env and never returned in full by the API (mask them).
- Audit log listing with filters and CSV export.
- Optional TMDB proxy `GET /api/admin/tmdb/search` and `GET /api/admin/tmdb/:id`: only enabled when a key exists, SSRF-safe, cached briefly, returns fields mapped to the title wizard.

## 7.6 Frontend wiring

- Switch the admin screens from mocks to the real API. The upload wizard uses real progress events (XHR or fetch streams) and the job tray uses the SSE stream.
- Handle optimistic concurrency conflicts in the wizard with a clear "This title was changed by someone else" dialog offering reload or review differences.

Phase gate:
- Using only the UI, publish a Blender Foundation open movie from a real `.torrent` file and publish a short series by mapping three files to three episodes.
- Tests: torrent parsing with malicious inputs (path traversal names, oversized, invalid bencode), blocklist enforcement, publish validation matrix, scheduled publishing job, takedown idempotency, subtitle conversion with SRT, VTT and ASS fixtures, and role enforcement on every new route.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 12. Phase 8: Torrent streaming engine

The most technical phase. Give it your strongest model and review the plan carefully.

~~~text
PHASE 8: TORRENT STREAMING ENGINE

Goal: stream video from torrents to the browser with fast start and working seeking, safely, with bounded disk and bandwidth use.

Important background (do not skip):
- The server runs the torrent client (`webtorrent` in Node). It connects to normal BitTorrent peers over TCP and UDP and to DHT and trackers. The browser only talks HTTP to our API, so we are not limited to WebRTC peers.
- WebTorrent prioritizes pieces needed by active read streams. Seeking creates a new read stream at the requested byte offset, and the engine should re-prioritize pieces around that offset.
- Browsers request video using HTTP Range requests. We must answer with 206 Partial Content, correct `Content-Range`, `Accept-Ranges: bytes` and `Content-Length`.

## 8.1 Engine service (`apps/api/src/torrent/`)

Create a singleton `TorrentEngine` class with a clean interface so the rest of the app never touches the WebTorrent API directly:

```ts
interface TorrentEngine {
  start(): Promise<void>;
  stop(): Promise<void>;
  fetchMetadata(magnetOrBuffer: string | Buffer, timeoutMs: number): Promise<TorrentSummary>;
  ensureActive(torrentId: string): Promise<ActiveTorrent>;   // add or resume, resolves when metadata is ready
  openFileStream(torrentId: string, fileIndex: number, range: { start: number; end: number }): Promise<Readable>;
  getStatus(torrentId: string): TorrentStatus | null;
  getGlobalStatus(): EngineStatus;
  pause(torrentId: string): Promise<void>;
  resume(torrentId: string): Promise<void>;
  remove(torrentId: string, opts: { deleteData: boolean }): Promise<void>;
  prioritize(torrentId: string, fileIndex: number, opts?: { headBytes?: number; tailBytes?: number }): Promise<void>;
  isFileRangeAvailable(torrentId: string, fileIndex: number, start: number, end: number): boolean;
}
```

Implementation requirements:
1. One WebTorrent client with configuration from env: download and upload speed limits, max connections, DHT on or off, tracker list from site settings, download directory on a mounted volume.
2. Load torrents from the stored `.torrent` file (preferred, so metadata is instant) and fall back to the magnet URI.
3. Selective downloading: when a file is requested, deselect all other files in that torrent (deselect pieces) so we only download what is played. Select the requested file and prioritize its head and tail first (container metadata), then follow the playback position.
4. Concurrency limits from site settings: maximum active torrents (default 5) and maximum concurrent streams. When over the limit, queue new torrents and pause the least recently used idle ones.
5. Track `lastAccessedAt` on every stream open. A cleanup job (every 10 minutes) evicts data for torrents with no streams for the configured idle time, oldest first, until usage is below the quota. Never evict a torrent with an active stream. Mark evicted torrents EVICTED. They re-download on the next play.
6. Disk quota: before starting a download, check free space in the cache and the quota. If the quota would be exceeded, evict first. If eviction cannot free enough, return a clear error to the admin and a friendly "not available right now" to the viewer.
7. Seeding policy: after the played file is complete, keep seeding until the ratio or hours limit is reached, then stop seeding but keep the data until eviction.
8. State recovery: on startup, reconcile the database with the cache directory (mark missing data as EVICTED, resume torrents that were active) without blocking server start.
9. Graceful shutdown: stop accepting streams, destroy the client, flush status to the database.
10. Never expose peer IP addresses to any API response. Return counts and aggregate speeds only.
11. Honor the blocklist: refuse to add any infohash in the blocklist, and remove any active torrent when it gets blocklisted.
12. Emit typed events (`ready`, `progress`, `peers`, `error`, `done`, `evicted`) through an internal event emitter, consumed by the status SSE endpoint and the database sync.

## 8.2 Stream endpoint

`GET /api/stream/:mediaAssetId` (direct play) with the following behavior:

1. Authentication: video elements cannot send Authorization headers, and we use cookies for sessions. Use a short-lived signed stream token anyway so the URL is not a permanent public link:
   - `POST /api/watch/:mediaAssetId/session` (authenticated, profile-aware) checks title status, maturity limit, kids profile and concurrent stream limits, then returns `{ streamUrl, expiresAt, mode, subtitles[], hlsUrl? }`.
   - The `streamUrl` includes a token (JWT or HMAC) bound to the user, profile, media asset and an expiry (for example 6 hours), refreshed by the player before expiry.
2. Range handling:
   - Parse the `Range` header. No range means respond 200 with the full length headers and begin streaming from byte 0 (still efficient because the torrent stream is lazy).
   - Single ranges only: `bytes=start-end`, `bytes=start-`, `bytes=-suffix`. Invalid or unsatisfiable ranges return 416 with `Content-Range: bytes */size`.
   - Respond 206 with `Content-Range`, `Content-Length`, `Accept-Ranges: bytes`, correct `Content-Type` from the container, `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff`.
3. Open the torrent file stream with the requested start and end. On the first request for a file, call `ensureActive` and `prioritize` (head and tail). If metadata is not ready yet, wait up to 15 seconds, then respond 503 with `Retry-After` and a JSON body the player understands (`{ code: "TORRENT_WARMING_UP", peers }`).
4. Client disconnect handling: when the response closes or errors, destroy the torrent read stream immediately so abandoned seeks do not keep downloading unneeded pieces. Test this explicitly.
5. Backpressure: pipe with `stream.pipeline`, never buffer whole ranges in memory.
6. Stalled stream detection: if no bytes are produced for 20 seconds, end the response and record a `stream_stall` metric.
7. Per-user concurrent stream cap and per-IP rate limits for the token issuing endpoint.
8. Log (pino) one structured line per stream session: media asset, user, range start, mode, bytes sent, duration, outcome. No tokens in logs.

## 8.3 Status and warm-up

- `GET /api/watch/:mediaAssetId/status` and `GET /api/watch/:mediaAssetId/status/stream` (SSE): peers, download speed, progress of the selected file, buffer health in seconds ahead of the current position (the player reports its position via a query parameter or a separate POST), available byte ranges (merged ranges, for the seek bar peer indicator), engine state (warming up, streaming, stalled, evicted).
- Warm-up: when a viewer opens a title detail page, the frontend may call `POST /api/watch/:mediaAssetId/warm` (rate limited, requires auth) to start fetching metadata and the head and tail pieces so pressing Play is faster. The engine caps warm-ups and never evicts active streams to make room for them.
- Admin "Pre-cache" action: download the first N megabytes (or the whole file) of a media asset on demand, for titles expected to be popular.

## 8.4 Health and fallbacks

- A health monitor samples peer counts per active torrent every 30 seconds and stores a short history for the admin charts.
- If a torrent has zero peers after the configured wait (default 20 seconds), the stream session response flags `degraded: true` and the player shows a clear message. If the admin configured a `fallbackUrl` on the media asset (direct HTTP source), the stream endpoint proxies to it with the same range semantics. Make the fallback optional per media asset.
- Admin dashboard attention list reads this data.

## 8.5 Tests (no copyrighted data)

- Integration test harness that creates a tiny local swarm: generate a test video with `ffmpeg -f lavfi -i testsrc` (or random bytes for non-video tests), create a `.torrent` for it, run a local seeder and a local tracker in-process, and have the engine download from it. No internet access in tests.
- Test cases:
  - first-byte latency under a threshold on the local swarm,
  - full-range, partial-range, open-ended range and suffix-range responses,
  - 416 handling,
  - a seek to the middle of the file prioritizes pieces there (assert piece availability order or time to first byte at the new offset),
  - client disconnect destroys the read stream,
  - concurrent streams of the same file share downloaded pieces,
  - quota eviction order,
  - blocklist enforcement while active,
  - cleanup does not evict a torrent with an active stream,
  - state recovery after a simulated restart.
- A load test script (k6 or autocannon) that opens 20 concurrent range streams against the local swarm and reports throughput and memory.

Phase gate:
- With a real Blender Foundation torrent: pressing Play starts playback quickly, seeking forward and backward works, and closing the tab stops downloading the unwatched parts.
- All Phase 8 tests pass. Memory stays flat during the load test.
- `docs/streaming.md` explains the architecture in a diagram (Mermaid) and in prose.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 13. Phase 9: Player integration, subtitles and watch progress

~~~text
PHASE 9: PLAYER INTEGRATION, SUBTITLES AND WATCH PROGRESS

Goal: the Phase 3 player plays real torrent-backed video with every feature working: direct play, remuxed or transcoded HLS, subtitles, resume, skip intro and next episode.

## 9.1 Playback modes

1. DIRECT mode: set the `<video>` source to the signed `streamUrl`. Verify seeking works with range requests.
2. HLS mode (for REMUX and TRANSCODE verdicts):
   - Implement an FFmpeg worker (BullMQ job `package-hls`) that reads the source file once it is available on disk and produces VOD HLS: a master playlist, one or more renditions, 4 to 6 second segments. For REMUX use stream copy for video and encode audio to AAC. For TRANSCODE encode video to H.264 and audio to AAC, with a bitrate ladder chosen from the source resolution (for example 480p, 720p, 1080p, never upscaling).
   - The job needs the whole file, so it waits until the torrent finishes the selected file, prioritizing sequential download for it. While the job is not ready, the title shows "Preparing" on the admin side, and viewers see the title only if the admin chose to publish anyway (setting per title: "Show while preparing").
   - Stretch goal (separate follow-up, not required now): progressive HLS generation from the partially downloaded file so playback can begin before the whole file arrives.
   - Store the output under the processed storage key. Serve playlists and segments from `/api/hls/:mediaAssetId/*` with the same token auth, correct MIME types (`application/vnd.apple.mpegurl`, `video/mp2t` or `video/mp4` for fMP4), and long cache headers for segments only inside the user's session.
   - Use `hls.js` on the frontend where native HLS is unsupported, and the native player on Safari and iOS. Expose a quality menu with Auto and manual levels, and an audio track menu when multiple tracks exist.
3. The watch session endpoint chooses the mode based on the media asset's `playMode` and `processingStatus`. If the preferred mode is not ready, it returns a clear state (`PREPARING`) with an estimated progress that the player renders.
4. Thumbnail sprite sheets: an FFmpeg job generating one frame every 10 seconds, packed into sprite sheets with a WebVTT file mapping time ranges to sprite coordinates. The player's seek bar uses it for hover previews.

## 9.2 Player behavior with torrents

- Handle the torrent-specific states in the player UI:
  - Warming up (503 `TORRENT_WARMING_UP`): show a friendly state with peers and a progress hint, retry with backoff up to a limit, then show an actionable error.
  - Stalled: after a stall, show the buffering ring and the "Waiting for peers" message. Offer "Try again".
  - Seek into data that is not yet available: show buffering at the seek position, with the stats overlay explaining that pieces are being fetched.
- Token refresh: request a new stream session before expiry and swap the source without losing the current time.
- Seek bar's "available from peers" indicator comes from the status SSE data (merged byte ranges converted to time ranges using duration and file size, approximated with a constant bitrate assumption, labeled as approximate in code comments).
- Stats overlay (key `i`) reads the status SSE stream.
- On unmount, abort status streams and release media resources.

## 9.3 Subtitles

- The watch session returns the subtitle list. The player adds `<track>` elements pointing to `/api/subtitles/:id.vtt` (token authorized, `Content-Type: text/vtt; charset=utf-8`).
- Styling follows the user's subtitle preferences (size, colour, background, edge style) using `::cue` styles driven by tokens. Because `::cue` support is limited, also implement a custom caption renderer option that draws cues in a DOM overlay (for full style control), with the native tracks hidden in that case.
- Default track selection: the profile's subtitle language preference, forced subtitles when the audio language differs, subtitles off otherwise.
- Keyboard `c` toggles captions, menu allows choosing language and a sync offset (plus or minus seconds) saved per profile and media asset.

## 9.4 Watch progress and continue watching

- `PUT /api/progress` with `{ mediaAssetId, positionSec, durationSec }` for the active profile. The player sends updates every 10 seconds while playing, on pause, on seek end, and on page hide using `navigator.sendBeacon` or `fetch` with `keepalive`.
- Completion rule: mark completed when 92 percent or more is watched or when the position is inside the end credits marker if one exists.
- `GET /api/progress/continue` returns the Continue Watching row: for series it returns the next unfinished or next unwatched episode, for movies the in-progress title. Sorted by most recent activity.
- Resume prompt data: `GET /api/progress/:mediaAssetId`.
- Watch events: write a `WatchEvent` on play start and accumulate seconds watched (batched) for analytics and the admin charts. Increment `playCount` once per unique profile per title per day, not per request.
- "Mark as watched" and "Mark as unwatched" actions on episodes. Clearing history removes progress and events for that profile.

## 9.5 Skip intro, recap and next episode

- Show "Skip intro" while the playback time is between `introStartSec` and `introEndSec`, "Skip recap" likewise. The buttons animate in and out according to the motion level and auto-dismiss after the segment ends.
- Next episode: when 30 seconds remain (or at the credits marker), show a card with the next episode's still, title and a countdown. Autoplay is controlled by the profile setting. Cancel keeps the current video playing. Handle the last episode of a season (go to the next season) and the last episode of the series (offer "Back to title").

## 9.6 Watch page polish

- Persist player preferences per profile: volume, muted state, playback speed (reset to 1x for each new title unless the user opts in), theatre mode, preferred quality.
- Media Session API integration (title, artwork, play, pause, seek handlers) so lock screen and media keys work.
- Picture-in-picture and fullscreen state handled in the store.
- Autoplay policies: start with sound after a user gesture, fall back to muted if the browser blocks it, with a visible unmute prompt.
- Proper cleanup of event listeners and intervals. A test that mounts and unmounts the player 50 times and asserts no listener or interval leaks.

Phase gate:
- Play a direct MP4, a remuxed MKV and a transcoded file (generated locally with FFmpeg test sources). Seek in each. Switch subtitles and audio tracks. Resume after reload. Finish an episode and confirm the next episode flow.
- Tests: progress write and read logic (completion rules), continue-watching ordering, subtitle default selection logic, token refresh without time loss (component test with a mocked video element), HLS job on a tiny test video.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 14. Phase 10: Preferences sync, search, ratings and recommendations

~~~text
PHASE 10: PREFERENCES SYNC, SEARCH, RATINGS AND RECOMMENDATIONS

Goal: personalization follows the profile across devices, search is fast and forgiving, and the home page feels tailored without any machine learning service.

## 10.1 Appearance and preference sync

- `GET /api/profiles/:id/preferences` and `PUT /api/profiles/:id/preferences`, validated with the shared `AppearancePrefs` schema, size-limited (reject over 64 KB), and stored per profile with a `version` and `updatedAt`.
- Client sync logic in `useAppearanceStore`:
  1. On sign in or profile switch, fetch the server copy.
  2. If the server copy is newer than local, apply it. If local is newer, push it. If they differ and timestamps are equal, prefer server.
  3. Push changes debounced (1 second) after any edit. Retry with backoff when offline and flush on reconnect.
  4. Never block rendering on the network. The inline script from Phase 2 renders from `localStorage` first.
- Profile switching applies that profile's theme with the circular reveal transition (View Transitions API at the expressive level, a fade otherwise).
- Account-level default theme: new profiles inherit the site default from Site settings, then diverge.
- Share a theme: "Copy theme link" encodes a custom theme as a compact, validated URL parameter. Opening it offers "Try this theme" and "Save theme". Validate strictly and never evaluate anything from the link.

## 10.2 Search

- Backend search using Postgres full-text search with weights (name highest, then original name, cast, synopsis), plus trigram similarity for typo tolerance and prefix matching for instant results.
- `GET /api/search?q=&type=&genre=&limit=` with a fast autocomplete variant `GET /api/search/suggest?q=` returning titles only, under 50 ms for local data. Respect maturity limits and exclude non-published titles.
- Highlight matched terms in results. Cache popular queries in Redis for 60 seconds.
- Recent searches are stored client-side only.
- Tests with a fixture set: exact match, typo ("breif" finds "brief"), partial match, cast match, accent-insensitive match, empty results.

## 10.3 Ratings

- Thumbs up and thumbs down per profile per title (toggle, change, remove). Aggregates stored for admin insight only (never show raw counts to viewers unless a setting enables "match percentage").
- Ratings feed recommendations.

## 10.4 Recommendations (rule-based, no external AI)

Implement transparent, cheap recommendations in a `RecommendationService`:
1. "Because you watched X": titles sharing genres, cast or tags with a recently completed title, scored with a weighted overlap (genres 0.5, cast 0.3, tags 0.2), excluding anything already watched or disliked.
2. "Trending now": plays in the last 7 days, normalized, with a decay for older plays.
3. "Top picks for you": the profile's top genres from watch history and likes, blended with global popularity (a simple linear mix with a configurable weight).
4. "New releases": most recently published.
5. "More like this" on the title page: same scoring as rule 1, anchored on that title.
- Cache per profile for 10 minutes, invalidate when the profile completes a title or rates something.
- Kids profiles only see titles within their maturity limit in every recommendation.
- A `docs/recommendations.md` explaining the scoring and how to tune it.
- Unit tests with small hand-built catalogs that prove the ranking.

## 10.5 Watchlist

- Add and remove endpoints, idempotent, with optimistic UI already in place. `GET /api/watchlist` with cursor pagination, ordered by most recently added.
- Titles unpublished after being added stay in the list as "No longer available" with a remove action, not silently disappearing.

Phase gate:
- Change theme, fonts, density and motion on one browser, sign in on another browser, and see the same appearance load. Offline edits sync after reconnecting.
- Search feels instant, tolerates a typo, and never leaks unpublished or over-maturity titles.
- Recommendation tests pass. Home rows are populated from real data for a profile with history and sensible defaults for a brand-new profile.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 15. Phase 11: Performance, caching and resilience

~~~text
PHASE 11: PERFORMANCE, CACHING AND RESILIENCE

Goal: the app feels fast on a mid-range phone and a modest VPS, and degrades gracefully when something fails.

## 11.1 Frontend performance

- Set budgets and enforce them in CI: initial JS under 200 KB gzipped for the viewer entry, admin chunk separate, CSS under 40 KB gzipped.
- Analyze the bundle and fix the top offenders: lazy-load Recharts, the cropper, the color picker, hls.js (only when needed), and fonts (only the selected ones).
- Images: responsive `srcset` and `sizes` from the generated variants, `loading="lazy"`, `decoding="async"`, blur-up placeholders, explicit width and height to prevent layout shift, priority hints for the hero image.
- Virtualize long lists (admin tables, grids over 100 items).
- Reduce re-renders: memoize cards, stable query selectors, avoid context churn in the motion and appearance providers (split contexts so a speed change does not re-render everything).
- Prefetch on intent: prefetch the title detail data on card hover or focus, and the watch session on Play hover.
- Measure Core Web Vitals in the real app with `web-vitals` and report them to a `/api/metrics/vitals` endpoint (anonymous, sampled) for the admin dashboard.
- Animation performance audit: record a performance trace of the home page scroll and card hover at the expressive level. No long tasks over 50 ms during animations, no layout thrashing. Fix any that appear.

## 11.2 Backend performance

- Add indexes based on real query plans. Run `EXPLAIN ANALYZE` on the catalog list, search, continue watching and home row queries, and attach a short report to `docs/performance.md`.
- Redis caching for: home rows per profile (short TTL), collections, genre lists, hero slots, popular searches. Cache keys versioned, with explicit invalidation on admin changes.
- HTTP caching: ETag and `Cache-Control` for public catalog responses where safe, immutable caching for image variants.
- Compression (brotli or gzip) for JSON, none for video.
- Connection pooling configured explicitly for Postgres. Query timeouts. N+1 query checks in tests using Prisma query logging.
- Limit response sizes and enforce maximum page sizes.

## 11.3 Resilience

- Health endpoints: `/api/health/live` (process is up) and `/api/health/ready` (database, Redis, storage and torrent engine reachable) used by Docker health checks.
- Timeouts and retries with jitter for outbound calls (TMDB, SMTP). Circuit breaker for TMDB.
- Redis down: the app keeps working without cache and rate limiting falls back to in-memory limits with a warning log.
- Torrent engine failure: streaming endpoints return clear 503 responses, the rest of the API remains available, and the engine restarts itself with backoff.
- Disk full or near full: admin alert, new torrent additions refused, eviction forced.
- Graceful degradation on the frontend: offline banner, retry buttons, stale data shown while refetching, error boundaries per feature.
- Structured logging with request IDs, and an admin-visible "System" panel (read-only) with engine status, queue depth, cache size, recent errors.
- Optional: Prometheus-style `/api/metrics` (protected by a token) exposing active streams, peers, queue sizes, cache bytes, stall count, request latency histogram.

## 11.4 Abuse and cost controls

- Per-user and per-IP bandwidth awareness: cap concurrent streams, cap total streamed bytes per user per day (configurable, off by default).
- Admin setting to limit upload bandwidth of the torrent engine so the VPS network is not saturated.

Phase gate:
- Lighthouse on Home, Title and Watch (mid-range mobile): performance 85 or higher, accessibility 95 or higher, best practices 95 or higher.
- Bundle budgets pass in CI. `docs/performance.md` has before and after numbers.
- Chaos checks documented and passed: stop Redis, stop the torrent engine, fill the cache quota, kill the API during a stream and confirm the player recovers on restart.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 16. Phase 12: Testing

~~~text
PHASE 12: TESTING

Goal: confidence that the whole product works, and keeps working, through automated tests that run in CI.

## 12.1 Test pyramid

- Unit tests (Vitest): pure logic such as theme derivation and contrast math, appearance schema validation, the episode auto-mapper, completion rules, recommendation scoring, slug generation, Range header parsing, token signing and verification.
- Component tests (React Testing Library, Vitest): cards, carousel keyboard navigation, player controls and shortcuts, settings panels, wizard steps, the episode mapper table, route guards. Mock the video element where needed.
- API integration tests (Supertest, a real test Postgres and Redis through Docker or Testcontainers): every route, with success, validation failure, unauthorized and forbidden cases. A route-table test asserting every `/api/admin` route is protected.
- Streaming integration tests: the local swarm harness from Phase 8.
- End-to-end tests (Playwright, against the docker-compose stack with seeded data):
  1. New viewer signs up, creates a profile, browses, adds to My List, plays a title, seeks, leaves, returns and resumes.
  2. Admin logs in, uploads a `.torrent` for a locally generated test video, fills the wizard, attests rights, publishes, and the viewer sees the title.
  3. Admin creates a series, maps three files to episodes, schedules episode 3 for a future time, confirms it is hidden from viewers.
  4. Takedown flow: a viewer reports a title, the admin takes it down, the title disappears and the stream URL stops working.
  5. Personalization: pick a preset, change fonts, set the custom theme with a failing contrast color and see the warning, switch motion level to off and verify no animation runs (check computed styles), reload and confirm no flash, sign in elsewhere and confirm the theme syncs.
  6. Permissions: a USER cannot open `/admin` and cannot call admin endpoints.
- Visual regression tests (Playwright screenshots) for Home, Title detail, Watch, Settings and the admin wizard in three presets (midnight-marquee, daylight-matinee, high-contrast) at two widths. Disable animations in these runs or wait for stable states.
- Accessibility tests: axe-core on every page in e2e, zero serious or critical violations. Keyboard-only walkthrough tests for the carousel, modal and player.
- Reduced motion tests: with `prefers-reduced-motion` emulated, verify the app starts at `minimal` and that no looping animations are running.
- Security tests: auth rate limiting, CSRF rejection, cookie flags, path traversal on uploads and file serving, SSRF rejection of private addresses, malformed Range headers, oversized uploads, token tampering and expiry.
- Load tests: 50 concurrent browsing users and 20 concurrent streams, with thresholds in the script.

## 12.2 Coverage and CI

- Coverage targets: 80 percent lines for shared and api, 70 percent for web. Fail CI below target, but do not chase the number with meaningless tests.
- CI jobs: install and cache, lint, typecheck, unit and component tests, api integration tests (services via Docker), build, e2e (on pull requests to main), dependency audit, bundle budget check, upload Playwright traces and screenshots as artifacts on failure.
- A flaky test policy: quarantine with an issue reference, never retry blindly.

## 12.3 Test data

- Fixtures generated by scripts (FFmpeg test sources, tiny subtitle files, sample `.torrent` files created locally). No copyrighted media in the repository.
- A `npm run test:seed` command that prepares a deterministic database for e2e.

Phase gate:
- All suites green locally and in CI.
- A short `docs/testing.md` explaining how to run each suite, how the swarm harness works, and how to add a new e2e test.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 17. Phase 13: Docker, CI/CD and deployment

~~~text
PHASE 13: DOCKER, CI/CD AND DEPLOYMENT

Goal: one command to run the whole stack locally, and a repeatable, safe path to a production server at {{DOMAIN}} on {{DEPLOY_TARGET}}.

## 13.1 Images

- `infra/docker/api.Dockerfile`: multi-stage build on Node 20 slim. Install production dependencies only in the final stage, include `ffmpeg` and `ffprobe`, run as a non-root user, set `NODE_ENV=production`, add a `HEALTHCHECK` using `/api/health/live`, handle SIGTERM for graceful shutdown (use `tini` or Node's own handling, and test it).
- `infra/docker/web.Dockerfile`: build the Vite app, serve the static output with an unprivileged nginx image, and include the nginx config with security headers, gzip or brotli, long cache for hashed assets, no-cache for `index.html`, SPA fallback to `index.html`, and the PWA service worker served with `no-cache`.
- Keep images small. Add `.dockerignore` files. Pin base image versions (and digests where practical).

## 13.2 Compose files

Create `infra/compose/docker-compose.yml` (local, with hot reload overrides in `docker-compose.dev.yml`) and `docker-compose.prod.yml`. Services:
- `postgres` with a named volume and a health check.
- `redis` with persistence off or minimal (cache and queues only) and a memory limit with an eviction policy suitable for cache.
- `api` depends on healthy postgres and redis, with volumes for: torrent cache, processed media (HLS and images), uploads and `.torrent` files. Separate volumes so they can be sized and backed up differently.
- `worker` (same image as api, different command) for BullMQ jobs: probe, package-hls, thumbnails, cleanup, scheduler. Keep CPU-heavy transcode work off the API process.
- `web` (nginx) as the public entry, proxying `/api` to the API.
- Optional `edge` service (Caddy) for automatic HTTPS in front of `web` in production. Document the alternative of using certbot with nginx.
- Resource limits and restart policies. Only the edge or web service publishes ports. Postgres and Redis are never exposed to the host in production.
- The BitTorrent listening port (TCP and UDP) is published from the `api` service so peers can connect inbound. Document the firewall rules and note that outbound-only still works but with fewer peers.

## 13.3 Reverse proxy specifics for streaming

In the nginx config, for `/api/stream/`, `/api/hls/` and the SSE routes:
- `proxy_buffering off`, `proxy_request_buffering off` where relevant, long `proxy_read_timeout`, HTTP/1.1 with the `Connection` header handled correctly, and pass through the `Range` and `If-Range` headers and the response `Content-Range`.
- Do not apply gzip to video or HLS segments.
- Set `X-Accel-Buffering: no` from the API for SSE.
- Rate limit unauthenticated paths at the proxy as a second layer.
- Forward the real client IP using a trusted proxy configuration, and configure Express `trust proxy` to match exactly.

## 13.4 Configuration and secrets

- Production secrets (JWT secrets, cookie keys, encryption key for settings, database password, SMTP credentials) come from environment files outside the repo or from Docker secrets. `.env.example` documents every variable, its type, a safe default or "required", and what it does.
- A startup script verifies required variables and refuses default secrets in production.
- Document how to generate each secret.

## 13.5 Database operations

- A one-off `migrate` job (`prisma migrate deploy`) runs before the API starts on each deploy.
- Automated nightly `pg_dump` backups to a separate volume or remote storage with 14 day retention, and a documented, tested restore procedure (`scripts/restore.sh`) that you run against a scratch database as part of this phase.
- A backup of uploaded artwork and subtitles. Torrent cache is intentionally not backed up (it can be re-downloaded).

## 13.6 CI/CD pipeline (GitHub Actions)

- On pull request: lint, typecheck, unit, component, integration tests, build, bundle budgets, dependency audit, e2e with docker-compose, upload artifacts on failure.
- On merge to main: build and tag Docker images (commit SHA and `latest`), push to GitHub Container Registry, generate an SBOM, scan the images for vulnerabilities and fail on critical findings.
- On release tag: deploy to production over SSH (or your platform's mechanism): pull images, run the migrate job, restart services with health-check gating, run a smoke test against `{{DOMAIN}}` (health endpoint, home page, a public catalog call), and roll back automatically to the previous image tags if the smoke test fails.
- Manual approval gate before the production deploy, using a protected environment.
- Dependabot or Renovate configuration with grouped updates, plus a policy that major updates of `webtorrent`, `prisma` and `react` are reviewed individually.
- Release notes generated from Conventional Commits.

## 13.7 Observability and operations

- Logs: JSON logs from all services, rotated by Docker with size limits. Optional shipping to a log stack, documented but not required.
- Uptime check against `/api/health/ready`, with an alert path (email or webhook) documented.
- Disk usage alert at 80 percent for the cache volume, and a documented runbook for "disk almost full".
- A `docs/runbook.md` covering: restart procedures, rotating secrets, restoring from backup, clearing the torrent cache, handling a takedown request within the response-time target, investigating a "no peers" complaint, and upgrading Postgres.
- Hosting note to put in the docs: check your hosting provider's acceptable-use policy on BitTorrent traffic before deploying. Some providers restrict it.

## 13.8 Optional stretch (do these only after everything above passes)

- Terraform to provision the VPS, firewall and DNS records, with remote state and a README.
- A staging environment that deploys from `main` automatically, with production promoted from staging by tag.
- Kubernetes manifests (or a Helm chart) as an alternative deployment path, with a clear note on the single-writer nature of the torrent cache volume (one API replica per cache volume, or a dedicated streaming pod).
- S3-compatible storage driver for uploads and processed media, behind the existing storage abstraction.

Phase gate:
- From a clean machine: `docker compose up` starts the whole stack, migrations run, the seed creates the admin, and the app works at the local URL.
- A staging or production deploy completes via the pipeline, with the smoke test passing and a successful, rehearsed rollback.
- Backup and restore rehearsed and documented.

Update PROGRESS.md. Stop and wait for "continue".
~~~

---

## 18. Phase 14: Documentation and final audit

~~~text
PHASE 14: DOCUMENTATION AND FINAL AUDIT

Goal: a project another developer (or future you) can understand, run and operate, and a verified, honest list of what is done.

## 14.1 Documentation set

- `README.md`: what {{APP_NAME}} is, screenshots (desktop and mobile, three themes), feature list, quick start with Docker, local development, project layout, scripts, links to the docs below.
- `docs/architecture.md`: Mermaid diagrams for system context, containers, the streaming request flow (browser, API, torrent engine, peers), the publish flow, and the data model. Plain-language explanation under each.
- `docs/user-guide.md`: for viewers: creating an account, profiles, searching, playing, personalization (with a screenshot of each setting), keyboard shortcuts, troubleshooting playback.
- `docs/admin-guide.md`: for admins: the publish workflow step by step, mapping series episodes, subtitles, collections and hero, handling reports and takedowns, torrent manager, site settings.
- `docs/api.md` and the served OpenAPI document.
- `docs/theming.md`: the token list, how to add a preset, how to add a font, how to add an animation primitive, how the no-flash script works.
- `docs/streaming.md`, `docs/security.md`, `docs/performance.md`, `docs/recommendations.md`, `docs/testing.md`, `docs/runbook.md` (all started in earlier phases, now finalized).
- `docs/decisions/`: Architecture Decision Records for the big choices (server-side torrent engine, token streaming auth, HLS packaging, rule-based recommendations).
- `CONTRIBUTING.md` with the commit convention, branching, test expectations and the PROGRESS.md protocol.
- `LICENSE` plus a `THIRD_PARTY.md` listing dependency, font and icon licenses (generated by a script and reviewed).

## 14.2 Final audit (be honest, do not skim)

1. Walk through Appendix D, item by item. For each item, mark Done, Partial or Missing, with a file path or test name as evidence. Do not mark anything Done without evidence.
2. Search the codebase for: `TODO`, `FIXME`, `console.log`, `debugger`, hardcoded hex colours in components, hardcoded URLs, commented-out code, unused exports and dependencies. Fix or list each.
3. Run the whole test suite, the production build, Lighthouse on key pages, the dependency audit and the container scan. Paste a summary of the results.
4. Do a manual end-to-end session as each persona (viewer, admin, super admin) and write down anything awkward, slow or confusing.
5. Verify the content policy enforcement end to end: try to publish without a rights basis, without attestation, a blocklisted infohash, and a taken-down title's stream URL. Each must fail with a clear message.
6. Verify personalization end to end: every setting in `AppearancePrefs` changes something visible, persists, syncs, and has a reset.
7. Verify accessibility with a keyboard-only pass and a screen reader pass on Home, Title, Watch, Settings and the admin wizard. Record issues and fix them.
8. Verify the motion rules: with level off nothing animates, with `prefers-reduced-motion` the app starts at minimal, the speed multiplier changes durations everywhere, and the signature moment is skippable and plays once.

## 14.3 Final report

Write `docs/FINAL_REPORT.md` with: what was built, what changed from the original plan and why, the audit table, known limitations (for example: streaming quality depends on torrent health, HEVC and some audio codecs require transcoding, there is no DRM), recommended next steps (progressive HLS while downloading, mobile apps, subtitle search integration, richer analytics), and an operations checklist for launch day.

Do not claim completion beyond what the evidence supports.
~~~

---

## 19. Appendix A: Theme presets (JSON)

Give this file to the AI in Phase 2 (`src/lib/theme/presets.json`). All colours are hex. The derivation step produces hover, active, soft and border variants where not listed. Every preset has been chosen so that body text and on-primary text pass WCAG AA. The AI must verify with the contrast unit tests.

```json
[
  {
    "id": "midnight-marquee",
    "name": "Midnight Marquee",
    "mode": "dark",
    "colors": {
      "bg": "#0E1020",
      "bgElevated": "#141730",
      "surface": "#171A2E",
      "surfaceRaised": "#20243D",
      "border": "#2C3150",
      "text": "#ECEAF4",
      "textMuted": "#A5A3B8",
      "primary": "#F2A33A",
      "primaryHover": "#F7B45A",
      "textOnPrimary": "#1A1204",
      "accent": "#5CC8C0",
      "success": "#5BD68A",
      "warning": "#F2C94C",
      "danger": "#FF6B6B",
      "info": "#6CB6FF"
    },
    "suggested": { "headingFont": "Sora", "bodyFont": "Inter", "radius": "soft" }
  },
  {
    "id": "daylight-matinee",
    "name": "Daylight Matinee",
    "mode": "light",
    "colors": {
      "bg": "#F3F5F8",
      "bgElevated": "#FFFFFF",
      "surface": "#FFFFFF",
      "surfaceRaised": "#EAEEF4",
      "border": "#D3DAE6",
      "text": "#14171F",
      "textMuted": "#4A5163",
      "primary": "#3B5BDB",
      "primaryHover": "#2F4AC0",
      "textOnPrimary": "#FFFFFF",
      "accent": "#E8590C",
      "success": "#1F8F4E",
      "warning": "#B7791F",
      "danger": "#C92A2A",
      "info": "#1971C2"
    },
    "suggested": { "headingFont": "Manrope", "bodyFont": "Source Sans 3", "radius": "soft" }
  },
  {
    "id": "neon-arcade",
    "name": "Neon Arcade",
    "mode": "dark",
    "colors": {
      "bg": "#0A0612",
      "bgElevated": "#10081C",
      "surface": "#150B24",
      "surfaceRaised": "#1F1233",
      "border": "#34204F",
      "text": "#F4EEFF",
      "textMuted": "#B3A6CC",
      "primary": "#FF3D9A",
      "primaryHover": "#FF63AE",
      "textOnPrimary": "#1A0010",
      "accent": "#2DE2E6",
      "success": "#4DFFA6",
      "warning": "#FFD166",
      "danger": "#FF5C7A",
      "info": "#7AA2FF"
    },
    "suggested": { "headingFont": "Space Grotesk", "bodyFont": "Manrope", "radius": "sharp" }
  },
  {
    "id": "forest-reel",
    "name": "Forest Reel",
    "mode": "dark",
    "colors": {
      "bg": "#0B1512",
      "bgElevated": "#0F1D18",
      "surface": "#13241E",
      "surfaceRaised": "#1B3329",
      "border": "#264538",
      "text": "#E6F0EA",
      "textMuted": "#9DB5A8",
      "primary": "#7BD389",
      "primaryHover": "#95E0A1",
      "textOnPrimary": "#06210F",
      "accent": "#E5C07B",
      "success": "#7BD389",
      "warning": "#E5C07B",
      "danger": "#F07178",
      "info": "#7FC8E8"
    },
    "suggested": { "headingFont": "DM Serif Display", "bodyFont": "Lora", "radius": "soft" }
  },
  {
    "id": "crimson-classic",
    "name": "Crimson Classic",
    "mode": "dark",
    "colors": {
      "bg": "#121212",
      "bgElevated": "#181818",
      "surface": "#1C1C1E",
      "surfaceRaised": "#2A2A2D",
      "border": "#3A3A3F",
      "text": "#F5F5F5",
      "textMuted": "#B0B0B5",
      "primary": "#D81F26",
      "primaryHover": "#EE3A41",
      "textOnPrimary": "#FFFFFF",
      "accent": "#F5C518",
      "success": "#46D369",
      "warning": "#F5C518",
      "danger": "#FF5A5F",
      "info": "#5DADE2"
    },
    "suggested": { "headingFont": "Bebas Neue", "bodyFont": "Inter", "radius": "sharp" }
  },
  {
    "id": "slate-ocean",
    "name": "Slate Ocean",
    "mode": "dark",
    "colors": {
      "bg": "#0F1A24",
      "bgElevated": "#13212D",
      "surface": "#172635",
      "surfaceRaised": "#203649",
      "border": "#2D4A63",
      "text": "#E8F1F8",
      "textMuted": "#9FB6C7",
      "primary": "#4CC9F0",
      "primaryHover": "#74D6F4",
      "textOnPrimary": "#04202B",
      "accent": "#F72585",
      "success": "#52D6A0",
      "warning": "#FFC857",
      "danger": "#FF6F7D",
      "info": "#4CC9F0"
    },
    "suggested": { "headingFont": "Outfit", "bodyFont": "Inter", "radius": "round" }
  },
  {
    "id": "high-contrast",
    "name": "High Contrast",
    "mode": "dark",
    "colors": {
      "bg": "#000000",
      "bgElevated": "#050505",
      "surface": "#0A0A0A",
      "surfaceRaised": "#141414",
      "border": "#FFFFFF",
      "text": "#FFFFFF",
      "textMuted": "#E0E0E0",
      "primary": "#FFD400",
      "primaryHover": "#FFE24D",
      "textOnPrimary": "#000000",
      "accent": "#00E5FF",
      "success": "#00FF85",
      "warning": "#FFD400",
      "danger": "#FF5252",
      "info": "#00E5FF"
    },
    "suggested": { "headingFont": "Atkinson Hyperlegible", "bodyFont": "Atkinson Hyperlegible", "radius": "soft" }
  }
]
```

Rules for presets:
- High Contrast also forces thicker focus rings (3px), visible borders on all interactive elements, and disables glass blur and film grain.
- A preset never sets motion. Motion is a separate user preference.
- Adding a preset means adding an object here and a test that checks contrast for text, muted text and on-primary text.

---

## 20. Appendix B: Animation catalog

Levels: **O** off, **M** minimal, **S** standard, **E** expressive. A dash means the animation does not play at that level. Durations use tokens and are multiplied by the user's speed setting.

| Animation | Where | M | S | E | Duration token | Notes |
|---|---|---|---|---|---|---|
| Page transition | Route changes | fade | fade and 12px rise | shared-element where possible | base | Never block navigation, interruptible |
| Signature moment | App load or title expansion (pick one in Phase 2) | - | short version | full version | cinematic | Skippable, once per session |
| Hero backdrop drift | Home hero | - | slow 6 percent zoom | zoom plus subtle parallax | 20s loop | Paused when tab hidden or hero off-screen |
| Hero text reveal | Hero title and buttons | fade | fade and rise, staggered | staggered with mask reveal | slow | Runs once per hero change |
| Hero crossfade | Hero rotation | fade | fade | fade with brief color wash | slow | Pauses on hover and focus |
| Row entrance | Rows on first view | - | fade and rise | staggered cards | base | IntersectionObserver, once per row |
| Card hover | Title cards | outline only | scale to 1.04 and lift | scale to 1.08, glow, tilt | fast | Hover intent 400ms before preview |
| Preview expansion | Hover preview card | fade | scale from card origin | spring from card origin | base | Never clips at row edges |
| Card to modal | Opening title detail | fade | scale and fade | shared-element layout transition | base | Reverse on close |
| Carousel scroll | Row arrows and drag | native | eased scroll | inertial with overshoot | base | Respect snap points |
| Skeleton shimmer | Loading states | static | shimmer sweep | shimmer sweep | 1.4s loop | Stop after 8s, show error or retry |
| Button press | All buttons | - | scale to 0.97 | scale and ripple | instant | Transform only |
| Button loading | Async actions | spinner | spinner | spinner morph from label | fast | Keep width stable |
| Watchlist add | Add to My List | icon swap | icon morph | icon morph plus small particle burst | base | Announce via live region |
| Rating thumbs | Like and dislike | icon swap | bounce | bounce plus ring pulse | base | Optimistic |
| Toast | Notifications | fade | slide and fade with timer bar | slide, fade and spring | base | Pause on hover |
| Modal and drawer | Dialogs | fade | scale or slide | spring | base | Trap focus, restore focus |
| Theme switch | Changing theme | instant | crossfade colors | circular reveal (View Transitions API) | slow | Fallback to crossfade |
| Nav glass | Top nav on scroll | instant | background fade and blur | background fade, blur and shrink | fast | Token-driven |
| Player controls | Auto-hide | fade | fade and slide | fade and slide with blur | fast | Pointer and focus bring back |
| Skip intro and next episode | Player buttons and card | fade | slide in from edge | slide with progress fill | base | Auto-dismiss at segment end |
| Buffering ring | Player | spinner | ring | ring with peer count pulse | loop | Accessible label |
| Seek preview | Seek bar hover | tooltip | tooltip with thumbnail | thumbnail with smooth follow | instant | Throttled |
| Animated numbers | Admin KPIs | static | count up | count up with easing | slow | Respect locale format |
| Chart draw-in | Admin charts | static | draw in | draw in with stagger | slow | Data table fallback |
| Upload progress | Admin wizard | bar | ring with stage chips | ring, chips and success burst | base | Reports real progress |
| Wizard step change | Admin wizard | fade | slide and fade | slide, fade and slight depth | base | Direction follows step order |
| Piece map | Torrent drawer | static | static | live updating tiles with soft pulse | fast | Cap update rate to 4 fps |
| Empty state | Empty lists | static | fade in | gentle idle motion | slow | Idle motion pauses when off-screen |

Global rules:
1. At level O nothing moves and nothing transitions, including hover color changes beyond immediate state.
2. Animate only `transform`, `opacity` and sparingly `filter`.
3. No animation may block input, keep focus from moving, or hide content that is needed to continue.
4. Never run more than a few simultaneous animations on screen. Stagger caps at 12 items, the rest appear together.
5. Looping animations pause when the tab is hidden or the element is off-screen.
6. Defaults: `prefers-reduced-motion: reduce` gives M. `saveData` gives M. A user's explicit choice wins, but we never raise it automatically.

---

## 21. Appendix C: API endpoint reference

Starting list. The AI may refine details during Phase 5, but must show any change before implementing. Auth column: P public, U authenticated user, A admin, S super admin.

### Auth and account

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | P | Create account (invite code if required) |
| POST | /api/auth/login | P | Sign in |
| POST | /api/auth/logout | U | Sign out this session |
| POST | /api/auth/logout-all | U | Sign out every session |
| POST | /api/auth/refresh | P | Rotate refresh token |
| GET | /api/auth/me | U | Current user and profiles |
| POST | /api/auth/verify-email/request | U | Send verification email |
| POST | /api/auth/verify-email | P | Confirm token |
| POST | /api/auth/forgot-password | P | Send reset email |
| POST | /api/auth/reset-password | P | Reset with token |
| POST | /api/auth/change-password | U | Change password |
| GET | /api/auth/sessions | U | List sessions |
| DELETE | /api/auth/sessions/:id | U | Revoke a session |
| DELETE | /api/account | U | Delete account |
| GET | /api/account/export | U | Export my data |

### Profiles and preferences

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/profiles | U | List profiles |
| POST | /api/profiles | U | Create profile (max 5) |
| PATCH | /api/profiles/:id | U | Update profile |
| DELETE | /api/profiles/:id | U | Delete profile |
| GET | /api/profiles/:id/preferences | U | Get appearance and player preferences |
| PUT | /api/profiles/:id/preferences | U | Save preferences |

### Catalog (viewer)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/home | U | Home rows for the active profile |
| GET | /api/hero | U | Hero slots |
| GET | /api/titles | U | Browse with filters and cursor |
| GET | /api/titles/:slug | U | Title detail |
| GET | /api/titles/:slug/similar | U | More like this |
| GET | /api/titles/:slug/seasons | U | Seasons and episodes |
| GET | /api/genres | U | Genres |
| GET | /api/collections/:slug | U | Collection items |
| GET | /api/search | U | Search results |
| GET | /api/search/suggest | U | Autocomplete |

### Viewing

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/watch/:mediaAssetId/session | U | Create playback session (stream URL, subtitles, mode) |
| POST | /api/watch/:mediaAssetId/warm | U | Warm up torrent |
| GET | /api/watch/:mediaAssetId/status | U | Torrent and buffer status |
| GET | /api/watch/:mediaAssetId/status/stream | U | SSE status |
| GET | /api/stream/:mediaAssetId | Token | Direct play with Range |
| GET | /api/hls/:mediaAssetId/* | Token | HLS playlists and segments |
| GET | /api/subtitles/:id.vtt | Token | Subtitle file |
| GET | /api/thumbs/:mediaAssetId/* | Token | Seek thumbnails |
| PUT | /api/progress | U | Save progress |
| GET | /api/progress/continue | U | Continue watching |
| GET | /api/progress/:mediaAssetId | U | Resume position |
| GET | /api/watchlist | U | My List |
| PUT | /api/watchlist/:titleId | U | Add |
| DELETE | /api/watchlist/:titleId | U | Remove |
| PUT | /api/ratings/:titleId | U | Rate |
| DELETE | /api/ratings/:titleId | U | Remove rating |
| POST | /api/reports | U | Report a title |
| POST | /api/takedown-requests | P | Rights holder request |

### Admin

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/admin/dashboard | A | KPIs and charts data |
| POST | /api/admin/torrents/parse | A | Parse uploaded .torrent |
| POST | /api/admin/torrents/parse-magnet | A | Fetch metadata for magnet |
| GET | /api/admin/torrents | A | List torrents |
| GET | /api/admin/torrents/:id | A | Torrent detail |
| PATCH | /api/admin/torrents/:id | A | Update limits and trackers |
| DELETE | /api/admin/torrents/:id | A | Remove torrent |
| POST | /api/admin/torrents/:id/health-check | A | Peer and tracker check |
| POST | /api/admin/torrents/:id/suggest-mapping | A | Episode mapping suggestion |
| POST | /api/admin/torrents/:id/precache | A | Pre-download |
| GET | /api/admin/blocklist | A | List blocklist |
| POST | /api/admin/blocklist | A | Add infohash |
| DELETE | /api/admin/blocklist/:infohash | A | Remove |
| GET | /api/admin/titles | A | List titles |
| POST | /api/admin/titles | A | Create draft |
| GET | /api/admin/titles/:id | A | Detail |
| PATCH | /api/admin/titles/:id | A | Update (with version check) |
| GET | /api/admin/titles/slug-check | A | Slug availability |
| PUT | /api/admin/titles/:id/media | A | Map torrent files |
| POST | /api/admin/titles/:id/artwork/:kind | A | Upload artwork |
| POST | /api/admin/titles/:id/publish | A | Publish or schedule |
| POST | /api/admin/titles/:id/unpublish | A | Unpublish |
| POST | /api/admin/titles/:id/takedown | A | Full takedown |
| POST | /api/admin/titles/:id/duplicate | A | Duplicate |
| POST | /api/admin/titles/:id/restore | A | Restore |
| DELETE | /api/admin/titles/:id | A | Soft delete |
| POST/PATCH/DELETE | /api/admin/titles/:id/seasons | A | Manage seasons |
| POST/PATCH/DELETE | /api/admin/seasons/:id/episodes | A | Manage episodes |
| POST | /api/admin/media/:id/subtitles | A | Upload subtitle |
| PATCH/DELETE | /api/admin/subtitles/:id | A | Edit or remove subtitle |
| GET/POST/PATCH/DELETE | /api/admin/collections | A | Manage collections |
| GET/PUT | /api/admin/hero | A | Hero slots |
| GET | /api/admin/users | A | List users |
| PATCH | /api/admin/users/:id | A | Suspend, reset, revoke |
| PATCH | /api/admin/users/:id/role | S | Change role |
| GET/POST/DELETE | /api/admin/invites | A | Invite codes |
| GET | /api/admin/reports | A | Reports queue |
| PATCH | /api/admin/reports/:id | A | Update report |
| GET/PUT | /api/admin/settings/:group | S | Site settings |
| GET | /api/admin/audit | A | Audit log |
| GET | /api/admin/jobs | A | Jobs |
| GET | /api/admin/jobs/stream | A | SSE job updates |
| GET | /api/admin/system | A | Engine and system status |
| GET | /api/admin/tmdb/search | A | Optional TMDB search |

### Public and platform

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/health/live | P | Liveness |
| GET | /api/health/ready | P | Readiness |
| GET | /api/site | P | Public branding and settings |
| GET | /api/legal/:page | P | Terms, privacy, content policy |
| POST | /api/metrics/vitals | P | Web vitals (sampled) |
| GET | /api/metrics | Token | Prometheus metrics |

---

## 22. Appendix D: Acceptance checklist

Use this at the end (Phase 14). Every line needs evidence (test name, file or screenshot).

### Viewer experience
- [ ] Sign up, verify email, sign in, sign out, reset password work.
- [ ] Up to 5 profiles, kids profile restrictions enforced on the server.
- [ ] Home shows hero, Continue Watching, My List, Trending, New, genre and curated rows.
- [ ] Card hover preview, title modal and full title page work, including series seasons and episodes.
- [ ] Browse filters, instant search with typo tolerance, and search results page work.
- [ ] Player: direct play, HLS play, seeking, volume, speed, fullscreen, PiP, theatre mode.
- [ ] Subtitles with styling preferences and sync offset. Audio track switching when available.
- [ ] Resume, skip intro, skip recap, next episode flow.
- [ ] Torrent states are explained (warming up, waiting for peers, stalled) with a working retry.
- [ ] Watchlist, ratings, history, report a title.
- [ ] Installable PWA, offline page, no video bytes cached by the service worker.

### Personalization
- [ ] 7 theme presets, light, dark and system modes.
- [ ] Custom theme builder with live preview, contrast warnings, auto fix, save up to 5, export and import.
- [ ] Heading and body font pickers with live preview, font size and letter spacing.
- [ ] Density, corner style, card style and size, row style, hero style, nav layout.
- [ ] Motion level (off, minimal, standard, expressive), speed multiplier, autoplay previews, glass and grain effects.
- [ ] Subtitle appearance settings with live preview.
- [ ] Everything applies live, persists locally, syncs per profile, resets cleanly, and shows no flash on reload.
- [ ] Reduced motion and data saver defaults respected.

### Admin experience
- [ ] Dashboard KPIs, charts and attention list with real data.
- [ ] Title wizard: basics, artwork with focal point, torrent upload and magnet, file mapping, subtitles, rights, review, publish or schedule.
- [ ] Series manager with seasons, episodes, intro markers, scheduled episodes.
- [ ] Torrent manager with live status, actions, blocklist, cache controls.
- [ ] Collections, homepage row order and hero slots.
- [ ] User management, invite codes, role changes with last super admin protection.
- [ ] Reports queue, takedown flow, rights holder form.
- [ ] Site settings with masked secrets, audit log with export.

### Streaming and media
- [ ] Playback begins quickly on a healthy torrent and seeking works in all modes.
- [ ] Range handling correct (200, 206, 416), client disconnect stops downloading.
- [ ] Selective download of only the played file, disk quota and eviction work, active streams never evicted.
- [ ] Probe verdicts (direct, remux, transcode) are accurate on test fixtures.
- [ ] Peer IPs never exposed through any API.

### Security and compliance
- [ ] Argon2id, rotating refresh tokens with reuse detection, CSRF protection, strict CSP, rate limits.
- [ ] Every admin route protected (route-table test), maturity limits enforced server-side.
- [ ] Upload validation, path traversal and SSRF protections tested.
- [ ] Rights basis and attestation required to publish, takedown works end to end, blocklist enforced.
- [ ] Terms, Privacy and Content Policy pages present and editable.
- [ ] Audit log covers every admin mutation.

### Quality and operations
- [ ] Lint, typecheck, unit, component, integration, streaming, e2e, accessibility, security and load tests pass in CI.
- [ ] Lighthouse targets met, bundle budgets enforced.
- [ ] Docker stack runs from a clean clone, migrations and seed work.
- [ ] CI/CD with image scan, gated deploy, smoke test and rehearsed rollback.
- [ ] Backup and restore rehearsed. Runbook written.
- [ ] README and all docs complete, FINAL_REPORT written honestly.

---

## 23. Appendix E: Utility prompts

### E1. Resume in a fresh session

~~~text
Read the Master Context and PROGRESS.md. Summarize in 10 lines: current phase and step, what is done, what is broken, and the next three actions. Then run install, lint, typecheck and tests, and report the results before changing anything. Wait for my go-ahead.
~~~

### E2. Fix a bug

~~~text
Bug report:
- What I did: [steps]
- What I expected: [expected]
- What happened: [actual]
- Where: [screen or endpoint]
- Error output (verbatim): [paste console, server log or test output]

First, reproduce it and explain the root cause in plain language. Then write a failing test that captures the bug. Then fix the root cause with the smallest change. Run the full relevant test suites and confirm the new test passes. Do not paper over the symptom, and tell me if the same flaw exists elsewhere.
~~~

### E3. Code review

~~~text
Review the changes in [branch, folder or files] as a strict senior reviewer. Check against the Master Context: correctness, security (auth, validation, injection, path traversal, SSRF), accessibility, token usage (no hardcoded colors, radii, fonts or durations), motion rules, performance, error handling, test coverage and naming. Return a prioritized list: Blockers, Should fix, Nice to have, each with file and line and a concrete suggested change. Do not change code until I choose what to fix.
~~~

### E4. Add a new theme preset

~~~text
Add a new theme preset named [name] with these base colors: background [hex], surface [hex], text [hex], primary [hex], accent [hex]. Derive the remaining tokens with the derivation utility, check contrast for body text, muted text and on-primary text, and fix by adjusting lightness if any fail AA. Add the preset to presets.json, add its contrast test, add its thumbnail to the gallery, and verify the showcase page and the Home screen under it. Report the contrast ratios.
~~~

### E5. Add a new animation or change the signature moment

~~~text
Add or change this animation: [describe the motion, where it appears, what triggers it]. Follow the Appendix B rules: tokens for duration and easing, transform and opacity only, behavior defined for every motion level (off, minimal, standard, expressive), speed multiplier respected, paused when hidden, no input blocking, focus unaffected. Add it to the catalog table in docs/theming.md and write a test that proves it does not run at level off and respects prefers-reduced-motion. Record a short performance trace and confirm there are no long tasks.
~~~

### E6. Add a new user setting

~~~text
Add a new appearance setting: [name, options, what it changes]. Update the shared Zod schema and the AppearancePrefs type, defaults, the apply function, the inline pre-render script (if it affects first paint), the settings UI with a live preview, the reset logic, the server sync validation, the tests and docs/theming.md. Bump the preferences schema version and write a migration that fills the default for existing saved preferences.
~~~

### E7. Security review

~~~text
Perform a security review of the whole project against OWASP ASVS level 2 concepts, focusing on: authentication and session management, access control on every route, input validation, file uploads, SSRF, path traversal, CSRF, CORS, CSP, secrets handling, logging of sensitive data, rate limiting, dependency risk, container hardening and the torrent engine (peer privacy, blocklist, disk exhaustion, resource limits). For each finding give severity, evidence (file and line), exploit scenario in one or two sentences, and a fix. Write the report to docs/security-review.md. Fix Critical and High findings after I approve.
~~~

### E8. Design critique and polish

~~~text
Critique the current UI of [screen] as a design lead. Compare it to the design plan from Phase 2. Identify anything that looks like a generic template default, inconsistent spacing or type scale, weak hierarchy, contrast problems, awkward empty or error states, and motion that does not serve a purpose. Take screenshots at 360, 768 and 1440 px in two presets. Propose a short list of changes, then apply only the ones I approve. Spend boldness in one place: keep one memorable element and quiet everything else.
~~~

### E9. Explain it to me

~~~text
Explain how [feature or file] works as if I am a third-year computer science student who knows Java and basic web development but is new to this part of the stack. Use a short diagram (Mermaid), walk through one real request or interaction from start to finish, point to the exact files involved, and list the three most likely things to break and how to debug each.
~~~

### E10. Context overflow recovery

~~~text
The session is getting long. Update PROGRESS.md with everything a fresh session needs: decisions, current step, open issues, exact commands, and file paths of work in progress. Commit all work. Then list the files I should open in the next session. Do not start new work.
~~~

---

End of pack. Run Prompt 0, then Phase 1, and go one phase at a time.
