# Kamunati 🍿

*Watch what is yours to watch.*

Kamunati is a Netflix-style sequential torrent streaming platform. It allows administrators to host a personalized video streaming service powered entirely by Torrents/Magnet URIs on the backend. The browser receives a standard MP4/WebM stream without needing any torrent client installed on the viewer's device.

## 🏗️ Architecture

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, Framer Motion, Zustand (State), SWR (Caching)
- **Backend:** Fastify, `torrent-stream` (Sequential downloading)
- **Database:** SQLite (managed via Prisma ORM)
- **Design System:** Fully tokenized CSS variable injection for realtime theme swapping without hydration errors.
- **Testing:** Vitest & React Testing Library

## 🚀 Local Development

You can run Kamunati locally using Node.js or Docker.

### Option 1: Native Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Database:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Start the Frontend and Backend concurrently:**
   ```bash
   # Terminal 1 (Next.js UI - Port 3000)
   npm run dev

   # Terminal 2 (Fastify Engine - Port 3001)
   npm run start:engine
   ```

### Option 2: Docker

1. **Build and start the container:**
   ```bash
   docker-compose up --build
   ```

2. Visit `http://localhost:3000`

## 🔒 Production Deployment Checklist

- [ ] Ensure `DATABASE_URL` is set to a persistent volume (or switch Prisma to PostgreSQL).
- [ ] Set `NEXTAUTH_SECRET` to a strong, random 32+ character string.
- [ ] Set `NEXTAUTH_URL` to your production domain (e.g., `https://kamunati.onrender.com`).
- [ ] Ensure your VPS or host has enough bandwidth to seed and leech torrents.
- [ ] Read the `ADMIN_GUIDE.md` for content management.

## ⚖️ Legal Policy (Strictly Enforced)

Kamunati is built exclusively for hosting content the operator has the right to distribute (Own works, Public Domain, Creative Commons). The admin dashboard actively requires a "rights basis" attestation before any torrent can be published.
