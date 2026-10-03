# Workstream E: Profile Page and Single Profile Migration Plan

## 1. Backend and Data
As discovered during Workstream U2 and verified via the `scripts/migrate-single-profile.ts` script, **the database schema is already single-profile**. The `Profile` table does not exist; instead, each `User` acts as their own profile.
- The `scripts/migrate-single-profile.ts` script correctly reports that 0 rows are affected and the migration is a no-op.
- Therefore, there are no database migrations needed.
- We will build the new convenience API endpoints for fetching stats and clearing history: `GET /api/me/profile`, `PATCH /api/me/profile`, `GET /api/me/stats`, `DELETE /api/watchlist`, `DELETE /api/search/history`, and `DELETE /api/history/watched`.

## 2. Frontend: Multi-Profile UI Removal
The only existing multi-profile UI is the mocked `/profiles` page ("Who is watching" screen).
- Under the `featureFlags.singleProfile` flag, we will:
  1. Add a redirect from `/profiles` to `/profile` (the single profile dashboard).
  2. The `Navbar` profile icon and `FloatingNavDock` profile icon will just link straight to `/profile`.
  3. No internal client-side `activeProfileStore` needs to be migrated as it doesn't currently exist.

## 3. Profile Page (/profile)
We will create `src/app/profile/page.tsx` using the ambient background and glass surfaces:
- **Header**: Avatar, display name, email, member since, "Edit" button (linking to `/settings/account`).
- **Stats Row**: Titles watched, hours watched, My List size, reviews written.
- **Three Category Cards**:
  1. **My List**: Preview of thumbnails. "View all" -> `/list`. "Customize" -> `/settings/my-list`. Bin clears `DELETE /api/watchlist`.
  2. **Search History**: Last 5 searches. "View all" opens search. Bin clears `DELETE /api/search/history`.
  3. **Watched list**: Preview of completed titles. Bin clears `DELETE /api/history/watched`.
- **Bin Behavior**: Accessible bin icons will pop up a confirmation dialog before sending the `DELETE` API requests. It will invalidate data via `useSWR` mutate.

## Execution
I am ready to implement this. Awaiting approval to proceed with E.1 and E.2.
