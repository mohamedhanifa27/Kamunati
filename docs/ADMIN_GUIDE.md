# Kamunati Admin Guide 👑

Welcome to the Admin Dashboard of Kamunati. This guide explains how to upload media and manage your platform.

## 🔑 Accessing the Dashboard
Log in with your administrator account (the first account created, defined by `ADMIN_EMAIL` in `.env`). Navigate to your profile menu and click **Admin Dashboard**, or go directly to `/admin`.

## 🎬 Uploading Media

Kamunati streams media via torrents, meaning you do not upload MP4 files directly to the server. Instead, you provide a `.torrent` file or a Magnet URI.

1. **Go to `/admin/media/new`**
   Click the "Add New Media" button on the Admin Dashboard.

2. **Step 1: The Basics (TMDB Import)**
   Enter a TMDB ID (e.g., `155`) for the movie or TV show. Kamunati will automatically pull the title, overview, poster, and backdrop artwork via the `/api/admin/media/import-tmdb` endpoint.

3. **Step 2: Media Type**
   Select whether the content is a **Movie** or a **TV Series**. For TV series, you will be prompted to map files to Season/Episode numbers.

4. **Step 3: Torrent Source**
   Paste your **Magnet URI** or upload a `.torrent` file.
   *Note: For the fastest streaming experience, ensure your torrent has high seeders.*

5. **Step 4: Rights Attestation**
   Select the legal basis for your right to distribute this content (e.g., Public Domain, Creative Commons, or Self-Owned). **This step is strictly enforced.**

6. **Publish!**
   Once submitted, Kamunati's Fastify Engine will immediately verify the torrent metadata. It is now instantly available for streaming by your users.

## ⚙️ Managing Users & Preferences

- Users can modify their theme, fonts, and animation levels from `/settings/appearance`.
- Watch progress and 5-star ratings are automatically synced to the backend and tracked under your admin KPI metrics.
- Keep an eye on the "Pending Torrents" card on the dashboard to ensure the engine is properly leeching metadata.

## 🛠️ Troubleshooting Streaming

If a video fails to play on the `/watch/[id]` page:
1. Ensure the magnet link is still alive (has seeders).
2. Check the Fastify Engine logs (`npm run start:engine` or Render logs) for `torrent-stream` timeout errors.
3. Verify that the correct `fileIndex` was selected if the torrent contains multiple files (e.g., subtitles, NFO files, and the MP4). Kamunati defaults to the largest file, which is usually correct.
