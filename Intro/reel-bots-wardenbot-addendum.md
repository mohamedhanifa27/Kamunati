# WARDENBOT ADDENDUM: the moderator bot for the whole fleet

Extends: `reel-bots-antigravity-spec.md` (the "main spec"). Read the main spec first. Section numbers here are prefixed with `A` (for example §A4) so they never clash with main-spec sections (for example §8).
Audience: the Antigravity agent(s). Same working rules as main-spec §2 apply (Planning mode, Task List + Implementation Plan first, wait for approval, evidence for every claim).

---

## A1. What "moderate" means here, and what is technically possible

The owner asked for a moderator bot that moderates all four bots: ScoutBot, CuratorBot, ProjectorBot (built by this project) and **@kamunatiprime_bot** (the owner's EXISTING bot, not built by this project). The new bot is called **WardenBot**.

"Moderate" is interpreted as four jobs:

| Job | Meaning |
|---|---|
| Fleet supervision | Know whether every bot is alive, healthy, and not backed up. Alert the owner. |
| Content moderation | Review before publishing, quarantine, take down, block, handle viewer reports, keep proof of licensing. |
| User moderation | Ban/mute abusive users, flood control, role-based admin rights. |
| Emergency control | Pause everything quickly (kill switch), resume, maintenance mode. |

### A1.1 Hard technical limits (do not try to work around them)

| Fact | Consequence for the design |
|---|---|
| A Telegram bot cannot read another bot's private chats. | WardenBot can NOT watch conversations of the other bots. Moderation is enforced through the SHARED DATABASE and shared guards, not by eavesdropping. |
| Two processes calling `getUpdates` with the same token steal each other's updates. | WardenBot MUST NEVER call `getUpdates`, `setWebhook` or `deleteWebhook` with another bot's token. |
| Bots cannot restart other containers without privileged access. | WardenBot MUST NOT mount `/var/run/docker.sock` or hold any orchestrator credentials. It reports and alerts; the owner restarts. |
| @kamunatiprime_bot is external code. | Integrate non-invasively: Level 1 needs no code change, Level 2 is an optional heartbeat snippet (§A6.1.4). |

---

## A2. Fleet overview (now five processes)

| Bot id | Name | Built by this project | Telegram token env | Role |
|---|---|---|---|---|
| `scout` | ScoutBot | yes | `SCOUT_BOT_TOKEN` | Discovery |
| `curator` | CuratorBot | yes | `CURATOR_BOT_TOKEN` | Enrich, verify, register |
| `projector` | ProjectorBot | yes | `PROJECTOR_BOT_TOKEN` | Per-user playback + API |
| `kamunati` | @kamunatiprime_bot | NO (existing) | `KAMUNATI_BOT_TOKEN` (optional, health checks only) | Owner's existing bot |
| `warden` | WardenBot | yes (this addendum) | `WARDEN_BOT_TOKEN` | Moderation, supervision, kill switch |

Communication rules from main-spec §1.2 still hold: apps talk through BullMQ queues and the shared database. The ONLY addition is the shared "control flags" table polled by every app (§A6.4) and the heartbeat keys in Redis (§A6.1).

---

## A3. Roles and permissions

Roles are stored in the `moderators` table (§A4). `ADMIN_TELEGRAM_IDS` (main spec §7.1) are always `owner` and are seeded into the table at startup.

| Capability | viewer | moderator | owner |
|---|---|---|---|
| `/fleet`, `/health`, `/queues`, `/audit` | yes | yes | yes |
| Review queue: approve, reject | no | yes | yes |
| Quarantine, takedown | no | yes | yes |
| Block / unblock | no | yes | yes |
| Handle reports | no | yes | yes |
| Ban, mute, unban users | no | yes | yes |
| Restore a taken-down title | no | no | yes |
| Pause one app | no | yes | yes |
| Global `/panic`, `/resume`, `/maintenance` | no | no | yes |
| Replay failed jobs | no | no | yes |
| Manage moderators (`/addmod`, `/delmod`, `/mods`) | no | no | yes |

Rules:

1. Every WardenBot handler and every inline-button callback MUST check the role of the Telegram user who triggered it (not the chat). A non-moderator tapping a button in the mod group gets a toast "Not allowed." and nothing happens.
2. Role lookups are cached 30 seconds.
3. Replace the main-spec `adminOnly()` helper with `requireRole(minRole)` in `packages/shared/src/telegram`. `adminOnly()` becomes `requireRole('owner')`. Other bots keep their current behavior through that alias.
4. A moderator cannot demote or ban an owner. An owner cannot be banned by anyone.

---

## A4. Data model additions

Nothing is built yet, so EDIT the main-spec §8 migration in place (do not create ALTER migrations). Changes to existing tables:

```sql
-- CONTRACT: changes to existing tables
-- movies.status CHECK now also allows 'taken_down':
--   CHECK (status IN ('new','searching','curating','ready','failed','taken_down'))
-- candidates.state CHECK now also allows 'blocked'
-- variants gets:
ALTER TABLE variants ADD COLUMN moderation_state text NOT NULL DEFAULT 'active'
  CHECK (moderation_state IN ('pending_review','active','quarantined','taken_down'));
ALTER TABLE variants ADD COLUMN moderated_by text;      -- 'telegram:<id>' | 'system'
ALTER TABLE variants ADD COLUMN moderated_at timestamptz;
ALTER TABLE variants ADD COLUMN moderation_reason text;
-- candidates gets (evidence for licensing; used in review cards):
ALTER TABLE candidates ADD COLUMN license_proof_url text;
```

New tables:

```sql
-- CONTRACT
CREATE TABLE moderators (
  telegram_id  bigint PRIMARY KEY,
  role         text NOT NULL CHECK (role IN ('viewer','moderator','owner')),
  added_by     bigint,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE blocklist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL CHECK (kind IN ('infohash','tmdb_id','source_id','title_contains')),
  value       text NOT NULL,                  -- normalized: infohash lowercase hex; title via norm() from main-spec §14.2
  reason      text,
  created_by  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, value)
);

CREATE TABLE reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id      integer REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  variant_id   uuid REFERENCES variants(id) ON DELETE SET NULL,
  reporter_ref text NOT NULL,                 -- opaque web-app user id or 'anonymous'
  reason       text NOT NULL CHECK (reason IN ('copyright','wrong_content','quality','abuse','other')),
  details      text,                          -- max 1000 chars
  state        text NOT NULL DEFAULT 'open' CHECK (state IN ('open','dismissed','quarantined','taken_down')),
  handled_by   text,
  handled_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_state_idx ON reports (state, created_at);

CREATE TABLE user_bans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_kind  text NOT NULL CHECK (subject_kind IN ('telegram','web')),
  subject_id    text NOT NULL,
  reason        text,
  until         timestamptz,                  -- NULL = permanent
  created_by    text NOT NULL,                -- 'telegram:<id>' | 'system:flood'
  created_at    timestamptz NOT NULL DEFAULT now(),
  lifted_at     timestamptz,
  lifted_by     text
);
CREATE INDEX user_bans_lookup_idx ON user_bans (subject_kind, subject_id) WHERE lifted_at IS NULL;

CREATE TABLE system_flags (
  key         text PRIMARY KEY,               -- 'global_pause' | 'pause:scout' | 'pause:curator' | 'pause:projector' | 'maintenance_message'
  value       jsonb NOT NULL,
  updated_by  text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fleet_status (
  bot_id        text PRIMARY KEY,             -- scout | curator | projector | warden | kamunati
  state         text NOT NULL CHECK (state IN ('up','degraded','down','unknown')),
  since         timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz,
  last_alert_at timestamptz,
  details       jsonb NOT NULL DEFAULT '{}'
);
```

Rules:

1. All moderation writes happen inside one DB transaction together with an `audit_log` row (`action` examples: `review_approved`, `review_rejected`, `quarantined`, `taken_down`, `restored`, `blocked`, `unblocked`, `user_banned`, `user_unbanned`, `panic_on`, `panic_off`, `mod_added`, `mod_removed`).
2. `audit_log` is append-only. No update or delete code paths. Add a DB-level trigger that raises on UPDATE/DELETE of `audit_log`.
3. Shared repository functions: `isBlocked`, `getActiveBan`, `setModerationState`, `addBlock`, `removeBlock`, `createReport`, etc., each with tests.

### A4.1 `isBlocked` (shared, pure + DB)

```ts
// CONTRACT
export type BlockCheckInput = {
  infohash?: string; tmdbId?: number; source?: string; sourceId?: string; rawName?: string;
};
export type BlockCheckResult = { blocked: false } | { blocked: true; kind: string; value: string; reason?: string };
export function isBlocked(input: BlockCheckInput, list: BlocklistEntry[]): BlockCheckResult;
```

1. `infohash`, `tmdb_id`, `source_id` match exactly (case-insensitive for infohash).
2. `title_contains` matches when `norm(rawName)` contains `norm(value)` as a whole-word sequence. NO regex, to avoid ReDoS.
3. Blocklist is cached in memory 30 seconds per process. Provide `invalidate()` for tests.
4. 25+ unit tests including near-miss titles ("Alien" must not block "Alienation" for a whole-word block).

---

## A5. Changes required in the existing apps and sections

| Where | Change |
|---|---|
| Main §7.1 | Add `WARDEN_BOT_TOKEN`, `MOD_CHAT_ID` and the A9 variables to `.env.example` |
| Main §10.1 queues | Add `review.requested` (Curator → Warden), `report.created` (Projector → Warden). Payloads in §A6.2 |
| Main §12.3 step 6.6 and §12.5 (ScoutBot) | Before inserting a candidate call `isBlocked`. If blocked: insert with `state='blocked'`, do NOT enqueue, count it in the owner summary ("2 blocked by moderation") |
| Main §13.5 (`/addmanual`) | Same block check BEFORE asking for the legality confirmation. Blocked → "This item is blocked by moderation." |
| Main §14.3 (CuratorBot worker) | Re-check `isBlocked` with the matched `tmdbId` and the raw name. Blocked → `state='blocked'`, `reject_reason='blocklisted'` |
| Main §16.1 | After creating a variant: if `candidate.source` is in `MOD_REVIEW_SOURCES`, set `moderation_state='pending_review'` and enqueue `review.requested`; otherwise `active`. Emit `movie.ready` only when the movie has at least one `active` variant |
| Main §17.3, §17.4 (ProjectorBot) | `options` and `play` consider ONLY variants with `moderation_state='active'`. Check `user_bans` for the web `userId` (403 `user_banned`). When `global_pause` or `pause:projector` is on, `play` returns 503 `maintenance` with the stored message. After `streamer.start`, re-read the variant's `moderation_state`; if no longer `active`, stop the stream and return 410 `taken_down` |
| Main §17.2 | Add `POST /api/reports` (§A6.2.4) |
| Main §17.6 | `heartbeat` for a variant that is not `active` returns 410 `{ "error": "taken_down" }` so the web app can stop playback |
| Main §17.4 step 3 and §19.1 | Replace the in-process per-infohash mutex with a Redis lock (`SET lock:stream:<infohash> <token> NX PX 30000`, release with a compare-and-delete Lua script) in `packages/shared`, because WardenBot also stops streams |
| Main §11.5 | `adminOnly()` becomes an alias of `requireRole('owner')`; add `banGuard()` (A6.3) to every Telegram bot's middleware chain |
| Main §22 | Add the acceptance items in §A12 |

---

## A6. WardenBot features

### A6.1 Fleet supervision

#### A6.1.1 Heartbeat contract

Every app (scout, curator, projector, warden) publishes a heartbeat every 15 seconds via a shared helper `startHeartbeat(botId, getInfo)`.

```ts
// CONTRACT
export type Heartbeat = {
  botId: 'scout' | 'curator' | 'projector' | 'warden' | 'kamunati';
  version: string;               // package.json version or git sha
  startedAt: string;             // ISO
  now: string;                   // ISO
  status: 'ok' | 'degraded';
  queues?: Record<string, { waiting: number; active: number; failed: number }>;
  notes?: string[];              // short strings, max 5, max 120 chars each
};
```

Storage: Redis `SET fleet:hb:<botId> <json> EX 45`. If the process cannot reach Redis, it logs and keeps running.

An app reports `degraded` when: its own last Telegram API call failed within the last 60 s, or one of its queues has more than `FLEET_FAILED_JOBS_ALERT` failed jobs, or (Projector) the streamer health call failed.

#### A6.1.2 Evaluation loop

1. Every `FLEET_CHECK_INTERVAL_SECONDS` (default 30) WardenBot reads all `fleet:hb:*` keys.
2. Per bot: key present and `status='ok'` → `up`; key present and `status='degraded'` → `degraded`; key missing → `down` (the key expires after 45 s, so a missing key means at least 45 s of silence); never seen since Warden start and no `fleet_status` row → `unknown`.
3. Hysteresis: a state change is only confirmed after 2 consecutive evaluations with the same result (prevents flapping alerts).
4. On a confirmed change update `fleet_status` and alert the mod chat: `🔴 CuratorBot is DOWN (last seen 14:02:11 UTC)` / `🟡 ProjectorBot is degraded: streamer unreachable` / `🟢 CuratorBot recovered after 6 min`.
5. While a bot stays `down`, re-alert every `FLEET_REALERT_MINUTES` (default 30). Never more often.
6. Include version mismatch warnings (for example Projector reports a different schema version than the others).

#### A6.1.3 Deep health check (`/health`)

Run these in parallel with 5 s timeouts and show one table row each:

| Check | How |
|---|---|
| Postgres | `SELECT 1` |
| Redis | `PING` |
| TMDB | `GET /configuration` (cheap endpoint) |
| Streamer | `diskUsage()` via the shared `StreamerClient` |
| Disk | used vs `DISK_QUOTA_GB`, warn above 85%, alert above 95% |
| Queues | waiting/active/failed per queue, warn on failed above threshold or oldest waiting job older than 10 minutes |
| Telegram tokens | `getMe` for each of the 4 other tokens that WardenBot has (see A6.1.4) |

#### A6.1.4 The external bot @kamunatiprime_bot

Level 1, no code change in the existing bot (requires `KAMUNATI_BOT_TOKEN`, optional):

1. Every 60 seconds call `getMe`. Failure twice in a row → `down` (maybe the token was revoked or Telegram is unreachable; include the error text).
2. Call `getWebhookInfo` when it succeeds. If `url` is non-empty (webhook mode): report `pending_update_count` and `last_error_message`/`last_error_date` (if the last error is recent, state `degraded`). If `url` is empty (long polling), skip.
3. NEVER call `getUpdates`, `setWebhook`, `deleteWebhook`, `sendMessage` or any other mutating method with this token. Allowed methods: `getMe`, `getWebhookInfo` only. Enforce with a tiny wrapper that whitelists those two method names and has a unit test proving others throw.
4. Without `KAMUNATI_BOT_TOKEN` and without a heartbeat, its state is `unknown` and the owner is told once at startup how to enable monitoring.

Level 2, optional heartbeat from the existing bot. Provide this snippet in `docs/KAMUNATI_HEARTBEAT.md` (language-neutral contract plus a TypeScript and a Python example, about 15 lines each). The contract: every 15 s do `SET fleet:hb:kamunati '<Heartbeat JSON>' EX 45` on the shared Redis. Example TypeScript with `ioredis`:

```ts
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL!);
const startedAt = new Date().toISOString();
setInterval(() => {
  const hb = { botId: 'kamunati', version: '1.0.0', startedAt, now: new Date().toISOString(), status: 'ok' };
  redis.set('fleet:hb:kamunati', JSON.stringify(hb), 'EX', 45).catch(() => {});
}, 15_000);
```

Level 3, optional and out of scope unless the owner asks: making the existing bot's magnet ingestion go through the blocklist and legality confirmation (see §A14 question 2).

### A6.2 Content moderation

#### A6.2.1 Review gate

1. Env `MOD_REVIEW_SOURCES` (default `manual`): candidates from these sources need human approval before viewers can play them. Internet Archive and Blender items (license-verified by adapters) default to auto-active.
2. CuratorBot enqueues `review.requested` with payload `{ traceId, tmdbId, variantId }` (idempotent `jobId = review:<variantId>`).
3. WardenBot posts a review card in `MOD_CHAT_ID` (HTML message):

```
🔎 Review needed
<b>Night of the Living Dead (1968)</b> · TMDB 10331
Source: manual · License: user_confirmed
Proof: (none)   Size: 1.2 GB   720p · en
Added by: telegram:123456789
[✅ Approve] [❌ Reject] [📎 Need proof]
```

4. Buttons (callback data `rv:ok:<variantIdShort>`, `rv:no:<variantIdShort>`, `rv:pf:<variantIdShort>`). Role check per §A3.
5. Approve: `moderation_state='active'`, audit row, and if this is the first active variant for the movie, publish `movie.ready` using the shared producer (so ScoutBot notifies the requester).
6. Reject: confirm with a second tap, then `moderation_state='taken_down'`, `state='retired'`, add an infohash block (reason "rejected in review"), stop and remove data on the streamer (§A6.2.3 procedure).
7. Need proof: asks the moderator to reply to the card with a URL; store it in `candidates.license_proof_url`, edit the card to show it. Variant stays `pending_review`.
8. Unreviewed cards: re-post a reminder after 24 hours (once) and include them in the daily digest.

#### A6.2.2 Quarantine versus takedown

| Action | Effect on viewers | Effect on data | Reversible by |
|---|---|---|---|
| Quarantine | Variant hidden from `options`/`play`, active streams stopped | Data kept | moderator (`/restore`) or owner |
| Takedown | Same as quarantine and the title gets `movies.status='taken_down'` when no active variants remain | Data removed from the streamer, infohash and TMDB id blocklisted | owner only (`/restore`) |

#### A6.2.3 Takedown procedure (idempotent, one function `takedownTarget(target, actor, reason)` in shared)

1. Resolve the target (`tmdb id`, `infohash8` prefix, or `variantId8` prefix) to variants. Ambiguous prefix → ask the moderator to be more specific.
2. Show a confirmation message listing exactly what will be affected (movie, variant count, active viewers). Proceed only after the confirm button.
3. DB transaction: set `moderation_state`, `moderated_by/at/reason`, `state='retired'` for takedown, insert blocklist entries (infohash for each variant; also `tmdb_id` when the action targeted the whole movie), update `movies.status` if no `active` variants remain, resolve open reports for these variants (`state='taken_down'`), write `audit_log`.
4. After commit (outside the transaction): acquire the Redis stream lock per infohash (§A5), `streamer.stop`, then for takedown `streamer.remove`, delete `active_streams` rows. Errors are logged and retried by a `moderation.cleanup` BullMQ job (idempotent, 5 attempts). The DB state is the source of truth, so viewers are already blocked even if the streamer call fails.
5. Notify the mod chat with a summary and the `traceId`.
6. `/restore` (owner for takedown, moderator for quarantine): sets `moderation_state='active'`, `state='registered'`, removes the matching blocklist entries, and re-registers on the streamer if its data was removed (`streamer.register`).

#### A6.2.4 Viewer reports

1. ProjectorBot adds `POST /api/reports` (Bearer key like the other routes). Body: `{ "userId": "u_123", "tmdbId": 10331, "variantId": null, "reason": "copyright", "details": "..." }`. Validation: reason from the enum, details max 1000 chars, user must not be banned. Rate limit: 5 reports per user per hour. Response `202` `{ "reportId": "..." }`.
2. ProjectorBot inserts into `reports` and enqueues `report.created` with `{ traceId, reportId }`.
3. If `reason='copyright'` and `MOD_AUTO_QUARANTINE_COPYRIGHT=true` (default true), WardenBot immediately quarantines the reported variants (or all `active` variants of the movie when `variantId` is null) and tells the mods. This protects the owner while a human looks. Quarantine is fully reversible.
4. WardenBot posts a report card with buttons: `Dismiss` / `Quarantine` / `Take down`, plus `Restore` when auto-quarantined and dismissed.
5. Repeated false reports: if one user's reports are dismissed 5 times within 7 days, WardenBot offers a `Ban reporter` button on the next card.

#### A6.2.5 Blocklist management

1. `/block infohash <hex40|hex8-of-known-candidate>`, `/block tmdb <id>`, `/block source <sourceId>`, `/block title <words>` (optional trailing reason after `--`).
2. `/unblock <entryId8>`, `/blocklist [page]`.
3. Blocking an infohash or TMDB id that is already in the catalog asks whether to also quarantine existing variants (button).

### A6.3 User moderation

1. `banGuard()` grammY middleware (shared) runs first in every Telegram bot's chain, including the existing @kamunatiprime_bot only if it is ported to the shared package (§A14). A banned Telegram user gets no reply (silent drop) and the update is logged at `debug`.
2. ProjectorBot checks `user_bans` (`subject_kind='web'`) on `play`, `reports`, `link-codes`. Banned → 403 `{ "error": "user_banned" }`.
3. Flood control (grammY `@grammyjs/ratelimiter` or a small in-house limiter): more than 8 messages in 10 seconds per Telegram user → drop extra messages and reply once "Slow down." A user who trips the limiter 3 times within 10 minutes is muted for `MOD_FLOOD_MUTE_MINUTES` (default 10) by inserting a `user_bans` row (`created_by='system:flood'`, `until` set) and the mods are told. Owners and moderators are exempt.
4. Commands: `/ban <telegramId|web:userId> [minutes] [reason]` (no minutes = permanent), `/mute` (alias requiring minutes), `/unban <id>`, `/bans [page]`.
5. A banned web user's active stream is stopped via the Redis-locked stop procedure and their `viewer_count` contribution is released.

### A6.4 Kill switch and pausing

1. State lives in `system_flags`. Every app starts a shared `FlagWatcher` that reads the table every 5 seconds (cheap, one query) and exposes `isPaused(appId)` and `maintenanceMessage()`.
2. Effects when `global_pause=true` or `pause:<app>=true`:
   - BullMQ workers of that app call `worker.pause()` (let the active job finish) and `worker.resume()` when cleared. Repeatable pollers skip their tick.
   - ProjectorBot `play` returns 503 `maintenance`. Read-only routes (`options`, `progress`, prefs) keep working.
   - Telegram bots answer non-owner commands with "Maintenance in progress." Owners can still use everything.
3. `/panic` (owner): sets `global_pause=true`, alerts the mod chat, writes audit. `/panic hard` additionally stops every active stream through the locked stop procedure.
4. `/resume` (owner): clears `global_pause` and all `pause:*` flags.
5. `/pause <scout|curator|projector>` (moderator), `/maintenance <message>` (owner) sets `maintenance_message` (max 200 chars) shown to viewers.
6. `/status` shows the current flags prominently at the top of `/fleet`.

### A6.5 Audit and daily digest

1. `/audit [n]` shows the last n (default 10, max 30) audit rows in compact form with time, actor, action, subject.
2. Daily digest at `MOD_DIGEST_HOUR` in `MOD_TZ` (defaults in §A9) to the mod chat: new movies, variants by moderation state, reviews pending (with age of the oldest), open reports, takedowns in the last 24 h, bans, fleet incidents (down/degraded transitions), disk usage trend, failed jobs count.
3. `/audit export` (owner) sends a CSV file of the last 30 days (build the file in memory, send as a document, never write secrets, details JSON is included but redacted for any key named like a token).

---

## A7. WardenBot commands (complete list)

| Command | Min role | Behavior |
|---|---|---|
| `/start`, `/help` | any | Help text filtered to the caller's role |
| `/fleet` | viewer | One line per bot: icon, name, state, last seen, version, queue depths. Shows flags at the top |
| `/health` | viewer | Deep check table (§A6.1.3) |
| `/queues` | viewer | Depths for all queues |
| `/failed [queue]` | viewer | Last 10 failed jobs with reason and `traceId` |
| `/replay <queue> <jobId>` | owner | Re-enqueue a failed job |
| `/review` | moderator | Lists pending reviews (10 per page) with Approve/Reject buttons |
| `/reports` | moderator | Lists open reports with action buttons |
| `/quarantine <tmdbId\|variantId8>` | moderator | §A6.2.2 |
| `/takedown <tmdbId\|infohash8\|variantId8> [reason]` | moderator | §A6.2.3 (with confirmation) |
| `/restore <tmdbId\|variantId8>` | moderator for quarantine, owner for takedown | §A6.2.3 step 6 |
| `/block`, `/unblock`, `/blocklist` | moderator | §A6.2.5 |
| `/ban`, `/mute`, `/unban`, `/bans` | moderator | §A6.3 |
| `/pause <app>` | moderator | §A6.4 |
| `/panic [hard]`, `/resume`, `/maintenance <msg>` | owner | §A6.4 |
| `/mods`, `/addmod <telegramId> <role>`, `/delmod <telegramId>` | owner | Manage roles |
| `/audit [n]`, `/audit export` | viewer, owner for export | §A6.5 |
| `/digest` | moderator | Send the digest now |

Command conventions: HTML parse mode, callback data under 64 bytes (main-spec §11.5), destructive actions always need a confirm tap, every mutation writes `audit_log`.

---

## A8. Mod chat setup

1. `MOD_CHAT_ID` is a Telegram group (or private chat with the owner) where cards and alerts are posted. WardenBot must be a member. Review/report/alert cards are posted there; moderators act through buttons or commands.
2. If `MOD_CHAT_ID` is empty, send everything to each owner in a private chat instead.
3. In groups, WardenBot ignores commands from users who are not in the `moderators` table (silent). Callback queries are always role-checked (§A3).
4. Alerts have a severity icon and a `traceId` where applicable. Flood protection on alerts: the same alert text is sent at most once per 10 minutes.

---

## A9. Environment variables (WardenBot)

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `WARDEN_BOT_TOKEN` | yes | | Telegram token |
| `MOD_CHAT_ID` | no | empty | Group or chat id for cards and alerts |
| `KAMUNATI_BOT_TOKEN` | no | empty | Only for `getMe` / `getWebhookInfo` (§A6.1.4) |
| `SCOUT_BOT_TOKEN`, `CURATOR_BOT_TOKEN`, `PROJECTOR_BOT_TOKEN` | no | empty | Optional here, only used for the `getMe` token checks in `/health` |
| `FLEET_CHECK_INTERVAL_SECONDS` | no | `30` | Evaluation loop |
| `FLEET_REALERT_MINUTES` | no | `30` | Re-alert period for a bot that stays down |
| `FLEET_FAILED_JOBS_ALERT` | no | `20` | Failed jobs per queue that marks an app degraded |
| `MOD_REVIEW_SOURCES` | no | `manual` | Sources whose variants need approval (shared with CuratorBot) |
| `MOD_AUTO_QUARANTINE_COPYRIGHT` | no | `true` | Quarantine instantly on a copyright report |
| `MOD_FLOOD_MUTE_MINUTES` | no | `10` | Automatic mute length |
| `MOD_DIGEST_HOUR` | no | `9` | Local hour for the daily digest (0-23) |
| `MOD_TZ` | no | `UTC` | IANA time zone for the digest, for example `Asia/Kolkata` |
| `STREAMER_*` | yes | | Same variables as main-spec §7.5 (WardenBot stops/removes streams) |

Security rules for tokens: the other bots' tokens in WardenBot's environment are a risk. Document this in the README, keep them optional, and redact them from logs. If the owner prefers, WardenBot can run without them and rely on heartbeats only.

---

## A10. Repository and Docker additions

```
apps/
└─ warden-bot/
   └─ src/
      ├─ main.ts
      ├─ bot/            # commands, callbacks, cards
      ├─ fleet/          # heartbeat reader, evaluator, external bot checks
      ├─ moderation/     # review, takedown, blocklist, reports, bans
      ├─ control/        # flags, panic/resume
      └─ digest/
packages/shared/src/
├─ moderation/           # isBlocked, takedownTarget, banGuard, requireRole, repositories
├─ fleet/                # startHeartbeat, Heartbeat schema
└─ control/              # FlagWatcher, Redis stream lock
docs/
├─ KAMUNATI_HEARTBEAT.md
└─ MODERATION_RUNBOOK.md
```

Docker: add service `warden-bot` (build `apps/warden-bot`, no ports except an internal `/healthz`), depends on postgres, redis, migrate. Do NOT mount the Docker socket. Add `warden-bot` to the `test` profile only if integration tests need it.

---

## A11. Tests

| Area | What to test |
|---|---|
| `requireRole` and callbacks | Every command and every callback prefix rejects a user below the required role. Role cache expiry |
| `isBlocked` | 25+ cases (§A4.1) |
| Review gate | Manual candidate → `pending_review`, not in `options`/`play`; approve → active and `movie.ready` once; reject → blocked and removed |
| Takedown | Transaction atomicity, idempotent re-run, ambiguous prefix, streamer failure → DB still blocks and cleanup retries, re-check after `streamer.start` (race), restore path |
| Reports | Validation, rate limit, auto-quarantine on copyright, dismiss, takedown, repeat-false-reporter offer |
| Bans and flood | Silent drop for banned Telegram users, 403 for banned web users, auto-mute after 3 trips, owners exempt, expiry of timed bans |
| Kill switch | Flag change observed within 5 s, workers pause/resume, `play` returns 503, owners still allowed, `/panic hard` stops streams |
| Fleet | Missing heartbeat → down after 2 evaluations, recovery message, re-alert interval, `degraded` conditions, external bot Level 1 (mock Telegram API) and the method whitelist |
| Audit | Append-only trigger rejects UPDATE/DELETE, export redaction |
| Redis lock | Mutual exclusion between ProjectorBot play and WardenBot stop (concurrency test), lock expiry, safe release |

---

## A12. Acceptance criteria (add to main-spec §22)

1. [ ] `/fleet` shows all five bots with correct states. Stopping CuratorBot's container turns it `down` within about 90 seconds and the mod chat gets one alert, then one recovery message after restart.
2. [ ] A manual candidate becomes playable only after a moderator taps Approve.
3. [ ] `/takedown 10331` (with confirm) makes `options`/`play` stop returning that movie, stops an active stream, removes data from the mock streamer, blocklists the infohashes, and writes an audit row.
4. [ ] Re-running `/search` for a blocklisted title does not re-add it ("N blocked by moderation").
5. [ ] A `copyright` report quarantines the title immediately, and `/restore` brings it back.
6. [ ] A banned web user gets 403 `user_banned` from `POST /api/play`. A banned Telegram user gets no replies.
7. [ ] `/panic` makes `play` return 503 `maintenance` within 5 seconds and pauses all workers. `/resume` reverses it.
8. [ ] WardenBot never calls any Telegram method other than `getMe` and `getWebhookInfo` with the @kamunatiprime_bot token (test evidence).
9. [ ] `audit_log` rejects UPDATE and DELETE.
10. [ ] No `docker.sock` mount anywhere in the compose files.

---

## A13. Task breakdown (Phase 3, after the main spec's Phase 2 gate)

| ID | Agent | Task | Depends on | Size |
|---|---|---|---|---|
| TA.0 | Shared agent | Edit §8 migration (A4), add `requireRole`, `isBlocked`, `banGuard`, `startHeartbeat`, `FlagWatcher`, Redis lock | Phase 0 | L |
| TA.1 | Scout agent | Block checks in search/poll/manual flows (A5) | TA.0 | S |
| TA.2 | Curator agent | Block check, review gate, `review.requested`, `movie.ready` rule (A5) | TA.0 | M |
| TA.3 | Projector agent | Moderation filtering, ban check, maintenance mode, reports route, Redis lock (A5) | TA.0 | M |
| TA.4 | Warden agent | Fleet evaluator, external-bot checks, `/fleet`, `/health` | TA.0 | L |
| TA.5 | Warden agent | Review, takedown, restore, blocklist, reports, cleanup job | TA.0 | L |
| TA.6 | Warden agent | Bans, flood control, kill switch, audit, digest | TA.0 | L |
| TA.7 | Infra agent | Dockerfile, compose, docs (`KAMUNATI_HEARTBEAT.md`, `MODERATION_RUNBOOK.md`), integration and e2e tests, §A12 acceptance run | TA.1-TA.6 | L |

---

## A14. Open questions and defaults

| # | Question for the owner | Default until answered |
|---|---|---|
| 1 | Does @kamunatiprime_bot serve only you, or other users too? | Assume only the owner, so user moderation applies to the web app viewers and to ProjectorBot's `/prefs` and `/link` users |
| 2 | Is the existing bot's code Node/TypeScript (can import `@reel/shared`) or something else? And should its magnet-ingest path be routed through the blocklist and legality confirmation? | Do not touch it. Recommend retiring its ingest path in favor of ScoutBot's `/addmanual` |
| 3 | Who are the moderators (Telegram ids) besides the owner? | Owner only |
| 4 | Should Internet Archive and Blender items also need review? | No (`MOD_REVIEW_SOURCES=manual`) |
| 5 | Do you want a public contact/report channel for rights holders (email or form link shown in the web app)? | Out of scope. Reports come through `POST /api/reports` only |

Explicitly OUT OF SCOPE: reading other bots' private chats, restarting containers, moderating third-party Telegram groups, automatic content recognition or fingerprinting, any non-legal source adapter.

END OF ADDENDUM
