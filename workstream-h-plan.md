# Workstream H: Admin Upgrades - Execution Plan

## H.1 Full Title Editing
**UI Modifications:**
- `src/components/admin/MediaEditor.tsx` (or an equivalent new editor): Will be overhauled into a tabbed interface:
  1. **Details**: Add Category (Movie, TV Series, Anime), slug editing, and existing metadata fields.
  2. **Artwork**: Add hover banner upload, hover clip upload, and the palette extraction/override tool with a live `AmbientCanvas` preview.
  3. **Media**: Display current torrents, and add the "Replace torrent or magnet" flow with impact preview.
  4. **Seasons / Episodes**: Existing logic wrapped in a tab.
  5. **Subtitles**: List, upload, replace, shift timing, set default/forced.
  6. **Reviews**: Render the review moderation table filtered by this title.
  7. **Rights**: Existing rights logic.

**API Additions (`src/app/api/admin/titles/...`):**
- `PATCH /api/admin/titles/:id` (extend to handle new details fields)
- `POST/DELETE /api/admin/titles/:id/artwork/hover-banner`
- `POST/DELETE /api/admin/titles/:id/artwork/hover-clip`
- `POST/PUT/DELETE /api/admin/titles/:id/palette` (extract, manual override, reset)
- `PUT /api/admin/titles/:id/media/replace` (torrent replacement mapper)

## H.2 Reviews Moderation
**UI Modifications:**
- **New Page**: `src/app/admin/reviews/page.tsx`
- **Component**: `ReviewModerationTable` (filterable by status, title, user, rating).
- Features row actions: Hide, Restore, Remove, Edit text, Pin, Resolve Reports.

**API Additions (`src/app/api/admin/reviews/...`):**
- `GET /api/admin/reviews` (list all reviews)
- `PATCH /api/admin/reviews/:id` (update status, edit, pin)
- `DELETE /api/admin/reviews/:id` (hard delete for SUPER_ADMIN)
- `POST /api/admin/titles/:id/reviews` (create editorial review)
- `GET /api/admin/review-reports` and `PATCH /api/admin/review-reports/:id`

## H.3 Users: Create, Restrict, Delete
**UI Modifications:**
- Modify existing User table (`src/app/admin/page.tsx` or similar where users are listed).
- Add **Create User Dialog** (with `mustChangePassword` and role selection).
- Add **Restrictions Panel** (Watch Block / Review Block) to user detail drawer.
- Add **Permanent Delete Danger Zone**.

**API Additions (`src/app/api/admin/users/...`):**
- `POST /api/admin/users` (create user)
- `GET/POST /api/admin/users/:id/restrictions`
- `DELETE /api/admin/users/:id/restrictions/:rid` (lift restriction)
- `DELETE /api/admin/users/:id?permanent=true` (permanent deletion transaction creating a `DeletedUserTombstone`)

**Protected Zone Diff Proposal (Stream/HLS/Subs):**
*Note: I will provide the exact diff for the `assertNotRestricted` hook insertion into the stream/HLS handlers for your approval once we reach H.3.*

## H.4 Admin Ambient Background
**UI Modifications:**
- `src/app/admin/layout.tsx`: Mount `<AmbientProvider>` and `<AmbientCanvas />`.
- Use the `admin` focus source when hovering titles/thumbnails.
- Use a glass scrim behind the admin content panels with the `AMBIENT_ADMIN_BRIGHTNESS_CAP`.

---
*Ready to begin execution of H.1 (Title Editing) upon approval.*
