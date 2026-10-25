# Workstream G: Reviews - Execution Plan

## 1. Title Detail Component Analysis
I audited the codebase for existing title detail components (modal and page) and "More like this" sections.
**Finding:** The U1/U2 baseline currently *does not* have a dedicated title page (e.g., `/title/[id]`) or a title detail modal. `MediaCard` and `HeroBanner` link directly to `/watch/[id]`, and the `HoverBanner`'s "More Info" button is currently a stub.

## 2. Proposed Layout & Placement
Since no title page exists, I will construct a new **Title Page** at `src/app/title/[id]/page.tsx` that serves as the home for title details and reviews.

**Proposed Layout (Top to Bottom):**
1. **Hero Header:** Large backdrop, title, metadata (year, category, rating, runtime), and primary actions (Play, Add to List).
2. **Metadata & Synopsis:** Cast, crew, and plot summary.
3. **More Like This:** A `MediaRow` displaying similar titles (reusing our existing component).
4. **Reviews (The New Section):** Placed exactly *after* "More like this", matching the spec.

**The Reviews Section itself will include:**
- **Summary Header:** Average stars (to 1 decimal), total review count, and a 5-to-1 star distribution bar.
- **Controls:** Sort dropdown (Newest, Top rated, Lowest rated), star filter, and "Hide spoilers" toggle.
- **Write Form:**
  - If signed in and no review exists: Star input, text area (10-1500 chars), spoiler checkbox, and Submit.
  - If signed in and blocked (REVIEW_BLOCK): Calm notice with reason and expiry.
  - If already reviewed: Display the user's review at the top with "Edit" and "Delete" actions.
- **Review List:** Author details, stars, date, body, spoiler tag, and "Report" action (for others). Pinned/Editorial reviews will be labeled and pinned to the top.

## 3. Backend Implementation (Full-Stack Mode)
- **Migrations:** Denormalize `reviewCount` and `ratingAverage` onto the `Media` model in `schema.prisma`.
- **Endpoints:**
  - `GET /api/titles/:slug/reviews` (fetch reviews with pagination, sort, and filter)
  - `POST /api/titles/:slug/reviews` (create review, sanitize, check block, rate limit)
  - `PATCH /api/reviews/:id` (edit review)
  - `DELETE /api/reviews/:id` (delete review)
  - `POST /api/reviews/:id/report` (report review)
  - `GET /api/user/reviews` (My Reviews page at `/profile/reviews`)
- **Sanitization & Escaping:** Strict HTML stripping and length checks before DB insert. No `dangerouslySetInnerHTML`.

## 4. Wiring
- Connect the `SearchCard` and `HoverBanner` "More Info" buttons to route to the new `/title/[id]` page.
- Add `/profile/reviews` as a simple list linked from the Profile stats row.
