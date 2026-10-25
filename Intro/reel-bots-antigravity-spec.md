# REEL-BOTS: Master Build Specification for Google Antigravity

Version: 1.0
Audience: the Antigravity agent(s) that will design, build, test and document this system.
Reading time: about 25 minutes. Read ALL of it before you plan. Do not skim.

---

## 0. How to read this document

| Keyword | Meaning |
|---|---|
| MUST / MUST NOT | Hard requirement. Violating it is a bug. |
| SHOULD | Default behavior. Deviate only with a written reason in `docs/ASSUMPTIONS.md`. |
| MAY | Optional. |
| `TODO(owner)` | Something only the project owner can answer. Do not guess silently. Add it to `docs/OPEN_QUESTIONS.md` and implement a safe default behind an env var. |
| **Contract** | A normative interface or schema. Implement it exactly. Changing a contract requires updating `docs/CONTRACTS.md` first. |

Conventions:

1. Section numbers (for example "§12.3") are stable references. Use them in code comments, task names and artifacts.
2. Code blocks marked `// CONTRACT` or `-- CONTRACT` are normative starting points, not suggestions.
3. When this document and your instincts disagree, this document wins.
4. When this document is silent, choose the simplest option that satisfies the acceptance criteria (§22) and record the choice in `docs/ASSUMPTIONS.md`.
5. The canonical test movie is the public-domain film *Night of the Living Dead* (1968). Its TMDB id is believed to be 10331. Verify it against the live TMDB API or recorded fixtures. Never hardcode it in production code, only in tests and fixtures.
6. "The owner" means the person who commissioned this project. "A user" means a viewer of the owner's streaming web app.

---

## 1. Mission and architecture overview

### 1.1 Mission in one paragraph

The owner runs a Netflix-like web app that streams movies using sequential torrenting (pieces are downloaded roughly in playback order so playback can start before the download finishes). Today the owner sends a magnet link or `.torrent` file to a Telegram bot, types the movie details by hand, and an existing "torrent streamer" service streams the file into the web app. Build three cooperating Telegram bots that remove all of that manual work. The owner gives a movie NAME or a TMDB ID once, and the system finds legal torrents, enriches the movie details, prepares multiple audio/quality variants, and lets each user stream the variant that matches their personal settings.

### 1.2 The three bots

| Bot | Short role | Owns |
|---|---|---|
| **ScoutBot** | Discovery | Resolving a name or TMDB id, querying legal sources, de-duplicating torrents, publishing candidates |
| **CuratorBot** | Enrichment and registration | Matching candidates to TMDB, filling movie details, parsing and verifying audio/resolution, ranking, registering torrents with the streamer |
| **ProjectorBot** | Playback preparation | Per-user preferences, choosing the right torrent per user, starting and stopping streams, HTTP API for the web app |

Each bot is a separate deployable process with its own Telegram token. They share one Postgres database and one Redis instance. They communicate ONLY through (a) BullMQ queues and (b) the shared database. They MUST NOT call each other over HTTP, and they MUST NOT import code from each other's `apps/*` folder. Shared code lives in `packages/shared`.

### 1.3 End-to-end flow

```
Owner --/search--> ScoutBot --(TMDB lookup, adapters search)--> queue: candidates.found
                                                                       |
                                                                       v
                                       CuratorBot (match, parse, verify, rank, register with streamer)
                                                                       |
                                       queue: variants.registered --> queue: movie.ready
                                                                       |
                                                                       v
 Web app --POST /api/play--> ProjectorBot (user prefs -> choose variant -> streamer.start) --> streamUrl
```

### 1.4 What "done" looks like for the owner

1. The owner types `/search Night of the Living Dead` in ScoutBot and taps the right TMDB match.
2. Within a minute the movie exists in the database with poster, plot, cast, genres and runtime filled in. No typing by the owner.
3. The movie has several registered variants (different resolutions and/or audio languages where the sources offer them).
4. The web app calls `POST /api/play` for two different users with different settings and receives two different stream URLs.
5. Nothing is downloaded until a user actually presses play.

---

## 2. Working agreement (how you, the agent, must work)

### 2.1 Mode and artifacts

1. Work in **Planning mode**.
2. Before writing any code, produce two artifacts:
   - **Task List**: every task from §25, each with an owner agent, dependencies and an estimate (S/M/L).
   - **Implementation Plan**: for each package/app, the file list, the public functions, the libraries chosen (with versions), and the risks you see.
3. After producing both artifacts, STOP and wait for the owner's approval. Do not start coding until approved.
4. After approval, work in the order given in §25. Mark tasks done only when their tests pass.
5. At the end, produce a **Walkthrough** artifact: what was built, how to run it, test results, screenshots/log excerpts of the end-to-end demo, and a list of anything not finished.

### 2.2 Parallel agents

1. Build `packages/shared` FIRST and finish it (including its tests) before any bot work starts. It is the foundation every bot depends on.
2. After `packages/shared` is merged, use the Agent Manager to run separate agents in parallel:
   - Agent A: `apps/scout-bot`
   - Agent B: `apps/curator-bot`
   - Agent C: `apps/projector-bot`
   - Agent D: infrastructure, mock streamer, integration tests
3. Agents MUST NOT edit another agent's folder. If you need a change in `packages/shared`, write the request into `docs/CONTRACT_CHANGES.md` and ask the owner or the shared-package agent. Never fork a contract locally.
4. Interfaces are frozen once `packages/shared` is merged, except through §2.2.3.

### 2.3 Code quality rules

1. TypeScript `strict: true`. No `any` (use `unknown` and narrow). No non-null assertions (`!`) outside tests.
2. ESM modules (`"type": "module"`), Node 20 or newer.
3. ESLint (typescript-eslint, recommended + `no-floating-promises`) and Prettier. CI script `pnpm lint` MUST pass with zero warnings.
4. Every external input (env vars, HTTP bodies, queue payloads, Telegram callback data, API responses from TMDB/Internet Archive) MUST be validated with zod at the boundary.
5. Functions SHOULD be small and pure where possible. Side effects live at the edges (adapters, clients, workers).
6. Every non-obvious decision gets a one-line comment explaining WHY, not what.
7. No dead code, no commented-out code, no `console.log` (use the shared pino logger).
8. No secrets in code, tests, fixtures, logs or docs. Use `.env` locally and `.env.example` for the template.

### 2.4 Terminal and filesystem safety

1. Run commands only inside this repository.
2. Never run `rm -rf` on anything outside `node_modules`, `dist`, `.turbo` or other clearly generated folders inside the repo.
3. Never run `curl | sh` style installers.
4. Do not install global packages. Use `pnpm dlx` or devDependencies.
5. Do not open outbound network connections to anything other than: the TMDB API, archive.org, download.blender.org, npm registry, Docker registries. Tests MUST NOT hit the real network (see §21).

### 2.5 Communication rules

1. Ask the owner a question ONLY if it is listed in §26 or is truly blocking. For everything else, make the simplest assumption and log it.
2. When you hit a surprise (library missing a feature, API changed), write it to `docs/ASSUMPTIONS.md` with the date, what you expected, what you found, and what you did instead.
3. Never claim something works unless you ran a test or command that proves it. Paste the evidence into the Walkthrough.

---

## 3. Context and glossary

| Term | Meaning |
|---|---|
| Torrent streamer | The owner's EXISTING service that downloads a torrent sequentially and exposes the video over HTTP with Range support. Its real API is unknown to you (see §11.2). |
| Magnet link | `magnet:?xt=urn:btih:<infohash>&dn=<name>&tr=<tracker>...` |
| Infohash | 40-char hex SHA-1 (v1) identifying a torrent. Used as the unique key for a torrent everywhere in this system. Always store lowercase hex. |
| Candidate | A torrent found by a source adapter, not yet matched, parsed or verified. |
| Variant | A candidate that has been matched to a movie, parsed (resolution, codec, audio and subtitle languages), scored and registered. The unit a user can choose. |
| TMDB | The Movie Database. The system of record for movie identity and metadata. |
| Source adapter | A module that knows how to search ONE legal source and return Candidates. |
| Registered | The streamer knows the torrent's metadata (file list) but has NOT started downloading. |
| Started | The streamer is actively downloading and serving the file. |
| Sequential streaming | Pieces fetched roughly in playback order so playback can begin early. |
| Web seed | An HTTP source embedded in a torrent (Internet Archive torrents include these). Helps sequential streaming when few peers exist. |
| Original language | The movie's `original_language` from TMDB. Used as the fallback audio language. |

### 3.1 Who uses what

| Actor | Uses | Authenticated by |
|---|---|---|
| Owner | ScoutBot, CuratorBot and ProjectorBot Telegram commands (admin) | Telegram user id in `ADMIN_TELEGRAM_IDS` |
| Web app backend | ProjectorBot HTTP API | Static Bearer API key (`PROJECTOR_API_KEY`) |
| Web app viewers | Only the web app. They never talk to the bots or the API directly. | The web app's own login. The web app passes a trusted `userId`. |
| Optional: user via Telegram | ProjectorBot `/prefs` | Linked account (§19.4) |

---

## 4. Legal-only policy (HARD REQUIREMENT)

This system MUST only discover and stream media that is legally distributable: public domain works and works under licenses that allow redistribution (for example Creative Commons).

### 4.1 Rules

1. Implement ONLY these source adapters (details in §13):
   - `InternetArchiveAdapter`
   - `BlenderOpenMoviesAdapter`
   - `ManualAdapter` (owner-supplied magnet or `.torrent`, tagged `license = "user_confirmed"`)
2. MUST NOT implement scrapers or clients for general-purpose torrent indexers or trackers.
3. MUST NOT integrate Jackett, Prowlarr, Torznab or similar aggregators.
4. Every `Candidate` MUST have a non-empty `license` string. CuratorBot MUST drop (and log) any candidate without one.
5. `InternetArchiveAdapter` MUST accept an item only if its license metadata is a public-domain mark/CC0 or a Creative Commons license (see §13.2 for the exact allowlist). Items with no license metadata MUST be skipped, not guessed.
6. `ManualAdapter` exists because the owner already supplies links by hand. The owner is responsible for what they supply. The bot MUST ask for an explicit confirmation ("I confirm this content is legal to distribute") before accepting a manual link, and MUST store who confirmed and when.
7. The adapter interface (§9) MUST remain open for future legal sources, but adding one requires the owner's approval.

### 4.2 Why this exists (so you do not "helpfully" work around it)

The owner wants a streaming service that can run publicly without distributing infringing content. A "just add one more tracker" shortcut would undermine that goal. If a requested title has no legal source, the correct behavior is to tell the owner "no legal sources found" and stop. Never suggest or implement a workaround.

### 4.3 Required user-facing behavior when nothing is found

ScoutBot MUST reply (example):

```
No legal sources found for "Some Title (2019)".
Sources searched: Internet Archive, Blender Open Movies.
You can still send me a magnet/.torrent with /addmanual if you have rights to distribute it.
```

### 4.4 Audit trail

Every candidate row stores `source`, `license`, `license_url` (when available) and `discovered_at`. The `audit_log` table (§8) records manual confirmations. This must be queryable so the owner can prove provenance later.

---

## 5. Technology stack

| Concern | Choice | Notes |
|---|---|---|
| Language | TypeScript 5.x, Node.js 20 LTS or newer | ESM only |
| Package manager | pnpm workspaces | Root `pnpm-workspace.yaml` |
| Telegram | grammY (`grammy`) | One `Bot` instance per app. Use long polling in dev, webhook optional in prod. |
| Queues | BullMQ + `ioredis` | Redis 7 |
| Database | PostgreSQL 16 | |
| ORM / migrations | Drizzle ORM (`drizzle-orm`, `drizzle-kit`) with `pg` driver | SQL in §8 is normative. Drizzle schema must mirror it. |
| HTTP server | Fastify 4 or 5 | Only ProjectorBot (and the mock streamer) run an HTTP server |
| Validation | zod | Boundary validation everywhere |
| Logging | pino (+ `pino-pretty` in dev) | JSON in prod |
| HTTP client | Node's built-in `fetch` (undici) | Wrap in a small helper with timeout, retry, User-Agent |
| Torrent parsing | `parse-torrent` (or `bencode` + `node:crypto` sha1 of the `info` dict) | Mind ESM-only versions. If `parse-torrent` causes trouble, use the manual approach in §13.5. |
| Title similarity | Implement Dice coefficient yourself (about 20 lines) or use `string-similarity` | Prefer the in-repo implementation: no dependency, fully testable. |
| Media probing | `ffprobe` (from the ffmpeg package) invoked via `node:child_process` | Present in the CuratorBot Docker image |
| Scheduling | BullMQ repeatable jobs | Not `node-cron`; keeps schedule state in Redis |
| Testing | vitest, `msw` (HTTP mocks), `testcontainers` OR docker compose for integration | See §21 |
| Lint / format | ESLint + Prettier | |
| Containers | Docker, docker compose v2 | |

Version rule: pin exact versions in `package.json` (no `^`/`~`) and commit `pnpm-lock.yaml`. Choose versions that are at least a few weeks old (avoid brand-new releases). List the chosen versions in the Implementation Plan artifact.

---

## 6. Repository layout

```
reel-bots/
├─ package.json                 # root scripts: build, lint, test, dev, compose:*
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ .eslintrc.cjs / eslint.config.js
├─ .prettierrc
├─ .env.example
├─ docker-compose.yml
├─ README.md
├─ docs/
│  ├─ ASSUMPTIONS.md
│  ├─ OPEN_QUESTIONS.md
│  ├─ CONTRACTS.md              # generated/maintained copy of §9 contracts
│  ├─ CONTRACT_CHANGES.md
│  ├─ RUNBOOK.md                # how to operate, debug, replay jobs
│  └─ STREAMER_MAPPING.md       # how to map the real streamer API (§11.2)
├─ packages/
│  └─ shared/
│     ├─ package.json
│     └─ src/
│        ├─ config/             # zod env parsing per app
│        ├─ db/                 # drizzle schema, client, migrations, repositories
│        ├─ queues/             # queue names, payload schemas, producers, worker helpers
│        ├─ tmdb/               # TMDB client + mappers
│        ├─ streamer/           # StreamerClient interface, HttpStreamerClient, MockStreamer
│        ├─ http/               # fetch helper (timeout, retry, UA)
│        ├─ logging/            # pino factory
│        ├─ telegram/           # common grammY helpers (admin guard, error handler)
│        ├─ types/              # Candidate, Variant, etc. (§9)
│        └─ util/               # infohash, magnet, language map, title normalizer
├─ apps/
│  ├─ scout-bot/
│  │  └─ src/
│  │     ├─ main.ts
│  │     ├─ bot/               # grammY commands + callbacks
│  │     ├─ adapters/          # source adapters (§13)
│  │     ├─ jobs/              # search job, poll job
│  │     └─ services/
│  ├─ curator-bot/
│  │  └─ src/
│  │     ├─ main.ts
│  │     ├─ bot/
│  │     ├─ matching/          # TMDB matching (§14)
│  │     ├─ parsing/           # filename parser, ffprobe verification (§15)
│  │     ├─ ranking/           # scoring (§16)
│  │     └─ workers/
│  └─ projector-bot/
│     └─ src/
│        ├─ main.ts
│        ├─ api/               # Fastify routes (§17)
│        ├─ bot/
│        ├─ selection/         # choose-variant algorithm (§18)
│        └─ lifecycle/         # idle stop, eviction (§19)
├─ tools/
│  └─ mock-streamer/           # Fastify app that fakes the real streamer (§20)
└─ tests/
   ├─ fixtures/                # recorded TMDB / Internet Archive responses
   └─ e2e/                     # full-flow tests
```

Rules:

1. Every app has its own `package.json`, `tsconfig.json`, `Dockerfile` and `src/main.ts`.
2. Apps depend on `@reel/shared` via `workspace:*`.
3. Apps never import from other apps.
4. Test files live next to the code (`*.test.ts`) for unit tests, and in `tests/e2e` for cross-app tests.

---

## 7. Environment variables

All variables are parsed and validated with zod in `packages/shared/src/config`. A missing or invalid variable MUST crash the process at startup with a clear message listing every problem (not just the first). Provide `.env.example` with every variable and a comment.

### 7.1 Shared by all apps

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development`, `test`, `production` |
| `LOG_LEVEL` | no | `info` | pino level |
| `DATABASE_URL` | yes | | Postgres connection string |
| `REDIS_URL` | yes | | Redis connection string |
| `TMDB_READ_TOKEN` | yes | | TMDB v4 "API Read Access Token" (Bearer) |
| `TMDB_LANGUAGE` | no | `en-US` | Language for TMDB text fields |
| `ADMIN_TELEGRAM_IDS` | yes | | Comma-separated numeric Telegram user ids allowed to use admin commands |
| `HTTP_USER_AGENT` | no | `reel-bots/1.0 (contact: owner)` | Sent to external sites. Be a polite client. |

### 7.2 ScoutBot

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `SCOUT_BOT_TOKEN` | yes | | Telegram bot token |
| `SCOUT_POLL_INTERVAL_MINUTES` | no | `60` | How often `listNew` runs |
| `SCOUT_INGEST_ALL_NEW` | no | `false` | If true, ingest every new item from adapters, not only watchlisted movies |
| `SCOUT_SEARCH_TIMEOUT_MS` | no | `15000` | Per-adapter search timeout |
| `ADAPTERS_ENABLED` | no | `internet_archive,blender` | Comma-separated adapter names |
| `IA_MAX_RESULTS` | no | `25` | Max Internet Archive search rows per query |
| `MAX_TORRENT_FILE_BYTES` | no | `5242880` | Reject `.torrent` files larger than this (5 MB) |
| `TORRENT_URL_HOST_ALLOWLIST` | no | `archive.org,download.blender.org` | Hosts ScoutBot may download `.torrent` files from |

### 7.3 CuratorBot

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `CURATOR_BOT_TOKEN` | yes | | Telegram bot token |
| `MATCH_AUTO_THRESHOLD` | no | `0.85` | At or above: auto-accept the TMDB match |
| `MATCH_ASK_THRESHOLD` | no | `0.60` | Between this and auto: ask the owner. Below: reject |
| `VERIFY_TOP_N` | no | `2` | How many top-ranked variants per movie get ffprobe verification |
| `VERIFY_TIMEOUT_SECONDS` | no | `90` | Max time to wait for a verification probe |
| `FFPROBE_PATH` | no | `ffprobe` | Path to the binary |
| `RANKING_CONFIG_PATH` | no | built-in | Optional JSON override for ranking weights (§16.2) |

### 7.4 ProjectorBot

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `PROJECTOR_BOT_TOKEN` | yes | | Telegram bot token |
| `PROJECTOR_API_KEY` | yes | | Bearer key the web app must send |
| `PROJECTOR_HTTP_PORT` | no | `8080` | Fastify port |
| `PROJECTOR_CORS_ORIGINS` | no | empty | Comma-separated allowed origins (empty = none) |
| `STREAM_IDLE_MINUTES` | no | `20` | Stop a stream after this long with no activity |
| `STREAM_REAPER_INTERVAL_SECONDS` | no | `60` | How often the idle reaper runs |
| `DISK_QUOTA_GB` | no | `200` | Soft cap on streamer disk usage before eviction |
| `DISK_EVICTION_TARGET_PERCENT` | no | `80` | Evict until usage is below this percent of the quota |

### 7.5 Streamer (see §11.2)

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `STREAMER_BASE_URL` | yes | | For example `http://streamer:3000` |
| `STREAMER_AUTH_HEADER` | no | empty | Full header value, for example `Bearer abc`. Empty means no auth. |
| `STREAMER_REGISTER_PATH` | no | `/api/torrents` | POST: register a torrent |
| `STREAMER_START_PATH` | no | `/api/torrents/:infohash/start` | POST: start streaming |
| `STREAMER_STOP_PATH` | no | `/api/torrents/:infohash/stop` | POST: stop streaming |
| `STREAMER_STATUS_PATH` | no | `/api/torrents/:infohash` | GET: status |
| `STREAMER_DISK_PATH` | no | `/api/disk` | GET: disk usage |
| `STREAMER_REMOVE_PATH` | no | `/api/torrents/:infohash` | DELETE: remove data |
| `STREAMER_TIMEOUT_MS` | no | `10000` | Request timeout |
| `STREAMER_PUBLIC_BASE_URL` | no | same as base | Base URL the BROWSER should use for stream URLs |

---

## 8. Database schema

SQL below is normative. Express it in Drizzle (`packages/shared/src/db/schema.ts`) and generate migrations with drizzle-kit. All timestamps are `timestamptz`. All text enums use CHECK constraints (not Postgres enums) so they are easy to migrate.

```sql
-- CONTRACT
CREATE TABLE movies (
  tmdb_id              integer PRIMARY KEY,
  imdb_id              text,
  title                text NOT NULL,
  original_title       text,
  year                 integer,
  release_date         date,
  runtime_minutes      integer,
  original_language    text,                       -- ISO 639-1, e.g. 'en'
  spoken_languages     text[] NOT NULL DEFAULT '{}',
  genres               text[] NOT NULL DEFAULT '{}',
  overview             text,
  tagline              text,
  poster_path          text,                       -- TMDB path, e.g. '/abc.jpg'
  backdrop_path        text,
  cast_top             jsonb NOT NULL DEFAULT '[]',-- [{name, character, profile_path}] max 12
  directors            text[] NOT NULL DEFAULT '{}',
  trailer_youtube_key  text,
  status               text NOT NULL DEFAULT 'new'
                         CHECK (status IN ('new','searching','curating','ready','failed')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE watchlist (
  tmdb_id     integer PRIMARY KEY REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  added_by    bigint NOT NULL,                     -- Telegram user id
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE candidates (
  infohash       text PRIMARY KEY CHECK (infohash ~ '^[0-9a-f]{40}$'),
  source         text NOT NULL,                    -- 'internet_archive' | 'blender' | 'manual'
  source_id      text NOT NULL,                    -- adapter-specific id (IA identifier, etc.)
  raw_name       text NOT NULL,
  magnet         text,
  torrent_url    text,
  size_bytes     bigint NOT NULL DEFAULT 0,
  seeders        integer NOT NULL DEFAULT 0,
  license        text NOT NULL CHECK (length(license) > 0),
  license_url    text,
  tmdb_id        integer REFERENCES movies(tmdb_id) ON DELETE SET NULL,
  year_hint      integer,
  state          text NOT NULL DEFAULT 'new'
                   CHECK (state IN ('new','matched','pending_match','rejected','variant_created','failed')),
  reject_reason  text,
  discovered_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);
CREATE INDEX candidates_tmdb_idx ON candidates (tmdb_id);
CREATE INDEX candidates_state_idx ON candidates (state);

CREATE TABLE variants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id          integer NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  infohash         text NOT NULL REFERENCES candidates(infohash) ON DELETE CASCADE,
  file_index       integer NOT NULL,               -- index of the video file inside the torrent
  file_path        text NOT NULL,
  container        text,                           -- 'mp4','mkv','webm','avi','mov'
  resolution       integer NOT NULL CHECK (resolution IN (240,360,480,576,720,1080,1440,2160)),
  video_codec      text,                           -- 'h264','hevc','av1','vp9','mpeg4','unknown'
  audio_tracks     jsonb NOT NULL DEFAULT '[]',    -- [{lang:'en', codec:'aac', channels:2, default:true}]
  audio_langs      text[] NOT NULL DEFAULT '{}',   -- denormalized from audio_tracks, ISO 639-1
  sub_langs        text[] NOT NULL DEFAULT '{}',
  duration_seconds integer,
  size_bytes       bigint NOT NULL DEFAULT 0,
  seeders          integer NOT NULL DEFAULT 0,
  has_web_seed     boolean NOT NULL DEFAULT false,
  verified         boolean NOT NULL DEFAULT false, -- true only after ffprobe confirmed the data
  score            numeric(6,2) NOT NULL DEFAULT 0,
  state            text NOT NULL DEFAULT 'registered'
                     CHECK (state IN ('registered','started','failed','retired')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (infohash, file_index)
);
CREATE INDEX variants_movie_idx ON variants (tmdb_id, state);
CREATE INDEX variants_audio_idx ON variants USING gin (audio_langs);

CREATE TABLE pending_matches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  infohash       text NOT NULL REFERENCES candidates(infohash) ON DELETE CASCADE,
  options        jsonb NOT NULL,                   -- [{tmdb_id,title,year,confidence}] max 5
  asked_chat_id  bigint,
  asked_message_id integer,
  resolved_at    timestamptz,
  resolution     text CHECK (resolution IN ('approved','rejected','rematched')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE source_state (
  source        text PRIMARY KEY,
  last_polled_at timestamptz,
  cursor        text                               -- adapter-specific paging cursor, optional
);

CREATE TABLE user_prefs (
  user_id         text PRIMARY KEY,                -- the web app's user id (opaque string)
  audio_lang      text NOT NULL DEFAULT 'en',      -- ISO 639-1
  max_resolution  integer NOT NULL DEFAULT 1080,
  subtitle_lang   text,                            -- NULL = no subtitles preferred
  prefer_original_audio boolean NOT NULL DEFAULT false,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE watch_progress (
  user_id           text NOT NULL,
  tmdb_id           integer NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  variant_id        uuid REFERENCES variants(id) ON DELETE SET NULL,
  position_seconds  integer NOT NULL DEFAULT 0,
  duration_seconds  integer,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tmdb_id)
);

CREATE TABLE active_streams (
  infohash        text PRIMARY KEY,
  variant_id      uuid NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  started_at      timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  viewer_count    integer NOT NULL DEFAULT 0
);

CREATE TABLE user_links (
  telegram_id  bigint PRIMARY KEY,
  user_id      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE link_codes (
  code        text PRIMARY KEY,                    -- 8 chars, uppercase alphanumeric, no 0/O/1/I
  user_id     text NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz
);

CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  actor       text NOT NULL,                       -- 'telegram:<id>' | 'system' | 'api'
  action      text NOT NULL,                       -- e.g. 'manual_add_confirmed', 'match_approved'
  subject     text,                                -- e.g. infohash or tmdb id
  details     jsonb NOT NULL DEFAULT '{}'
);
```

Schema rules:

1. `updated_at` columns MUST be maintained by the repository layer (or a trigger) on every update.
2. All writes that can race (candidate insert, variant insert) MUST use `INSERT ... ON CONFLICT` so repeated jobs are idempotent.
3. Repositories live in `packages/shared/src/db/repositories`. Apps do NOT write raw SQL; they call repository functions. Each repository function has a unit/integration test.
4. Provide `pnpm db:migrate` and `pnpm db:reset` (the latter refuses to run when `NODE_ENV=production`).

---

## 9. Shared TypeScript contracts

Location: `packages/shared/src/types`. Every type below has a zod schema next to it, and the TS type is derived with `z.infer`. Export both.

```ts
// CONTRACT
export type Infohash = string; // 40 lowercase hex chars

export type Candidate = {
  source: 'internet_archive' | 'blender' | 'manual';
  sourceId: string;            // stable id inside the source (IA identifier, blender slug, manual:<infohash>)
  infohash: Infohash;
  magnet?: string;             // at least one of magnet / torrentUrl / torrentFileBase64 must exist
  torrentUrl?: string;
  torrentFileBase64?: string;  // used by ManualAdapter for uploaded .torrent files
  rawName: string;             // original title/filename as published by the source
  sizeBytes: number;
  seeders: number;             // 0 if unknown
  hasWebSeed: boolean;
  license: string;             // e.g. 'public-domain', 'cc-by-4.0', 'user_confirmed'
  licenseUrl?: string;
  tmdbId?: number;             // set when the owner searched by TMDB id (hint, not proof)
  year?: number;               // year hint parsed from the source
};

export type AudioTrack = {
  lang: string;                // ISO 639-1 ('en'), or 'und' if unknown
  codec?: string;              // 'aac' | 'ac3' | 'eac3' | 'opus' | 'dts' | 'truehd' | 'mp3' | ...
  channels?: number;
  isDefault?: boolean;
  title?: string;
};

export type Variant = {
  id: string;                  // uuid
  tmdbId: number;
  infohash: Infohash;
  fileIndex: number;
  filePath: string;
  container?: 'mp4' | 'mkv' | 'webm' | 'avi' | 'mov' | 'other';
  resolution: 240 | 360 | 480 | 576 | 720 | 1080 | 1440 | 2160;
  videoCodec?: 'h264' | 'hevc' | 'av1' | 'vp9' | 'mpeg4' | 'unknown';
  audioTracks: AudioTrack[];
  audioLangs: string[];
  subLangs: string[];
  durationSeconds?: number;
  sizeBytes: number;
  seeders: number;
  hasWebSeed: boolean;
  verified: boolean;           // ffprobe-confirmed
  score: number;
  source: Candidate['source'];
  state: 'registered' | 'started' | 'failed' | 'retired';
};

export interface SourceSearchQuery {
  title: string;
  year?: number;
  imdbId?: string;
  tmdbId?: number;
}

export interface SourceAdapter {
  readonly name: Candidate['source'];
  search(q: SourceSearchQuery, signal: AbortSignal): Promise<Candidate[]>;
  listNew(since: Date, signal: AbortSignal): Promise<Candidate[]>;
}

export type TorrentFileInfo = { index: number; path: string; sizeBytes: number };

export type RegisterResult = {
  infohash: Infohash;
  files: TorrentFileInfo[];    // full file list from torrent metadata
  hasWebSeed: boolean;
};

export type StreamState = 'registered' | 'starting' | 'streaming' | 'stopped' | 'error';

export type StreamStatus = {
  infohash: Infohash;
  state: StreamState;
  progress: number;            // 0..1 of the selected file
  peers: number;
  downloadedBytes: number;
  streamUrl?: string;
};

export interface StreamerClient {
  register(input: { magnet?: string; torrentFile?: Buffer }): Promise<RegisterResult>;
  start(infohash: Infohash, fileIndex: number): Promise<{ streamUrl: string }>;
  stop(infohash: Infohash): Promise<void>;
  status(infohash: Infohash): Promise<StreamStatus>;
  remove(infohash: Infohash): Promise<void>;           // delete downloaded data
  diskUsage(): Promise<{ usedBytes: number; totalBytes: number }>;
}
```

Notes:

1. `Infohash` is always lowercase hex. If a source gives base32 (some magnets do), convert to hex in the shared `infohash` util and test it.
2. `resolution` is the HEIGHT in pixels, snapped to the nearest standard value (for example 1072 → 1080, 800 → 720 only if 800 is closer to 720; rule: choose the nearest allowed value, ties go lower).
3. `audioLangs` MUST always equal the distinct `lang` values of `audioTracks` excluding `'und'`. If all tracks are `und`, `audioLangs` is empty and the variant is treated as "unknown audio" by selection (§18).
4. `Candidate.license` is validated non-empty by zod. The zod schema rejects empty strings and whitespace-only strings.
5. Provide `docs/CONTRACTS.md` as a human-readable copy of this section plus the event payloads of §10. Keep it in sync.

### 9.1 Language handling (shared util)

Create `packages/shared/src/util/language.ts`:

1. `toIso1(input: string): string | null` accepts ISO 639-1 (`en`), ISO 639-2/T and /B (`eng`, `fre`, `fra`, `ger`, `deu`, `tam`, `hin`), and English names (`English`, `Tamil`, `Hindi`, `French`, `Japanese`) case-insensitively.
2. Returns `null` for unknown input. Callers map `null` to `'und'`.
3. Minimum coverage: en, ta, hi, te, ml, kn, bn, mr, gu, pa, ur, fr, de, es, it, pt, ru, ja, ko, zh, ar, tr, nl, sv, pl, th, id, vi, he, fa.
4. `displayName(iso1: string): string` returns the English name for UI messages.
5. Table-driven tests: at least 40 cases including bad input.

### 9.2 Infohash and magnet utilities

`packages/shared/src/util/infohash.ts`:

1. `infohashFromMagnet(magnet: string): Infohash | null`: parse `xt=urn:btih:`; accept 40-char hex or 32-char base32; return lowercase hex.
2. `infohashFromTorrent(buf: Buffer): Infohash`: sha1 of the bencoded `info` dictionary. Use `parse-torrent` or implement with `bencode`. MUST throw a typed `InvalidTorrentError` for malformed input.
3. `buildMagnet(input: { infohash: Infohash; name?: string; trackers?: string[] }): string`: URL-encode every parameter; include at most 8 trackers.
4. Tests include one real tiny `.torrent` fixture created in the test itself (build an `info` dict in code and hash it) so no network or binary file is needed.

---

## 10. Queues and events

All inter-bot messaging uses BullMQ. Queue names and payload schemas live in `packages/shared/src/queues`. Producers and workers MUST use the shared helpers so payloads are always validated.

### 10.1 Queue table

| Queue | Producer | Consumer | Payload schema | Idempotency key (`jobId`) |
|---|---|---|---|---|
| `candidates.found` | ScoutBot | CuratorBot | `{ traceId, requestedBy?: number, tmdbId?: number, candidate: Candidate }` | `cand:<infohash>` |
| `variants.registered` | CuratorBot | CuratorBot (movie aggregator worker) | `{ traceId, tmdbId, variantId, infohash }` | `var:<variantId>` |
| `movie.ready` | CuratorBot | ProjectorBot, ScoutBot (for chat notification) | `{ traceId, tmdbId, requestedBy?: number, variantCount: number }` | `ready:<tmdbId>:<variantCount>` |
| `scout.poll` | BullMQ repeatable | ScoutBot | `{ source: string }` | repeatable key per source |
| `scout.search` | ScoutBot bot handler | ScoutBot worker | `{ traceId, tmdbId, requestedBy: number, chatId: number }` | `search:<tmdbId>` |

### 10.2 Job options (defaults)

| Setting | Value |
|---|---|
| `attempts` | 5 |
| `backoff` | exponential, 2 seconds base |
| `removeOnComplete` | keep last 1000 |
| `removeOnFail` | keep last 5000 (so failures can be inspected and replayed) |

### 10.3 Rules

1. `traceId` is a UUID created when the owner issues a command or when a poll starts. It is copied into every downstream job and every log line so one movie request can be followed across all three bots.
2. Workers MUST be idempotent. Receiving the same job twice must not create duplicate rows or duplicate streamer registrations.
3. A job that fails permanently (attempts exhausted) MUST update the related DB row (`candidates.state = 'failed'` with a reason) and notify the owner on Telegram with the `traceId`.
4. Provide `pnpm queue:replay <queue> <jobId>` as a small script that re-enqueues a failed job (documented in `docs/RUNBOOK.md`).
5. Do not put large binary data in jobs. `torrentFileBase64` is allowed only when the file is under `MAX_TORRENT_FILE_BYTES`; otherwise store the file in the database table `candidates` (extend with a `torrent_blob bytea` column if you need it) and pass only the infohash.

---

## 11. Shared services

### 11.1 TMDB client (`packages/shared/src/tmdb`)

Base URL: `https://api.themoviedb.org/3`. Auth: header `Authorization: Bearer ${TMDB_READ_TOKEN}`. Image base: `https://image.tmdb.org/t/p/` (sizes `w342` for posters, `w1280` for backdrops; the DB stores only the path).

| Function | TMDB endpoint | Returns |
|---|---|---|
| `searchMovies(query, year?)` | `GET /search/movie?query=...&year=...&include_adult=false` | up to 10 `{tmdbId,title,originalTitle,year,overview,posterPath,popularity}` |
| `getMovie(tmdbId)` | `GET /movie/{id}?append_to_response=credits,videos,external_ids` | full `MovieDetails` (mapped, see below) |
| `findByImdb(imdbId)` | `GET /find/{imdb_id}?external_source=imdb_id` | tmdb id or null |

Mapping rules for `getMovie` → `movies` row:

1. `year` from `release_date` (first 4 chars), `null` if empty.
2. `genres` = names array. `spoken_languages` = ISO 639-1 codes from `spoken_languages[].iso_639_1`.
3. `cast_top` = first 12 of `credits.cast` as `{name, character, profile_path}`.
4. `directors` = names where `credits.crew[].job === 'Director'`.
5. `trailer_youtube_key` = the first video where `site === 'YouTube'` and `type === 'Trailer'` (prefer `official: true`), else `null`.
6. `imdb_id` from `external_ids.imdb_id`.

Behavior:

1. Timeout 10 s, retry 3 times on 429/5xx with exponential backoff, honoring `Retry-After`.
2. In-memory LRU cache (size 500, TTL 6 h) for `getMovie` and `searchMovies`.
3. Every response is validated with zod. Unknown extra fields are ignored.
4. Never log the token. Redact the `Authorization` header in any debug output.

### 11.2 StreamerClient (`packages/shared/src/streamer`)

The owner's real streamer API is NOT known. Therefore:

1. Implement `HttpStreamerClient` that talks to a REST API whose base URL, auth header and routes come entirely from env vars (§7.5). Routes may contain the placeholder `:infohash`.
2. Implement a **response mapping layer** (`streamerMapping.ts`): small functions that convert the streamer's raw JSON into the `RegisterResult`, `StreamStatus` and disk usage shapes. Isolate ALL assumptions about the real API in this one file, so the owner can edit one file to fit their streamer. Document it in `docs/STREAMER_MAPPING.md` with a table: "our field → expected raw field → how to change".
3. Default mapping (used by the mock streamer, §20.2):
   - `POST {REGISTER}` body `{ "magnet": "..." }` or multipart with `torrent` file → `{ "infohash": "...", "files": [{ "index": 0, "path": "...", "length": 123 }], "webSeed": true }`
   - `POST {START}` body `{ "fileIndex": 0 }` → `{ "streamUrl": "/stream/<infohash>/0" }` (relative URLs are made absolute with `STREAMER_PUBLIC_BASE_URL`)
   - `POST {STOP}` → `204`
   - `GET {STATUS}` → `{ "state": "streaming", "progress": 0.12, "peers": 4, "downloaded": 123456 }`
   - `GET {DISK}` → `{ "used": 123, "total": 456 }`
   - `DELETE {REMOVE}` → `204`
4. `streamUrl` returned to the web app MUST support HTTP Range requests (the streamer's job). The client must NOT proxy video bytes.
5. Error handling: map HTTP 404 on `status` to `state: 'registered'` only if the torrent was registered earlier according to the DB, otherwise throw `StreamerNotFoundError`. Map network failures to `StreamerUnavailableError` (retryable). Map 4xx to `StreamerRejectedError` (not retryable).
6. Provide `MockStreamer` (in-memory implementation of `StreamerClient`) for unit tests. It is distinct from the mock streamer HTTP app in §20.2, which exercises `HttpStreamerClient` end to end.
7. `TODO(owner)`: confirm the real routes. Until then everything runs against the mock. Record this in `docs/OPEN_QUESTIONS.md`.

### 11.3 HTTP helper (`packages/shared/src/http`)

`httpJson<T>(url, { schema, timeoutMs, retries, headers, signal })`:

1. Always sends `User-Agent: ${HTTP_USER_AGENT}`.
2. Aborts on timeout and on the caller's `signal`.
3. Retries on network errors, 429 and 5xx (not on other 4xx) with jittered exponential backoff.
4. Validates JSON with the given zod schema and throws `ExternalApiError` (with host, status, truncated body) on mismatch.
5. Refuses non-`https` URLs unless the host is `localhost` or a compose service name listed in an env allowlist (`HTTP_INSECURE_HOSTS`, default empty) to keep tests easy.

### 11.4 Logging

1. `createLogger(appName)` returns a pino instance with base fields `{ app, env }`.
2. Child loggers carry `traceId`, `tmdbId`, `infohash` when known.
3. Redact: `req.headers.authorization`, any key named `token`, `apiKey`, `TMDB_READ_TOKEN`, `*_BOT_TOKEN`.
4. Log levels: `info` for state transitions (candidate found, matched, variant registered, stream started/stopped), `warn` for retries and degraded behavior, `error` for failures. Do not log full magnet links at `info` (they are long); log the infohash.

### 11.5 Telegram helpers (`packages/shared/src/telegram`)

1. `adminOnly()` grammY middleware: if `ctx.from.id` is not in `ADMIN_TELEGRAM_IDS`, reply "Not authorized." and stop. Log the attempt with the Telegram id at `warn`.
2. `installErrorHandler(bot, logger)`: catches handler errors, logs them with `traceId` when available, and replies with a short apology plus an error id. Never leak stack traces into chat.
3. `formatMovieLine(movie)`: returns `Title (Year)` safely escaped for Telegram HTML mode. Use HTML parse mode everywhere (simpler escaping than MarkdownV2) and an `escapeHtml` helper with tests.
4. `chunkMessage(text)`: split to the 4096-character Telegram limit on line boundaries.
5. Callback data MUST stay under 64 bytes. Use short prefixes plus ids (for example `pick:10331`, `pm:ok:<uuid8>`). Provide a typed encode/decode helper with zod validation. Reject unknown prefixes silently.

---

## 12. ScoutBot (discovery)

### 12.1 Responsibilities

1. Accept `/search <name or tmdb id>` from admins.
2. Resolve the movie identity via TMDB (§11.1).
3. Query all enabled source adapters in parallel.
4. De-duplicate candidates and publish them to `candidates.found`.
5. Periodically poll adapters for new items (`listNew`).
6. Report progress and results back to the chat.

### 12.2 Commands

| Command | Who | Behavior |
|---|---|---|
| `/start` | admin | Short help text listing commands |
| `/search <name or tmdb id>` | admin | See §12.3 |
| `/watch <tmdb id>` | admin | Adds a movie to the watchlist so future `listNew` hits for it are ingested |
| `/unwatch <tmdb id>` | admin | Removes from the watchlist |
| `/watchlist` | admin | Lists watchlisted movies (paginated 10 per page with inline Next/Prev) |
| `/sources` | admin | Lists enabled adapters, last poll time, and last error |
| `/status [tmdb id]` | admin | Without argument: queue depths (waiting/active/failed) for each queue. With id: movie status, candidate count by state, variant count |
| `/addmanual` | admin | Starts the manual flow (§13.5) |
| `/pollnow` | admin | Enqueues an immediate `scout.poll` for every adapter |

All commands except `/start` use `adminOnly()`. Unknown commands get a one-line help reply.

### 12.3 `/search` flow in detail

1. Parse the argument. If it matches `^\d{1,9}$`, treat it as a TMDB id. Otherwise treat it as a title query. An optional trailing year in parentheses, such as `Night of the Living Dead (1968)`, is extracted and passed to TMDB as `year`.
2. **TMDB id path**: call `getMovie(id)`. If TMDB returns 404, reply "TMDB id not found." and stop. Otherwise upsert into `movies` (status `searching`) and continue at step 5.
3. **Name path**: call `searchMovies(query, year)`. If zero results, reply "No TMDB match for that name. Try the exact title or a TMDB id." and stop.
4. Show up to 5 matches as an inline keyboard. Each button label: `Title (Year)`. Callback data: `pick:<tmdbId>`. Also include a "Cancel" button (`pick:cancel`). The message text lists each match with a one-line overview (max 120 characters) and the poster is NOT sent (keep it light). When the owner taps a button:
   - Edit the message to "Searching for <Title (Year)>..." and remove the keyboard (prevents double taps).
   - Call `getMovie`, upsert the movie (status `searching`), continue at step 5.
5. Enqueue `scout.search` with `{ traceId, tmdbId, requestedBy, chatId }` (idempotent `jobId = search:<tmdbId>`; if the job already exists and is active, reply "Already searching, hang tight.").
6. The `scout.search` worker:
   1. Loads the movie from the database.
   2. Builds the `SourceSearchQuery` `{ title, year, imdbId, tmdbId }`.
   3. Runs all enabled adapters in parallel with `Promise.allSettled`, each with its own `AbortController` using `SCOUT_SEARCH_TIMEOUT_MS`.
   4. Collects results. For each rejected adapter, record the error in `source_state` and keep going (one bad source must not block the others).
   5. De-duplicates by infohash (§12.4).
   6. Inserts each new candidate into `candidates` (state `new`, `tmdb_id` set because the owner searched by TMDB id) using `ON CONFLICT DO NOTHING`.
   7. For each NEW candidate row, enqueues `candidates.found` with `jobId = cand:<infohash>`.
   8. Sends the owner a summary: `Searched: Internet Archive ✓, Blender ✓. Found N new candidates (M duplicates skipped).` If N is zero and no candidates already exist for this movie, send the "no legal sources" message from §4.3 and set `movies.status = 'failed'`.
7. When `movie.ready` arrives for this `tmdbId` and `requestedBy` is set, ScoutBot (consumer of that queue) sends: `✅ <Title (Year)> is ready with K variants.` with a short list of variants (resolution, audio languages).

### 12.4 De-duplication rules

1. Primary key is `infohash`.
2. Within one search, if two candidates share an infohash, keep the one with more information (magnet and torrent URL both present, higher seeders).
3. Across searches, the database unique constraints (`infohash`, and `(source, source_id)`) are authoritative.
4. Two different infohashes for the same content (re-uploads) are NOT merged. They become separate variants, ranked later.

### 12.5 Polling (`scout.poll`)

1. At startup, register one BullMQ repeatable job per enabled adapter, every `SCOUT_POLL_INTERVAL_MINUTES`.
2. The poll worker reads `source_state.last_polled_at` (default: 7 days ago on first run), calls `adapter.listNew(since)`, and updates `last_polled_at` only after success.
3. For each candidate returned:
   - If `SCOUT_INGEST_ALL_NEW=false`, keep it only if its title+year matches a watchlisted movie. Matching reuses the CuratorBot matching logic, which lives in `packages/shared` so both apps can use it (put `matchTitleToTmdb` in shared, see §14.2).
   - Otherwise insert and enqueue as in §12.3 step 6.6–6.7, with `tmdbId` unset.
4. A poll failure increments an error counter in `source_state` (add column `consecutive_failures integer default 0` if needed) and notifies the owner after 3 consecutive failures, then at most once per 24 hours per source.

### 12.6 Resilience

1. If Telegram sending fails (rate limit or network), retry with grammY's `auto-retry` plugin. Failures to notify never fail the search job.
2. If Redis is down at startup, the process exits with a clear error (let the orchestrator restart it).
3. Handle SIGTERM: stop polling Telegram, close workers gracefully (wait for active jobs up to 30 s), close DB and Redis.

---

## 13. Source adapters

All adapters live in `apps/scout-bot/src/adapters`. Each implements `SourceAdapter` (§9) and has: a zod schema for the raw responses it consumes, a mapper to `Candidate`, and tests using recorded fixtures (no live network in tests).

### 13.1 Common adapter rules

1. Be polite: send the shared `User-Agent`, at most 2 concurrent requests per host, and a minimum 250 ms gap between requests to the same host.
2. Honor the `AbortSignal` passed in.
3. Never throw for "no results". Return `[]`.
4. Throw `AdapterError` (with `adapter` and `cause`) for real failures.
5. Normalize `seeders` to `0` if the source has no concept of seeders.
6. Always lowercase infohashes.
7. Only emit candidates whose `license` is non-empty and allowed (§4.1).

### 13.2 `InternetArchiveAdapter`

Data source: archive.org public APIs.

1. **Search**: `GET https://archive.org/advancedsearch.php` with parameters:
   - `q`: `title:("<title>") AND mediatype:(movies)` (escape quotes). If a year is known, add `AND year:<year>`.
   - `fl[]`: `identifier`, `title`, `year`, `licenseurl`, `downloads`, `item_size`
   - `rows`: `IA_MAX_RESULTS`
   - `output`: `json`
   - `sort[]`: `downloads desc`
2. For each hit, **fetch item metadata**: `GET https://archive.org/metadata/<identifier>`. From it read:
   - `metadata.licenseurl` (string, sometimes missing)
   - `files[]`: each with `name`, `format`, `size`, `source` (`original` or `derivative`)
   - the torrent file: the file named `<identifier>_archive.torrent` (format `Archive BitTorrent`)
3. **License allowlist** (match on the normalized `licenseurl`, ignoring `http` vs `https` and trailing slash):
   - `creativecommons.org/publicdomain/mark/1.0` → license `public-domain`
   - `creativecommons.org/publicdomain/zero/1.0` → license `cc0`
   - `creativecommons.org/licenses/by/<version>` → `cc-by-<version>`
   - `creativecommons.org/licenses/by-sa/<version>` → `cc-by-sa-<version>`
   - Any `by-nd` or `by-nc` variants are allowed ONLY if they appear in the owner's config `IA_ALLOW_RESTRICTED_CC=true` (default false), because the owner's service may be commercial. Document this.
   - Anything else, or missing `licenseurl` → SKIP. Log at `debug` with the identifier and reason.
4. **Torrent URL**: `https://archive.org/download/<identifier>/<identifier>_archive.torrent`. Host `archive.org` is in the allowlist. Download the file (limit `MAX_TORRENT_FILE_BYTES`), compute the infohash locally with `infohashFromTorrent`. Do NOT trust any infohash string from the API.
5. Build the magnet with `buildMagnet` (name = title).
6. `sizeBytes` = `item_size` or the sum of the largest video file; `seeders` = `0` (unknown); `hasWebSeed` = `true` (IA torrents include web seeds; confirm from the parsed `url-list` field when present, otherwise default to true for this adapter).
7. **Year hint**: from `year` field, else parse `(YYYY)` from the title.
8. **`listNew(since)`**: same search with `q = mediatype:(movies) AND collection:(feature_films) AND addeddate:[<since ISO> TO *]`, sorted by `addeddate desc`, up to `IA_MAX_RESULTS` rows, same license filtering.
9. Skip items that have no video file among their `files[]` (extensions: mp4, mkv, webm, avi, mov, m4v, ogv).
10. Cache item metadata in memory for 1 hour to avoid repeat calls inside one search.

Note on Internet Archive items: one item can contain several video files (for example a 480p MP4 and a 720p version). The torrent covers the whole item. CuratorBot later selects files and creates one variant per useful video file (§16.3).

### 13.3 `BlenderOpenMoviesAdapter`

1. Data source: a static, committed JSON file `apps/scout-bot/src/adapters/blender/catalog.json`. It lists Blender Foundation open movies (Creative Commons licensed): title, year, license, license URL, and the official `.torrent` URL(s) published by the Blender Foundation.
2. You MUST NOT invent URLs or infohashes. Populate the catalog by fetching the official Blender pages (blender.org project pages and download.blender.org) and verifying each `.torrent` URL actually responds with a valid torrent. If you cannot verify an entry, set `"verified": false` and the adapter MUST skip it. List unverified entries in `docs/OPEN_QUESTIONS.md`.
3. `search(q)`: normalize the query title and match against the catalog titles (exact match after normalization, or Dice similarity ≥ 0.9). Return one candidate per verified torrent URL (a movie may have several encodes).
4. `listNew(since)`: return entries added to the catalog after `since` (each catalog entry has `addedAt`). In practice this returns `[]` almost always. That is fine.
5. License values come from the catalog entry (for example `cc-by-3.0`).
6. Download and hash the torrent exactly like §13.2 step 4. Host `download.blender.org` is in the allowlist.

### 13.4 Adapter registry

`apps/scout-bot/src/adapters/index.ts` exports `buildAdapters(enabled: string[], deps): SourceAdapter[]`. Unknown names in `ADAPTERS_ENABLED` crash startup with a clear error. `manual` is never listed in `ADAPTERS_ENABLED` because it is user-initiated, not searchable.

### 13.5 `ManualAdapter` and the `/addmanual` flow

1. Owner sends `/addmanual`. Bot asks: "Send a magnet link or a .torrent file, and optionally the movie name or TMDB id in the caption/text."
2. Owner sends either:
   - a message containing a `magnet:` link (extract with a strict regex), or
   - a document whose file name ends in `.torrent` (size must be ≤ `MAX_TORRENT_FILE_BYTES`; download it via the Telegram file API).
3. Bot computes the infohash (§9.2). If invalid, reply with the exact reason and stop.
4. Bot asks for confirmation with two buttons:
   `I confirm this content is legal to distribute` / `Cancel`.
   The text MUST explain that the owner is responsible for the legality of what they add.
5. On confirm:
   - Write an `audit_log` row `{ actor: 'telegram:<id>', action: 'manual_add_confirmed', subject: infohash, details: { name } }`.
   - Insert a candidate with `source='manual'`, `source_id='manual:<infohash>'`, `license='user_confirmed'`, `license_url=NULL`, `tmdb_id` if the owner provided one.
   - Enqueue `candidates.found`.
   - Reply "Added. CuratorBot will match and register it."
6. If the owner did not provide a title or TMDB id, CuratorBot attempts to match from the torrent name and may ask the owner (§14.4).
7. Duplicate infohash: reply "Already known (state: X)." and do nothing else.

---

## 14. CuratorBot, part 1: matching candidates to TMDB

### 14.1 Responsibilities (overview)

1. Consume `candidates.found`.
2. Make sure every candidate is tied to exactly one TMDB movie (§14).
3. Fill in the movie details automatically from TMDB (§14.5).
4. Parse and verify technical details: resolution, codec, audio, subtitles (§15).
5. Score, create variants, and register them with the streamer (§16).
6. Emit `variants.registered` and `movie.ready`.
7. Offer admin commands for manual intervention.

### 14.2 Matching function (shared)

Put `matchTitleToTmdb(raw: string, hintYear?: number): Promise<MatchResult>` in `packages/shared/src/tmdb/match.ts` so ScoutBot's polling can reuse it.

```ts
// CONTRACT
export type MatchOption = { tmdbId: number; title: string; year: number | null; confidence: number };
export type MatchResult = {
  query: string;                 // cleaned title actually searched
  year?: number;                 // year used
  options: MatchOption[];        // sorted by confidence desc, max 5
  decision: 'auto' | 'ask' | 'reject';
};
```

Algorithm:

1. **Clean the raw name** (`cleanReleaseName`):
   1. Replace `.` and `_` with spaces (but keep dots inside known abbreviations like `S.W.A.T` only if you can detect them; otherwise do not special-case).
   2. Cut the string at the first of: a 4-digit year in `1900–2099` surrounded by non-alphanumerics (that year becomes `year`), or the first release-junk token (resolution, codec, source, language, `dual audio`, `bluray`, `webrip`, `hdrip`, `remastered`, `extended`, `uncut`, `proper`, `repack`).
   3. Strip bracketed groups `[...]` and `(...)` except a parenthesized year.
   4. Collapse whitespace, trim.
2. If a `hintYear` is given, it wins over a parsed year.
3. Call `searchMovies(cleanTitle, year)`. If zero results and a year was used, retry once WITHOUT the year (release dates differ by region).
4. **Score each of the top 8 results**:
   - `titleSim = max(dice(norm(clean), norm(result.title)), dice(norm(clean), norm(result.originalTitle)))`
   - `yearScore`: if both years known: `1.0` if equal, `0.7` if differ by 1, `0.0` otherwise. If the candidate year is unknown: `0.5`.
   - `confidence = 0.7 * titleSim + 0.3 * yearScore`
   - Tie-break by TMDB `popularity`.
5. `norm(s)`: lowercase, Unicode NFKD with diacritics removed, `&` → `and`, remove all non-alphanumerics except spaces, collapse spaces, drop a leading `the `.
6. `dice(a, b)`: Dice coefficient over character bigrams (empty strings → 0).
7. **Decision** using env thresholds:
   - top confidence ≥ `MATCH_AUTO_THRESHOLD` AND (second-best confidence ≤ top − 0.10 OR only one option) → `auto`
   - top confidence ≥ `MATCH_ASK_THRESHOLD` → `ask`
   - else → `reject`
8. Return the top 5 options.

Tests: at least 25 table-driven cases covering year parsing, release junk, punctuation, diacritics, sequels (for example "Alien" vs "Aliens"), remakes with the same title, and non-English titles.

### 14.3 Worker flow for `candidates.found`

1. Load the candidate row. If `state` is not `new`, ack and stop (idempotency).
2. **License gate**: if `license` is empty → set `state='rejected'`, `reject_reason='missing_license'`, log, stop.
3. If the job payload has `tmdbId` (the owner searched by id) → set `candidates.tmdb_id`, state `matched`, go to §15.
4. Else if `candidates.tmdb_id` is already set (manual with id) → same as above.
5. Else run `matchTitleToTmdb(candidate.rawName, candidate.year_hint)`:
   - `auto` → set `tmdb_id`, upsert movie details (§14.5), state `matched`, go to §15.
   - `ask` → create a `pending_matches` row and send the owner the question (§14.4); set candidate state `pending_match`; stop (the callback handler resumes the flow).
   - `reject` → state `rejected`, `reject_reason='no_tmdb_match'`; notify the owner once with the raw name and infohash.

### 14.4 Asking the owner to confirm a match

Message (HTML):

```
Which movie is this?
<code>Night.Of.The.Living.Dead.1968.1080p.BluRay.x264</code>

1. Night of the Living Dead (1968) · 94%
2. Night of the Living Dead (1990) · 71%
3. Night of the Living Dead: Reanimated (2009) · 63%
```

Inline keyboard: one button per option (`pm:ok:<idShort>:<optionIndex>`), plus `None of these` (`pm:no:<idShort>`) and `Search by TMDB id` (`pm:id:<idShort>`, which makes the bot wait for the next message from that admin containing a number).

Handler rules:

1. `idShort` is the first 8 characters of the `pending_matches.id` uuid. Look it up with a `LIKE '<idShort>%'` query restricted to unresolved rows.
2. On approve: set `candidates.tmdb_id`, upsert movie, `pending_matches.resolution='approved'`, `audit_log` entry, state `matched`, then continue the worker flow from §15 by enqueueing a `candidates.found` job with `jobId = cand:<infohash>:resume` (the worker must treat state `matched` with a `resume` marker as "continue at §15").
3. On "none": candidate `rejected` with `reject_reason='owner_rejected_match'`.
4. Edit the original message to show the outcome and remove the keyboard (prevents double taps). Ignore taps on already-resolved rows with a toast "Already handled."
5. Admin commands: `/pending` lists unresolved questions (max 10); `/rematch <infohash8> <tmdbId>` forces a new match for an existing candidate and re-runs the flow.

### 14.5 Filling in the movie details automatically

1. After a match is accepted, call `getMovie(tmdbId)` (cached) and upsert the `movies` row (§8, §11.1 mapping).
2. If the row already exists and was updated in the last 7 days, skip the refresh.
3. If TMDB returns 404 for the id (id removed), set candidate `rejected` with `reject_reason='tmdb_gone'`.
4. Set `movies.status = 'curating'` when the first candidate for the movie enters §15.
5. The owner never has to type title, year, plot, cast, genres, poster or runtime. That is the whole point of this step.

---

## 15. CuratorBot, part 2: parsing and verifying technical details

### 15.1 Choosing the video file(s) inside a torrent

1. Call `streamer.register(...)` first (metadata only). It returns the `files` list.
2. Candidate video files: extensions `mp4, mkv, webm, avi, mov, m4v, ogv`.
3. Exclude files whose lowercase path contains any of: `sample`, `trailer`, `featurette`, `behind the scenes`, `extras/`, `bonus`, `promo`, `intro only`.
4. Exclude files under 50 MB unless it is the only video file.
5. For a torrent with several remaining files:
   - If the torrent is clearly a series (names matching `S\d{2}E\d{2}`), reject the candidate with `reject_reason='series_not_supported'`.
   - Otherwise treat each remaining file as a separate variant candidate (for example 480p and 720p versions inside one Internet Archive item).
6. Keep at most 4 files per torrent (the largest 4 after filtering).

### 15.2 Filename heuristics (first pass)

Implement `parseFileName(path: string): ParsedName` in `apps/curator-bot/src/parsing/filename.ts`. It is pure and heavily tested. Use case-insensitive regexes on the file name AND its parent folder name (the parent folder often carries the release info).

| Field | Rule |
|---|---|
| `resolution` | `\b(2160p\|4k\|uhd)\b` → 2160; `1440p` → 1440; `1080[pi]` or `fullhd` → 1080; `720p` or `hd720` → 720; `576p` → 576; `480p` or `dvd(rip)?` → 480; `360p` → 360; `240p` → 240. If several match, take the highest. |
| `videoCodec` | `x264`, `h\.?264`, `avc` → h264; `x265`, `h\.?265`, `hevc` → hevc; `av1` → av1; `vp9` → vp9; `xvid`, `divx` → mpeg4; else unknown |
| `container` | file extension |
| `audioLangs` | Tokens such as `dual[ ._-]?audio`, `multi`, language names (`english`, `hindi`, `tamil`, `telugu`, `french`, ...) and 3-letter codes only when delimited by non-letters (for example `.eng.`). Map with `toIso1`. `dual audio` alone yields `[]` plus a flag `multiAudioHint=true` |
| `subLangs` | Tokens such as `subs`, `esub`, `msub`, `multisub`, `[sub-xx]`. Without explicit languages set flag `hasSubsHint=true` only |
| `source` | `bluray`, `bdrip`, `brrip`, `webrip`, `web-dl`, `hdrip`, `dvdrip`, `cam`, `ts` (informational; CAM/TS gets a ranking penalty, §16.2) |
| `year` | first 4-digit number 1900–2099 |

If resolution is not found in names, leave it `undefined` at this stage. It MUST be resolved by probing (§15.3). If probing is not possible, default to `480` and mark the variant `verified=false`. Never leave `resolution` null in the DB.

### 15.3 ffprobe verification (second pass)

Verification checks real data (resolution, codecs, audio and subtitle tracks, duration) instead of trusting filenames.

1. Verification is expensive (the torrent has to start). Do it only for the top `VERIFY_TOP_N` variants per movie after preliminary ranking (§16.1), and only for variants where `verified=false`.
2. Steps:
   1. `streamer.start(infohash, fileIndex)` → `streamUrl` (absolute).
   2. Wait until `status.downloadedBytes ≥ min(8 MB, 2% of file)` or `VERIFY_TIMEOUT_SECONDS` elapse, polling every 2 s.
   3. Run `ffprobe -v error -print_format json -show_format -show_streams -rw_timeout 15000000 "<streamUrl>"` through `child_process.execFile` (never a shell string; pass args as an array; apply a hard kill after `VERIFY_TIMEOUT_SECONDS`).
   4. Parse with a zod schema. Extract:
      - video stream: `height` → `resolution` (snapped), `codec_name` → `videoCodec`
      - audio streams: `tags.language` → `toIso1` (else `und`), `codec_name`, `channels`, `disposition.default`, `tags.title`
      - subtitle streams: `tags.language` → `sub_langs`
      - `format.duration` → `duration_seconds`
   5. `streamer.stop(infohash)` ALWAYS, in a `finally` block, unless a user stream is already active for that infohash (check `active_streams`).
   6. Update the variant with real values and `verified=true`.
3. If probing fails or times out: keep filename-derived values, `verified=false`, log `warn`. Do not fail the variant (many MKV files probe fine, but some containers need more data).
4. MP4 files with the `moov` atom at the END cannot be probed without downloading the tail. If ffprobe reports an error such as "moov atom not found", mark `verified=false` and add `needsFaststart=true` to the variant's JSON field `notes` (add a `notes jsonb` column). ProjectorBot will rank such files lower for instant start.
5. Concurrency: at most 2 verifications at a time across the worker (use a BullMQ concurrency of 2 on a dedicated `verify` queue, or an in-process semaphore).

---

## 16. CuratorBot, part 3: ranking, variant creation, registration

### 16.1 Order of operations in the worker

For a matched candidate:

1. Register with the streamer (§15.1) → files list.
2. Parse filenames → preliminary variant drafts.
3. Insert drafts (state `registered`, `verified=false`, preliminary `score`).
4. Aggregate-rank all variants of the movie (including previous ones).
5. Verify the top `VERIFY_TOP_N` unverified variants (§15.3) and update them.
6. Re-rank the movie's variants with the real data.
7. Emit `variants.registered` per new variant, then `movie.ready` (once per batch, with the current variant count).
8. Set `movies.status='ready'` when at least one variant exists whose `state='registered'`.
9. Set the candidate state `variant_created`.

### 16.2 Ranking formula

Configurable weights in `apps/curator-bot/src/ranking/config.ts` (override with JSON at `RANKING_CONFIG_PATH`). Documented defaults:

| Factor | Points |
|---|---|
| Verified by ffprobe | +30 |
| Resolution | 1080: +25, 720: +20, 2160: +15, 1440: +18, 576: +10, 480: +8, 360: +4, 240: +1 |
| Video codec | h264 +15, vp9 +8, hevc +8, av1 +5, mpeg4 +3, unknown 0 |
| Audio codec (best track) | aac +8, opus +7, mp3 +5, ac3/eac3 +3, dts/truehd 0, unknown 0 |
| Container | mp4 +5, webm +4, mkv +2, other 0 |
| Seeders | `min(20, 5 * ln(1 + seeders))` |
| Web seed available | +10 |
| Extra audio languages | +2 per additional distinct language, max +6 |
| Subtitles present | +3 |
| Bitrate sanity (size / duration) | −10 if above 25 Mbps or below 0.5 Mbps (skip when duration is unknown) |
| Source quality | CAM/TS/screener −40 |
| `needsFaststart` MP4 | −8 |

Rules:

1. Pure function `scoreVariant(v: VariantDraft, cfg): number` with 20+ unit tests, including property-style checks (adding seeders never decreases the score; verified always beats unverified when everything else is equal).
2. Round to 2 decimals. Store in `variants.score`.
3. The ranking is a DEFAULT order only. Per-user selection (§18) filters first and uses the score as a tie-breaker.

### 16.3 Variant creation rules

1. One variant per (infohash, fileIndex). Upsert on that key.
2. `audio_langs` is derived from `audio_tracks`. If `audio_tracks` is empty (unverified and no hints), leave both empty and mark selection logic to treat it as "unknown audio".
3. If the movie's `original_language` is known and a variant has a single audio track with `lang='und'`, do NOT assume it equals the original language. Keep `und`. (Only the owner can confirm.)
4. Never delete variants automatically. Use `state='retired'` (for example when the streamer reports a permanent failure after 3 attempts).

### 16.4 Registration failures

| Failure | Behavior |
|---|---|
| `StreamerUnavailableError` | Retry the job with backoff (queue-level) |
| `StreamerRejectedError` | Mark candidate `failed` with the streamer's message, notify the owner |
| Torrent has no usable video file | Mark candidate `rejected` (`no_video_file`) |
| ffprobe missing | Fail fast at startup (check `ffprobe -version` once) |

### 16.5 CuratorBot Telegram commands

| Command | Behavior |
|---|---|
| `/start` | Help text |
| `/pending` | Unresolved match questions (§14.4) |
| `/rematch <infohash8> <tmdbId>` | Force a match |
| `/variants <tmdbId>` | Lists variants as a compact table: resolution, codec, audio langs, verified, score, state |
| `/verify <variantId8>` | Enqueue verification now |
| `/retire <variantId8>` | Set `state='retired'` (asks for confirmation first) |
| `/refresh <tmdbId>` | Re-fetch TMDB details |
| `/stats` | Counts of movies by status, candidates by state, variants by state |

All admin only.

---

## 17. ProjectorBot, part 1: HTTP API for the web app

ProjectorBot exposes a small Fastify API. The web app's BACKEND calls it (never the browser directly, because the Bearer key must stay secret). The API returns stream URLs that the browser then plays directly from the streamer.

### 17.1 Cross-cutting rules

1. Auth: `Authorization: Bearer <PROJECTOR_API_KEY>` on every route except `/healthz`. Compare with `crypto.timingSafeEqual`. Missing/invalid → `401` `{ "error": "unauthorized" }`.
2. All bodies/queries/params validated with zod. Invalid → `400` `{ "error": "invalid_request", "details": [...] }`.
3. Rate limiting with `@fastify/rate-limit`: 120 requests per minute per API key.
4. CORS: allow only origins in `PROJECTOR_CORS_ORIGINS` (default none).
5. Every response includes header `x-trace-id`. Accept an incoming `x-trace-id` or create one.
6. Error shape is always `{ "error": "<snake_case_code>", "message": "<human text>" }`.
7. `userId` is an opaque string supplied by the web app (1–128 chars, `[A-Za-z0-9_.:@-]`).

### 17.2 Routes

| Method and path | Purpose |
|---|---|
| `GET /healthz` | Liveness: `{ "ok": true }` (no auth) |
| `GET /api/movies/:tmdbId/options` | What audio/resolution choices exist for a movie |
| `POST /api/play` | Choose a variant for a user and start streaming |
| `GET /api/users/:userId/prefs` | Read preferences |
| `PUT /api/users/:userId/prefs` | Update preferences |
| `POST /api/progress` | Save playback position |
| `GET /api/users/:userId/progress/:tmdbId` | Read playback position |
| `POST /api/streams/heartbeat` | Keep an active stream alive and track viewers |
| `POST /api/streams/release` | Viewer left (decrement viewers) |
| `POST /api/link-codes` | Create a Telegram link code for a user (§19.4) |

### 17.3 `GET /api/movies/:tmdbId/options`

Response `200`:

```json
{
  "tmdbId": 10331,
  "title": "Night of the Living Dead",
  "year": 1968,
  "originalLanguage": "en",
  "status": "ready",
  "audioLanguages": ["en"],
  "resolutions": [480, 720, 1080],
  "options": [
    {
      "variantId": "0c8d...",
      "resolution": 720,
      "videoCodec": "h264",
      "audioLangs": ["en"],
      "subLangs": ["en"],
      "verified": true,
      "sizeBytes": 1234567890,
      "durationSeconds": 5760
    }
  ]
}
```

Rules: include only variants with `state IN ('registered','started')`. Sort by resolution desc then score desc. `404` with `movie_not_found` if the movie is not in the DB. `409` with `movie_not_ready` and `retryAfterSeconds: 30` if status is not `ready`.

### 17.4 `POST /api/play`

Request:

```json
{
  "userId": "u_123",
  "tmdbId": 10331,
  "audio": "en",
  "maxResolution": 720,
  "subtitle": "en",
  "variantId": null,
  "resumeFrom": null
}
```

Field rules:

1. `audio`, `maxResolution`, `subtitle` are optional overrides for THIS request only. Missing values fall back to the stored `user_prefs` (created with defaults if the user has none).
2. `variantId` is optional. If present, skip selection and use that variant (still must belong to `tmdbId`, else `400 variant_mismatch`). Used when the viewer picks a specific option manually.
3. `resumeFrom` is optional seconds. If absent, use `watch_progress.position_seconds` when present, else `0`.

Flow:

1. Load movie and variants. Run `chooseVariant` (§18) unless `variantId` was given.
2. If no variant is acceptable → `404` `{ "error": "no_matching_variant", "message": "...", "available": { audioLanguages, resolutions } }`.
3. Call `streamer.start(infohash, fileIndex)` inside a per-infohash mutex (so two simultaneous plays do not double-start). If the stream is already active, reuse it: `status()` check, then return its URL.
4. Upsert `active_streams` (viewer_count + 1, `last_activity_at = now()`), set `variants.state='started'`.
5. Upsert `watch_progress` with the chosen `variant_id` (position unchanged here).
6. Response `200`:

```json
{
  "streamUrl": "https://streamer.example.com/stream/<infohash>/0",
  "variantId": "0c8d...",
  "tmdbId": 10331,
  "resolution": 720,
  "audioLang": "en",
  "subtitleLang": "en",
  "resumePosition": 123,
  "alternatives": [
    { "variantId": "...", "resolution": 1080, "audioLangs": ["en"], "reason": "higher_resolution" },
    { "variantId": "...", "resolution": 480, "audioLangs": ["en"], "reason": "lower_resolution" }
  ],
  "selection": {
    "audioMatch": "exact",
    "resolutionMatch": "capped",
    "notes": []
  }
}
```

`selection.audioMatch` is `exact`, `fallback_original`, `fallback_any`, or `unknown_audio`. `resolutionMatch` is `exact`, `capped` (best available under the cap), or `above_cap` (nothing under the cap existed). `notes` is a list of short strings the web app may show (for example "Hindi audio not available, playing English").

### 17.5 Preferences routes

`PUT /api/users/:userId/prefs` body (all optional, at least one required):

```json
{ "audioLang": "ta", "maxResolution": 1080, "subtitleLang": "en", "preferOriginalAudio": false }
```

Validation: `audioLang` must be an ISO 639-1 code known to `toIso1`; `maxResolution` ∈ {240,360,480,576,720,1080,1440,2160}; `subtitleLang` may be `null` to turn subtitles off. Returns the full updated prefs.

### 17.6 Progress and heartbeat

1. `POST /api/progress` body `{ userId, tmdbId, variantId?, positionSeconds, durationSeconds? }`. Upsert. Accept at most one write per user per movie per 5 seconds (extra writes inside the window are acknowledged but ignored).
2. `POST /api/streams/heartbeat` body `{ infohash? , variantId }`: update `last_activity_at`. The web app SHOULD call it every 30 seconds while playing.
3. `POST /api/streams/release` body `{ variantId }`: decrement `viewer_count` (never below 0). The idle reaper (§19.1) decides when to stop.

---

## 18. ProjectorBot, part 2: choosing the right variant per user

Implement as a PURE function in `apps/projector-bot/src/selection/chooseVariant.ts`. No DB or network inside. This is the heart of "different torrents for different settings".

```ts
// CONTRACT
export type SelectionInput = {
  variants: Variant[];                 // only registered/started ones
  originalLanguage: string | null;     // movie.original_language
  prefs: { audioLang: string; maxResolution: number; subtitleLang: string | null; preferOriginalAudio: boolean };
};

export type SelectionResult =
  | { ok: true; variant: Variant; audioMatch: 'exact' | 'fallback_original' | 'fallback_any' | 'unknown_audio';
      resolutionMatch: 'exact' | 'capped' | 'above_cap'; alternatives: { variant: Variant; reason: string }[]; notes: string[] }
  | { ok: false; reason: 'no_variants' };
```

### 18.1 Algorithm (follow in order)

1. If `variants` is empty → `{ ok:false, reason:'no_variants' }`.
2. **Decide the target audio language**:
   - If `prefs.preferOriginalAudio` and `originalLanguage` is known → target = `originalLanguage`.
   - Else target = `prefs.audioLang`.
3. **Audio filter (tiered)**:
   - Tier 1 `exact`: variants whose `audioLangs` includes the target.
   - Tier 2 `fallback_original`: variants whose `audioLangs` includes `originalLanguage` (only if it differs from target).
   - Tier 3 `unknown_audio`: variants with empty `audioLangs` (cannot confirm anything).
   - Tier 4 `fallback_any`: all remaining variants.
   - Use the first non-empty tier. Add a note when the tier is not `exact` (for example "Tamil audio not available. Playing English.").
4. **Resolution selection inside the chosen tier**:
   - Let `underCap` = variants with `resolution <= prefs.maxResolution`.
   - If `underCap` is non-empty: choose the highest resolution in it. `resolutionMatch = 'exact'` if equal to the cap, else `'capped'`.
   - If `underCap` is empty: choose the LOWEST resolution available (closest to the cap) and `resolutionMatch='above_cap'`. Add a note.
5. **Tie-breakers** among variants with the same resolution, in order:
   1. `verified` true first
   2. subtitle match: prefer variants whose `subLangs` includes `prefs.subtitleLang` (when set)
   3. higher `score`
   4. higher `seeders`
   5. smaller `sizeBytes`
   6. lexicographically smaller `id` (deterministic)
6. **Alternatives** (for the web app's quality/audio menu): up to 6 other variants from ALL tiers, each with a `reason` from this set: `higher_resolution`, `lower_resolution`, `other_audio:<lang>`, `other_source`. Sort: same audio first, then by resolution closest to the chosen one.
7. Never mutate inputs. Return new objects.

### 18.2 Tests (minimum list)

Table-driven, each case with a short name:

1. Single variant → chosen, no alternatives.
2. Exact audio + exact resolution.
3. Exact audio, resolution capped (1080 available, cap 720 → picks 720).
4. All variants above cap → picks lowest, `above_cap` note.
5. Target audio missing, original language available → `fallback_original`.
6. Target audio and original missing, unknown-audio variant exists → `unknown_audio`.
7. Nothing matches → `fallback_any`.
8. `preferOriginalAudio` overrides `audioLang`.
9. Tie on resolution: verified beats unverified.
10. Tie on verified: subtitle match wins.
11. Tie on subtitle: higher score wins.
12. Deterministic output for fully identical variants (id ordering).
13. Alternatives exclude the chosen variant and cap at 6.
14. Input arrays are not mutated.
15. A property test: for random variant sets, the chosen variant is always a member of the input and never violates the cap unless `above_cap`.

### 18.3 Switching audio or quality mid-playback

Switching means calling `POST /api/play` again with `audio` or `maxResolution` overrides (or a `variantId` from `alternatives`) and `resumeFrom` = the player's current time. The response carries the new `streamUrl`. The web app swaps the source and seeks to `resumePosition`. ProjectorBot MUST:

1. Not stop the old stream immediately (the viewer may still be buffering). Call `release` for the old variant and let the idle reaper stop it later.
2. Save progress under the NEW variant id.
3. Warn in `notes` when the new variant has a different `durationSeconds` than the old one by more than 3 seconds (different cuts), because the resume position may be off.

If a single file contains several audio tracks (a multi-audio MKV), switching audio inside the same file is a PLAYER feature, not a ProjectorBot feature. `options` already lists the tracks in `variant.audioTracks` so the web app can use them. Do NOT build transcoding or HLS packaging in this project. Mention this as a limit in the README.

---

## 19. ProjectorBot, part 3: stream lifecycle and Telegram

### 19.1 Idle reaper

1. Runs every `STREAM_REAPER_INTERVAL_SECONDS` as a BullMQ repeatable job.
2. For each row in `active_streams` where `viewer_count = 0` OR `last_activity_at < now() - STREAM_IDLE_MINUTES`:
   1. Take the per-infohash mutex.
   2. Re-read the row inside the lock (it may have been refreshed).
   3. Call `streamer.stop(infohash)`.
   4. Delete the `active_streams` row and set `variants.state='registered'`.
3. A heartbeat or play on a stream that the reaper stopped simply starts it again via `/api/play`.
4. Errors on one stream never stop the loop. Log and continue.
5. `viewer_count` can drift (browser crashed without `release`). The `last_activity_at` rule is the safety net.

### 19.2 Disk quota eviction

1. After each successful `start`, and also every 10 minutes, call `streamer.diskUsage()`.
2. If `usedBytes > DISK_QUOTA_GB`: evict until usage falls below `DISK_EVICTION_TARGET_PERCENT` of the quota.
3. Eviction order: least recently watched first, based on `watch_progress.updated_at` (max over users) per variant, then variants never watched, oldest `created_at` first.
4. NEVER evict a variant that has an active stream. NEVER evict variants watched in the last 24 hours unless nothing else is left.
5. Eviction means `streamer.remove(infohash)` (delete data) and keep the variant `registered` so it can be re-downloaded on demand.
6. Notify the admins on Telegram when an eviction run frees data, with counts and bytes.

### 19.3 Telegram commands (admin)

| Command | Behavior |
|---|---|
| `/start` | Help |
| `/nowplaying` | Lists active streams: title, resolution, audio, viewers, idle minutes |
| `/stop <infohash8>` | Stops that stream (confirmation button) |
| `/disk` | Shows streamer disk usage and quota |
| `/prefs` | Shows the caller's preferences (if linked, §19.4) with inline buttons to change audio language, max resolution and subtitles |
| `/user <userId>` | Admin: show another user's prefs |

`/prefs` flow: inline keyboards with `pf:a:<lang>` (audio), `pf:r:<res>` (resolution), `pf:s:<lang|off>` (subtitles). Each tap updates the DB and edits the message to show the new values. Offer only languages that exist in at least one variant in the catalog (query distinct `audio_langs`), plus the current value.

### 19.4 Linking a Telegram account to a web app user

1. The web app calls `POST /api/link-codes` with `{ userId }`. ProjectorBot creates an 8-character code (alphabet without `0 O 1 I`), valid 10 minutes, single use, and returns `{ code, expiresAt }`.
2. The user sends `/link <code>` to ProjectorBot. On success insert into `user_links`. Reply "Linked."
3. Non-admin users MAY use only `/start`, `/link`, `/prefs` (their own). Everything else requires admin.
4. Wrong or expired code → "That code is invalid or expired." and count attempts (max 5 per Telegram id per hour).

### 19.5 Startup and shutdown

1. On startup: run a one-time reconciliation. For every `active_streams` row, query the streamer `status`. If the streamer reports `stopped` or not found, delete the row and reset the variant state. This handles restarts.
2. SIGTERM: stop accepting HTTP requests, finish in-flight ones (up to 15 s), stop workers, stop Telegram polling, close DB/Redis. Do NOT stop streams on shutdown (the streamer owns them).

---

## 20. Infrastructure

### 20.1 docker-compose

`docker-compose.yml` services:

| Service | Image / build | Ports | Notes |
|---|---|---|---|
| `postgres` | `postgres:16` | 5432 | Volume `pgdata`, healthcheck `pg_isready` |
| `redis` | `redis:7` | 6379 | Healthcheck `redis-cli ping` |
| `mock-streamer` | build `tools/mock-streamer` | 3000 | Fake streamer (§20.2) |
| `scout-bot` | build `apps/scout-bot` | none | Depends on postgres, redis (healthy) |
| `curator-bot` | build `apps/curator-bot` | none | Image includes `ffmpeg`/`ffprobe`. Depends on postgres, redis, mock-streamer |
| `projector-bot` | build `apps/projector-bot` | 8080 | Depends on postgres, redis, mock-streamer |
| `migrate` | one-shot, runs `pnpm db:migrate` | none | The three bots depend on it completing successfully |

Rules:

1. Multi-stage Dockerfiles: `deps` (pnpm install with a cache mount) → `build` (tsc) → `runtime` (node:20-slim, non-root user, only production deps and `dist`).
2. Healthchecks for every service (bots expose a tiny internal HTTP `/healthz` on a private port or use a file-based heartbeat; ProjectorBot uses its API).
3. All config via env file `.env` (referenced with `env_file`). Never bake secrets into images.
4. `docker compose up --build` must work on a clean checkout after copying `.env.example` to `.env` and filling in the three bot tokens, `TMDB_READ_TOKEN`, `ADMIN_TELEGRAM_IDS`, `PROJECTOR_API_KEY`.
5. Provide a profile `test` that starts only postgres, redis and mock-streamer for integration tests.

### 20.2 Mock streamer (`tools/mock-streamer`)

A small Fastify app that imitates the owner's streamer using the default mapping in §11.2. It exists for local development and for end-to-end tests.

Behavior:

1. `POST /api/torrents` accepts `{ magnet }` or a multipart `.torrent`. It returns a deterministic file list derived from the infohash (for example two files: `<name>.480p.mp4` and `<name>.720p.mp4`) so tests can predict outcomes. Offer a header `x-mock-scenario` for failures: `unavailable` (503), `rejected` (422), `slow` (delay 3 s).
2. `POST /api/torrents/:infohash/start` marks the torrent as streaming and returns `{ streamUrl: "/stream/<infohash>/<fileIndex>" }`.
3. `GET /stream/:infohash/:fileIndex` serves a small generated sample video with proper `Range` support (206 responses, `Accept-Ranges: bytes`). Generate the sample at image build time with ffmpeg so no binary is committed:
   `ffmpeg -f lavfi -i testsrc=duration=20:size=1280x720:rate=24 -f lavfi -i sine=frequency=440:duration=20 -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart sample.mp4`
   Optionally generate a second file with a different sine frequency and a metadata `language=hin` audio tag to make the multi-language tests real:
   `-metadata:s:a:0 language=hin`.
4. `POST /api/torrents/:infohash/stop`, `GET /api/torrents/:infohash`, `GET /api/disk`, `DELETE /api/torrents/:infohash` per §11.2.
5. State is in memory. Provide `POST /__reset` for tests.

---

## 21. Testing strategy

### 21.1 Rules

1. Unit tests MUST NOT touch the real network, the real Telegram API, or the real TMDB. Use `msw` for HTTP and stubs for grammY (`bot.api.config.use` transformer that records calls and returns canned results).
2. Integration tests use real Postgres and Redis (docker compose `test` profile or testcontainers) and the mock streamer.
3. Fixtures: record real responses ONCE (TMDB search for the test movie, Internet Archive advancedsearch and metadata for one public-domain item, one tiny valid torrent built in code) into `tests/fixtures`. Strip any tokens from fixtures.
4. Coverage targets: shared 85%, each bot 75% lines, selection/ranking/matching/parsing 95%.
5. `pnpm test` runs unit tests only (fast). `pnpm test:integration` runs integration. `pnpm test:e2e` runs the full flow.

### 21.2 Required test inventory

| Area | What to test |
|---|---|
| `util/language` | 40+ cases (§9.1) |
| `util/infohash` | hex, base32, uppercase, malformed, tracker handling, torrent hashing |
| TMDB client | mapping, 429 retry with `Retry-After`, 404, zod failure, cache hit |
| `matchTitleToTmdb` | 25+ cases (§14.2) incl. thresholds around 0.60 and 0.85 |
| Filename parser | 40+ filenames. Include these shapes: `Movie.Name.1968.1080p.BluRay.x264-GRP.mkv`, `Movie Name (1968) [720p] [YTS].mp4`, `movie_name_480p.ogv`, `Movie.Name.1968.Dual.Audio.Hindi.English.720p.mkv`, folder-carried info, no info at all |
| ffprobe parser | recorded JSON outputs: multi-audio MKV, MP4 with one audio, no audio, subtitle tracks, `und` languages |
| Ranking | 20+ cases and the property tests (§16.2) |
| `chooseVariant` | list in §18.2 |
| Internet Archive adapter | allowed licenses, skipped licenses, missing license, no video file, torrent download failure, rate-limit behavior |
| Blender adapter | verified vs unverified catalog entries, fuzzy title match |
| Manual flow | magnet parse, oversize torrent, invalid torrent, confirmation required, duplicate |
| ScoutBot handlers | `/search` by name (buttons), by id, TMDB 404, zero results, already searching |
| Curator worker | idempotent redelivery, license gate, auto/ask/reject paths, resume after approval |
| Registration | streamer failure types → correct retry vs fail behavior |
| ProjectorBot API | auth, validation, `options`, `play` (every selection tier), double-play race, progress throttle, heartbeat |
| Reaper and eviction | idle stop, no stop when refreshed, eviction order, never evict active |
| Telegram guards | non-admin rejected on every admin command |
| Migrations | fresh DB migrates; migrating twice is a no-op |

### 21.3 End-to-end test (`tests/e2e/full-flow.test.ts`)

1. Start the compose `test` profile (postgres, redis, mock-streamer) and run the three apps in-process with fake Telegram transport.
2. Stub TMDB and Internet Archive with `msw` using fixtures for *Night of the Living Dead*.
3. Simulate the owner: `/search Night of the Living Dead` → tap the first match.
4. Assert (poll with timeout 60 s):
   - `movies` row has title, year, overview, poster path, cast, genres, runtime filled.
   - `candidates` row exists with license `public-domain` (or the fixture's license).
   - At least 2 `variants` exist (480p and 720p from the mock streamer's file list), top-N verified.
   - `movie.ready` was emitted once.
   - ScoutBot sent a "ready" message with the variant list.
5. Create two users via the API: user A prefs `{ audioLang:'en', maxResolution:480 }`, user B `{ audioLang:'en', maxResolution:720 }`. Call `POST /api/play` for both. Assert different `variantId`/`streamUrl` and correct `resolutionMatch`.
6. Fetch each `streamUrl` with a `Range: bytes=0-1023` header and assert `206`.
7. Switch user B to a request with `maxResolution: 480` and `resumeFrom: 10`. Assert the new URL equals user A's and `resumePosition` is `10`.
8. Wait past a shortened idle timeout (env override) and assert the streams stop and `active_streams` is empty.

---

## 22. Acceptance criteria (the checklist the owner will use)

Mark each item in the Walkthrough with evidence (command output, log excerpt, test name).

1. [ ] `cp .env.example .env`, fill secrets, `docker compose up --build` starts every service healthy.
2. [ ] `/search Night of the Living Dead` in ScoutBot → TMDB match buttons → pick → progress message → "ready" message. No manual typing of details.
3. [ ] `/search 10331` (TMDB id path) works the same without the buttons step (if the id resolves to that film).
4. [ ] `/search` for a title with no legal source replies with the "no legal sources" message and leaves `movies.status='failed'`.
5. [ ] `/addmanual` requires the legality confirmation and writes an `audit_log` row.
6. [ ] A candidate with an empty license is rejected and never becomes a variant.
7. [ ] Variants show real audio/resolution data after verification (`/variants <tmdbId>` in CuratorBot).
8. [ ] `POST /api/play` returns different stream URLs for users with different preferences, with correct `selection` fields.
9. [ ] Fallbacks work: user wants Hindi audio, only English exists → English with a note.
10. [ ] Nothing downloads until `play` (mock streamer shows no `start` calls after registration, except short verification probes which are stopped).
11. [ ] Idle streams stop automatically; disk eviction respects the rules in §19.2.
12. [ ] Restarting any bot mid-flow does not lose or duplicate work (kill a worker while a job is active and show it completes after restart).
13. [ ] `pnpm lint`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e` all pass.
14. [ ] README, RUNBOOK, STREAMER_MAPPING, ASSUMPTIONS, OPEN_QUESTIONS are present and accurate.

---

## 23. Security checklist

1. Secrets only from env. `.env` is git-ignored. Run a secret scan over the repo before finishing (for example `pnpm dlx gitleaks detect --no-git` if available offline, otherwise a simple regex check script) and include the result in the Walkthrough.
2. Admin commands are guarded by `adminOnly()`. Add a test that iterates over every registered command and asserts the guard (except `/start`, `/link` and `/prefs` where documented).
3. SSRF: only download `.torrent` files from hosts in `TORRENT_URL_HOST_ALLOWLIST`, only over https, follow at most 3 redirects, and re-check the host after redirects. Cap size at `MAX_TORRENT_FILE_BYTES` while streaming the body (not after).
4. Never execute shell strings. `ffprobe` is called with `execFile` and an argument array. The URL passed to ffprobe MUST come from the streamer response and MUST be validated to start with the streamer's configured base URL.
5. Validate and length-limit every Telegram-originated string before use (names, captions). Escape HTML in all outbound messages.
6. SQL: only through Drizzle or parameterized queries. No string concatenation into SQL.
7. API: constant-time key comparison, rate limiting, request body size limit (64 KB), no stack traces in responses.
8. Dependencies: pinned versions, `pnpm audit --prod` result recorded in the Walkthrough, no postinstall scripts from unknown packages (use `pnpm` `onlyBuiltDependencies` allowlist).
9. Docker: non-root user, read-only root filesystem where possible, no privileged mode, no exposed Postgres/Redis ports in the production compose override.
10. Logs: no tokens, no API keys, no full magnet links at `info`.

---

## 24. Observability and error handling

1. Every bot logs one line per state transition with `traceId`, `tmdbId`, `infohash` and `state`.
2. Each app exposes `/metrics` in Prometheus format on an internal port (use `prom-client`): job counts by queue and result, adapter call durations and failures by adapter, streamer call durations and failures, selection tier counters (`exact`, `fallback_original`, ...), active streams gauge.
3. Error classes (shared): `ExternalApiError`, `AdapterError`, `StreamerUnavailableError`, `StreamerRejectedError`, `StreamerNotFoundError`, `InvalidTorrentError`, `ValidationError`. Each has `retryable: boolean`. Workers use this flag to decide between rethrow (retry) and permanent failure.
4. Owner notifications (Telegram) for: permanent job failure (with `traceId`), poll failure streak, eviction runs, repeated streamer unavailability (max one message per hour).
5. `docs/RUNBOOK.md` MUST contain: how to read logs by `traceId`, how to replay a failed job, how to retire a bad variant, how to reset one movie (`/refresh`, then re-search), how to rotate the API key and bot tokens, how to point at the real streamer.

---

## 25. Task breakdown for the Agent Manager

Create these tasks in the Task List. Tasks within the same phase and different agents can run in parallel.

### Phase 0: foundation (single agent, sequential)

| ID | Task | Depends on | Size |
|---|---|---|---|
| T0.1 | Monorepo scaffolding: pnpm workspace, tsconfig base, ESLint, Prettier, vitest, scripts | none | S |
| T0.2 | `packages/shared`: config (zod env), logging, http helper, error classes | T0.1 | M |
| T0.3 | `packages/shared`: DB schema, migrations, repositories | T0.2 | L |
| T0.4 | `packages/shared`: types/schemas, language util, infohash/magnet util | T0.2 | M |
| T0.5 | `packages/shared`: queues (names, payload schemas, helpers) | T0.2, T0.4 | M |
| T0.6 | `packages/shared`: TMDB client + `matchTitleToTmdb` | T0.2, T0.4 | L |
| T0.7 | `packages/shared`: StreamerClient interface, `HttpStreamerClient`, mapping layer, `MockStreamer` | T0.2, T0.4 | M |
| T0.8 | `packages/shared`: Telegram helpers | T0.2 | S |
| T0.9 | `tools/mock-streamer` + docker-compose skeleton (postgres, redis, mock-streamer, migrate) | T0.3, T0.7 | M |

Gate: all shared tests pass; contracts written to `docs/CONTRACTS.md`. Ask the owner to approve before Phase 1.

### Phase 1: bots (parallel, one agent each)

| ID | Agent | Task | Depends on | Size |
|---|---|---|---|---|
| T1.A1 | A (Scout) | Bot commands, `/search` flow, watchlist, status | Phase 0 | L |
| T1.A2 | A | Internet Archive adapter + fixtures | Phase 0 | L |
| T1.A3 | A | Blender adapter + verified catalog | Phase 0 | M |
| T1.A4 | A | Search worker, polling, manual flow | T1.A1–A3 | L |
| T1.B1 | B (Curator) | Candidate worker, license gate, matching and pending-match UX | Phase 0 | L |
| T1.B2 | B | Filename parser + ffprobe parser | Phase 0 | L |
| T1.B3 | B | Ranking + variant creation + registration | T1.B1, T1.B2 | L |
| T1.B4 | B | Verification worker + admin commands | T1.B3 | M |
| T1.C1 | C (Projector) | `chooseVariant` + tests | Phase 0 | M |
| T1.C2 | C | HTTP API (options, play, prefs, progress, heartbeat) | T1.C1 | L |
| T1.C3 | C | Reaper, eviction, startup reconciliation | T1.C2 | M |
| T1.C4 | C | Telegram commands, link codes | T1.C2 | M |

### Phase 2: integration (agent D)

| ID | Task | Depends on | Size |
|---|---|---|---|
| T2.1 | Dockerfiles for all apps, full compose, healthchecks | Phase 1 | M |
| T2.2 | Integration tests (queues + DB + mock streamer) | Phase 1 | L |
| T2.3 | End-to-end test (§21.3) | T2.1, T2.2 | L |
| T2.4 | Docs: README, RUNBOOK, STREAMER_MAPPING, ASSUMPTIONS, OPEN_QUESTIONS | Phase 1 | M |
| T2.5 | Security pass (§23) and acceptance run (§22) | T2.3 | M |
| T2.6 | Walkthrough artifact | T2.5 | S |

---

## 26. Open questions and default assumptions

Put these in `docs/OPEN_QUESTIONS.md` at the start, answer them as the owner replies, and keep the safe defaults until then.

| # | Question for the owner | Default until answered |
|---|---|---|
| 1 | What are the real routes, auth and response shapes of the torrent streamer? | Use the default mapping and the mock (§11.2) |
| 2 | Does the streamer support selecting a file index inside a multi-file torrent and Range requests on it? | Assume yes |
| 3 | Is the web app commercial? (decides whether `by-nc`/`by-nd` CC licenses are acceptable, §13.2) | Not allowed (`IA_ALLOW_RESTRICTED_CC=false`) |
| 4 | Which languages matter most for the catalog? (affects `/prefs` buttons and the language util) | English plus the minimum list in §9.1 |
| 5 | How will the web app authenticate to ProjectorBot, and is there a user id format? | Static Bearer key and opaque string ids |
| 6 | Where does the streamer's data live and how large is the disk? | `DISK_QUOTA_GB=200` |
| 7 | Do you want webhooks instead of long polling for the three bots in production? | Long polling |
| 8 | Do you also want subtitle files served (WebVTT) or only embedded tracks? | Embedded tracks only (not in scope) |

Explicitly OUT OF SCOPE for this project (do not build): the web app UI, the torrent engine itself, transcoding or HLS packaging, user accounts, payments, any non-legal source adapter.

---

## 27. Appendix

### 27.1 Example Telegram conversation (ScoutBot)

```
Owner: /search Night of the Living Dead
Bot:   Pick the right movie:
       1. Night of the Living Dead (1968): A group of strangers hole up in a farmhouse...
       2. Night of the Living Dead (1990): ...
       [Night of the Living Dead (1968)] [Night of the Living Dead (1990)] [Cancel]
Owner: (taps 1)
Bot:   Searching for Night of the Living Dead (1968)...
Bot:   Searched: Internet Archive ✓, Blender ✓. Found 2 new candidates (0 duplicates skipped).
Bot:   ✅ Night of the Living Dead (1968) is ready with 3 variants:
       • 720p · en · verified
       • 480p · en · verified
       • 480p · en · unverified
```

### 27.2 Example `candidates.found` payload

```json
{
  "traceId": "6f1c3b0e-6d52-4e5e-9a41-3d8f2b7d0c11",
  "requestedBy": 123456789,
  "tmdbId": 10331,
  "candidate": {
    "source": "internet_archive",
    "sourceId": "night_of_the_living_dead",
    "infohash": "0123456789abcdef0123456789abcdef01234567",
    "torrentUrl": "https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_archive.torrent",
    "rawName": "Night of the Living Dead",
    "sizeBytes": 1234567890,
    "seeders": 0,
    "hasWebSeed": true,
    "license": "public-domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "year": 1968
  }
}
```

(The infohash above is a placeholder for illustration only. Never copy it into code.)

### 27.3 Example ffprobe JSON the parser must handle (trimmed)

```json
{
  "streams": [
    { "index": 0, "codec_type": "video", "codec_name": "h264", "width": 1280, "height": 720 },
    { "index": 1, "codec_type": "audio", "codec_name": "aac", "channels": 2,
      "tags": { "language": "eng" }, "disposition": { "default": 1 } },
    { "index": 2, "codec_type": "audio", "codec_name": "ac3", "channels": 6,
      "tags": { "language": "hin", "title": "Hindi 5.1" }, "disposition": { "default": 0 } },
    { "index": 3, "codec_type": "subtitle", "codec_name": "subrip", "tags": { "language": "eng" } }
  ],
  "format": { "duration": "5760.120000", "size": "1234567890", "format_name": "matroska,webm" }
}
```

Expected parse: resolution 720, videoCodec `h264`, audioTracks `[{lang:'en',codec:'aac',channels:2,isDefault:true},{lang:'hi',codec:'ac3',channels:6,isDefault:false,title:'Hindi 5.1'}]`, subLangs `['en']`, duration 5760.

### 27.4 Definition of done (final reminder)

1. Every acceptance item in §22 is checked, with evidence.
2. No TODO left in code without a matching entry in `docs/OPEN_QUESTIONS.md`.
3. No source adapter exists beyond the three allowed in §4.1.
4. The Walkthrough lists exactly what was and was not completed. Honest reporting beats a green checklist.

END OF SPECIFICATION
