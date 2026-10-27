# Agent Guide

## Architecture Overview

- This is the Beta Cinemas ticket booking website, built as a multi-page application (MPA) without a frontend framework. Each root-level HTML page is a separate entry point and loads its page module with `type="module"`.
- `js/*-page.js` handles page-specific UI and interactions. `js/common.js` contains shared features such as the header/footer, theme, and authentication; `js/i18n.js` handles translations; `js/api.js` groups HTTP requests; and `js/storage.js` syncs the API with LocalStorage and fallback data.
- `style/main.scss` is the SCSS entry point and imports page- and feature-specific partials from `style/`.
- `public/data/*.json` contains static data served at `/data/...`. `db.json` is the json-server database used during development; `db.seed.json` provides seed data for deployment.
- `server.js` is the Bun backend built on json-server and json-server-auth, with additional authentication and business rules. `api/server.js` is the Vercel API entry point.
- `vite.config.js` configures the MPA build, page entries, clean URLs, 404 fallback, and API proxy.

## Development Commands

- Install dependencies: `bun install`
- Run the backend and Vite together: `bun run dev` (Vite usually listens on port 5173 and the API on port 3000).
- Run only the frontend: `bun run dev:client` (start the backend separately for API features).
- Build for production: `bun run build`; preview the build with `bun run preview`.
- The use-case test suite is available via `bun run test:cases`; it requires a running backend and may write to `db.json`.

## Implementation Guidelines

- For a new page, add a root-level HTML entry, register it in `vite.config.js`, and put page logic in a corresponding module under `js/`. Reuse shared helpers instead of duplicating behavior across pages.
- Use `js/api.js` for backend requests and `js/storage.js` for client-side data access and synchronization. Preserve appropriate fallbacks when the API is unavailable; public data can be loaded from `public/data/`.
- When adding or changing data fields, check all related consumers: static JSON, `db.json`, `db.seed.json`, API/storage code, and the UI. Keep formats, IDs, and data relationships consistent.
- Add styles to the appropriate SCSS partial and import it from `style/main.scss`. Maintain support for the `mocha` and `latte` themes and Vietnamese/English translations when changing user-visible text.
- Keep existing LocalStorage keys (usually prefixed with `beta_`) stable, or provide a migration when changing a key or schema.
- Do not edit `dist/` directly; it is build output. Change source files and rebuild when needed.
- Avoid adding dependencies when existing tools or libraries can do the job. The repository has no dedicated lint or formatting configuration, so follow the style of nearby files.

## Verification

- For frontend or build changes, run `bun run build`.
- For API or business-logic changes, start the backend and run `bun run test:cases` when appropriate; note that the suite may modify `db.json`.
- Review `git diff` and the working tree before finishing. Preserve pre-existing user changes.
