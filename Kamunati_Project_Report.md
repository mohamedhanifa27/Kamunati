---
title: "Kamunati: Comprehensive Project Report & Architecture Document"
author: "Antigravity Engineering"
date: "October 2026"
geometry: margin=2cm
---

# 1. Introduction

## 1.1 Purpose
This document provides a comprehensive, deep-dive analysis of the **Kamunati** project (codenamed `torrent-stream-engine`). It serves as a Software Design Document (SDD), a Software Requirements Specification (SRS), and a progress report for the current "Live Admin Console Edition" rebuild. 

## 1.2 Scope
Kamunati is a production-grade sequential torrent streaming engine and media proxy. It bridges the gap between decentralized P2P file sharing (BitTorrent) and modern, seamless web streaming (HLS, MP4 proxying). The web application provides a Netflix-like user experience for viewers, while providing administrators with a highly advanced, WebGL-powered, real-time command center.

## 1.3 Definitions and Glossary
- **Live / Unlive:** The visibility status of media to viewers. Live means `PUBLISHED`. Unlive means hidden but intact in the database.
- **Activity (User):** An action a user may perform: sign in, watch, review. 
- **Restriction:** An admin-applied ban on one specific activity, optionally with an expiry.
- **Presence:** The online state and current media ID a user is interacting with.
- **Broadcast:** An admin-sent notification to all users or a specific user.
- **Admin Alert:** An automatic system notification triggered by application state changes.
- **Swarm Peers:** External global peers connected to a torrent hash.
- **Viewers:** Signed-in Kamunati users actively watching media in the app.
- **ThreeUI:** A proprietary, highly optimized WebGL/Three.js UI library used for advanced visual rendering.

---

# 2. System Architecture

Kamunati is built on a hybrid architecture, separating the heavy, stateful P2P engine from the stateless React frontend, yet combining them into a cohesive monorepo.

## 2.1 Technology Stack
- **Frontend (Viewer & Admin):** Next.js 14+ (App Router), React 19, Tailwind CSS v4, Framer Motion.
- **WebGL & Shaders:** Three.js, ThreeUI (vendored), custom GLSL shaders (Liquid Metal, Neuform, Data Pixel Arc).
- **Backend API:** Fastify (for high-throughput streaming and API routes), Next.js Server Actions.
- **Database:** PostgreSQL (assumed), managed via Prisma ORM (`@prisma/client`).
- **Torrent Engine:** `torrent-stream`, `fluent-ffmpeg` (transcoding, probing), `mime-types`.
- **Testing:** Vitest, React Testing Library.

## 2.2 Core Modules
1. **The Streaming Engine (`src/engine/`):** The heart of the application. It connects to the DHT network, resolves magnet links/torrents, prioritizes pieces sequentially (so the start of a video downloads first), and proxies the binary stream to the frontend via HTTP or HLS.
2. **The WebUI (`src/components/`, `src/app/`):** The client-facing application.
3. **The Admin Console (`src/routes/admin/`):** The protected area for managing the ecosystem.

---

# 3. The Live Admin Console Rebuild (Current Phase)

The current development cycle is entirely focused on the "Live Admin Console Edition." The objective is to rebuild the admin side without breaking any existing viewer features. 

## 3.1 Design Language & Theming
The new admin shell adopts a strict **Pitch Black** theme with a specific **Violet Accent**. The design heavily incorporates 3D spatial elements and hardware-accelerated motion, stepping away from standard flat web design.

## 3.2 The Sable Dock (`adminDock`)
The traditional horizontal or static sidebar navigation has been completely replaced. The new navigation is a **Vertical Sable Dock**—a ThreeUI component that acts as a fluid, physics-based sidebar for moving between admin dashboards. 

## 3.3 Real-Time Telemetry & Dashboards (`adminLiveCards`)
A major constraint of the new admin console is **Data Integrity**. 
- Dashboard cards are strictly read-only.
- All numbers are computed from real database metrics.
- The system uses a Snapshot + Delta sequence mechanism. The client receives a full state snapshot on load, followed by small numerical deltas.
- If a sequence drops, the client immediately refetches the snapshot. 
- *Constraint:* The use of `Math.random` or mocked placeholder arrays is strictly banned.

## 3.4 Torrent Health Graphing (`adminTorrentLive`)
Admins have access to a live, real-time graph of every active torrent's health. 
- Searchable by TMDB ID or title.
- Displays two distinct metrics: **Swarm Peers** (external seeders/leechers) and **Viewers** (internal users currently streaming).

## 3.5 Media Management & Activity Bar (`adminAddMediaV2`, `adminActivityBar`)
The ingestion pipeline has been modernized:
- **Add Media Flow:** The legacy privacy/rights step is removed. The flow now terminates with a comprehensive "Overview Card" summarizing the media.
- **Supported Sources:** Telegram channel torrent files, local device uploads, and manual magnet links.
- **Activity Bar:** A docked bottom bar lists all uploaded, modified, and removed media with timestamps. Admins can toggle media "Live/Unlive" directly inline without opening a detail card.

## 3.6 User Management & Security (`closedSignup`, `dualLogin`)
Kamunati is transitioning to a closed ecosystem.
- **No Public Signup:** The signup page is disabled. Accounts are created exclusively by administrators.
- **Access Control:** Admins can add, remove, ban, and unban users. Bans are granular (e.g., banning a user from reviewing, but allowing them to watch).
- **Dual Login:** Users are given an initial password by the admin. After their first successful login, they can link an OAuth email account (e.g., Google) to the same ID. Both methods will continue to work side-by-side.

## 3.7 Notifications & Broadcasting (`adminAlerts`, `adminBroadcast`)
- **Admin Alerts:** A catalog of events (e.g., engine failure, new user added) triggers automatic notifications to the admin dashboard.
- **Broadcasts:** Admins can push critical messages either to a specific user or broadcast them globally to all connected viewers.

---

# 4. User Interface & WebGL Integration (ThreeUI)

Kamunati's UI is highly advanced, utilizing WebGL for rendering interactive elements rather than standard DOM manipulation. 

## 4.1 Strict Integration Rules
The integration of ThreeUI is governed by extreme constraints to ensure stability:
- Vendored files in `src/vendor/threeui/` are immutable and byte-for-byte verified via SHA-256 in CI.
- The dock requires `three` r128.
- Customizations are achieved via Adapters and documented in `FORKS.md`.
- Fallbacks are strictly enforced for users with `prefers-reduced-motion` enabled.

## 4.2 Implemented Shaders
- **Data Pixel Arc:** Used for circular data visualization (likely torrent health).
- **Liquid Metal Button:** Interactive CTA buttons with fluid dynamics.
- **Neuform Isolated:** Spatial, soft-shadow 3D paneling.
- **Predictive Arc & Ribbon Field:** Background ambient and tracking visualizations.

---

# 5. Torrent Engine Core Capabilities

The backend engine (`src/engine/torrentEngine.ts`) is the critical protected zone of the application.

## 5.1 Sequential Streaming
Standard torrent clients download pieces randomly to maximize swarm health. Kamunati forces the engine to download pieces *sequentially* (piece 0, 1, 2...). This allows the proxy server to begin piping the video stream to the frontend video player almost instantly, long before the file is fully downloaded.

## 5.2 Transcoding & Subtitles
- Uses `fluent-ffmpeg` to probe video files (checking codecs, resolution, bitrates).
- Real-time transcoding for unsupported web formats (e.g., MKV/HEVC to MP4/H.264) via `src/engine/transcoder.ts`.
- Subtitle extraction and conversion (`src/utils/vtt.ts`) to serve VTT tracks to the web player.

---

# 6. Database & State Management

## 6.1 Prisma Schema (Inferred)
The application utilizes `@prisma/client` to manage relational data. The core tables include:
- **User:** Manages authentication, roles (ADMIN, VIEWER), and bans.
- **Media:** Stores TMDB metadata, torrent hashes, and `Live/Unlive` status.
- **WatchProgress:** Tracks timestamps for "Continue Watching" functionality.
- **Reviews/Ratings:** User interaction data.
- **Telemetry/Logs:** Stores historical metrics for the admin dashboard.

## 6.2 Client State
The frontend relies heavily on `zustand` (`src/store/searchStore.ts`, `src/store/themeStore.ts`) for global state, combined with `swr` for real-time data fetching and caching of the Fastify API routes.

---

# 7. Quality Assurance & Testing

## 7.1 Testing Stack
The project uses `vitest` for fast, ESM-compatible unit testing, alongside `@testing-library/react`.

## 7.2 Current Test Suite Status
As of the latest CI run, the test suite requires realignment with the rapidly evolving Admin Console codebase:
- Tests expect legacy text labels (e.g., "Home", "Admin"), whereas the UI has migrated to sleek, icon-only WebGL interfaces.
- The introduction of hardware-accelerated sound APIs (`AudioContext`) and Next.js view transitions require updated mock environments in the JSDOM testing configuration.
- The core engine tests require path resolution fixes to prevent testing the compiled `dist/` directory alongside `src/`.

---

# 8. Conclusion

Kamunati represents a cutting-edge fusion of P2P networking and highly polished, WebGL-driven web development. The current phase—rebuilding the Admin Console—is a massive undertaking that significantly elevates the operational capabilities of the platform. By adhering strictly to the constraints outlined in `AGENTS.md`, the platform is evolving into a secure, real-time, aesthetically premium media proxy without compromising the stability of the underlying torrent engine.
