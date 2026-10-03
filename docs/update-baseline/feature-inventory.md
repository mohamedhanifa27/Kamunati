# Feature Inventory

| Feature | Where | How to verify manually | Automated test | Touched by this update? |
| --- | --- | --- | --- | --- |
| Sign in / Auth | `/login` | Click sign in with Google/GitHub credentials | none | Indirectly (password change logic added) |
| Home page / Browse | `/` | Verify hero banner, rows display properly | none | Yes (Navigation, search, profile, sounds, background) |
| Category pages | `/movies`, `/series`, `/anime` | Navigate via top menu | none | Yes (Navigation pill added, Anime filter added) |
| Search | `/search`, Bottom Nav | Open search bar, type query | none | Yes (New Search Card) |
| Title Detail Modal/Page | On clicking a card | Modal opens showing metadata, cast | none | Yes (Reviews added, ambient background focused) |
| Watch Page | `/watch/[id]` | Video player loads, playback controls | none | Yes (Background pause, restriction overlay) |
| Continue Watching | `/` | Row shows progress, resume works | none | Yes (Settings management added) |
| My List | `/list`, Title Modal | Add/remove from list | none | Yes (Settings customization added) |
| Ratings | Title Modal | Click star/thumbs | none | No (Only Reviews added separately) |
| Settings | `/settings` | Open Settings from bottom nav | none | Yes (Completely new implementation) |
| Admin Dashboard | `/admin` | Go to `/admin`, view titles | none | Yes (Hover banner, palette, restrictions, users, delete) |
| User Profile Management | `/profiles` | Manage users | none | Yes (Replaced by single profile) |
