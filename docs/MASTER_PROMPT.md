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
