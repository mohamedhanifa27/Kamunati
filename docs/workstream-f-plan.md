# Workstream F: Search Card - Execution Plan

## 1. Existing Assets Context
- **Search UI**: `/search` page (`src/app/search/page.tsx`) renders a full-page search with a large input and a grid of `MediaCard`s.
- **Search API Client**: `useSWR` directly calls `/api/media/search?q=` with a 500ms `use-debounce`.
- **Search API**: `src/app/api/media/search/route.ts` is implemented using Prisma (searching `title`, `originalTitle`, `overview`).
- **Imports**: `FloatingNavDock.tsx` links to `/search`. `ProfileDashboard.tsx` also currently points to `/search` or `/profile/search` for history.

## 2. Plan of Action

### A. The Search Card Overlay Component
Create a new global `SearchCard` component (`src/components/search/SearchCard.tsx`):
- **Visibility State**: Managed via a global Zustand store (`useSearchStore`) so it can be opened from `FloatingNavDock`, the `/` shortcut (handled in `MainLayout`), or the Profile page.
- **Overlay UI**: 
  - Glass card (max 640px wide, 80vh) on desktop, bottom sheet on mobile.
  - Implements motion levels (scale+fade for standard, spring for expressive).
  - Focus trap and ARIA combobox pattern.
- **Input**: Search field with debounce (150ms as per specs) and clear (X) button.

### B. Search Views inside the Card
- **Empty State (Recent & Trending)**:
  - Fetches recent searches via `GET /api/search/history`. Renders them with a remove cross (X).
  - Fetches trending searches via `GET /api/search/trending`.
- **Typing State (Similar & Results)**:
  - Fetches top results via existing `/api/media/search?q=` (limited visually to 6).
  - Fetches suggestions via `GET /api/search/similar?q=`.
  - Highlights matching query text.
  - Footer provides "See all results for 'query'" which routes to the existing `/search` page.

### C. Behavior & History Logic
- **Submission**: Only `Enter`, clicking a suggestion, clicking a result, or clicking a recent search triggers a save to history. Handled by calling `POST /api/search/history`.
- **LocalStorage Migration**: On first load with flag ON, read any old localStorage search history and sync to the server, then clear it.
- **Offline handling**: Use SWR fallback or local state caching.

### D. Backend API Implementation (FULL-STACK MODE)
- **`POST /api/search/history`**: Save search (deduplicate, case-insensitive, cap at 50, update `lastSearchedAt`).
- **`GET /api/search/history`**: Fetch top 20 recent searches.
- **`DELETE /api/search/history/:id`**: Remove single history entry (create new dynamic route).
- **`GET /api/search/trending`**: Aggregate query frequencies over last 7 days.
- **`GET /api/search/similar`**: Prefix matches and genre extraction based on `q`.

### E. Integration
- `FloatingNavDock.tsx`: If `featureFlags.searchCard` is ON, prevent default on the `/search` link and instead call `openSearch()`.
- `MainLayout.tsx`: Add global keydown listener for `/` to open search.
- Tests: Add accessibility and E2E coverage for the card behavior.

*Awaiting approval to begin execution.*
