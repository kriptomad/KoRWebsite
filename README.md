# KOC Digital Core — Kay O'Connell Fishmongers

Enterprise platform for Kay O'Connell Fishmongers (English Market, Cork), built to the
KOC-Digital-Core-Enterprise FRD/PRD: Next.js App Router + Tailwind v4 front end, a first-party
content management system (hero carousel, products, recipes, editorial journal — full CRUD with
image upload), moderated comments, RBAC admin panel, and GDPR Article 17 erasure.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in at minimum ADMIN_SESSION_SECRET and ADMIN_PASSCODE
npm run dev
```

The site works out of the box: content (hero slides, products, recipes, posts), comments, roles,
and the audit log are persisted to a local file-backed store at `.data/db.json`, seeded from
`src/lib/data/seed.ts` on first run. Sign in at `/admin/login` (passcode from `.env.local`) to
manage everything through the Owner's Command Dashboard — no external CMS required. Configure
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` to move persistence to a real Postgres database for a
production deployment (see `src/lib/db/schema.sql`).

## Architecture map (see FRD sections in parentheses)

- `src/app` — App Router routes: home, `/products`, `/recipes`, `/news` (public catalog/blog,
  ISR `revalidate = 300`, §3.1/§4) and `/admin/*` (Owner's Command Dashboard, §5.1), including
  `/admin/content/{hero,products,recipes,posts}` — the first-party CMS CRUD modules (§5.2).
- `src/lib/db/content-store.ts` — the CMS content store: full CRUD for hero slides, products,
  recipes, and posts, dual-mode (Supabase/Postgres when configured, durable file-backed JSON
  otherwise). This is what the admin CRUD UI reads/writes, and what public pages render.
- `src/lib/data/content.ts` — data access layer used by all public pages; reads from
  `content-store.ts` by default, or from Sanity if an operator has deliberately configured it as
  an optional, advanced external CMS swap-in (`src/lib/sanity`).
- `src/app/api/admin/uploads/route.ts` — image upload endpoint backing every CMS image field
  (hero slides, products, recipes, post blocks); validates type/size and stores files under
  `public/uploads`.
- `src/lib/db/file-store.ts` — durable local JSON persistence (`.data/db.json`) shared by
  comments, roles, audit log, and all CMS content — survives dev server reloads/restarts, unlike
  a plain in-memory array.
- `src/lib/db` — Supabase-backed (or file-backed fallback) stores for comments, RBAC roles, the
  audit log, and CMS content (§3.3, §5.3), plus `schema.sql` for the Postgres schema.
- `src/lib/rbac.ts` — permission catalog + default roles for the Access Control Matrix (§5.3).
- `src/proxy.ts` — Edge Proxy (formerly "middleware") enforcing 3 comments / 10 min / IP (§4.5).
- `src/components/hero/HeroCarousel.tsx` — IntersectionObserver-paused, cubic-bezier carousel (§4.1).
- `src/components/recipes` — faceted filter grid, portion scaler, step checklist (§4.3).
- `src/components/blog/BlockRenderer.tsx` — block-based layout builder (image grid, pull quote,
  rich text, embedded product cards) (§4.4), authored via the admin Editorial Journal block builder.
- `src/components/seo/JsonLd.tsx` + `src/lib/metadata.ts` — OpenGraph/Twitter metadata and
  Recipe/Article/LocalBusiness JSON-LD (§4.4, §6).

## Known limitations (demo scope)

- **Admin auth** (`src/lib/auth/session.ts`) is a single shared passcode signing in as the Owner
  role via a signed, httpOnly cookie — a stand-in for a real auth provider (NextAuth / Clerk /
  Supabase Auth) mapping individual staff accounts to roles.
- **File-backed store** (`src/lib/db/file-store.ts`) is used for comments/roles/audit/CMS content
  only when Supabase env vars are unset. It's durable (survives restarts, consistent across all
  routes) but is a single JSON file on disk — fine for local/demo use and single-instance
  deployments; configure `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` for multi-instance/production
  durability and concurrency.
- **Uploaded media** is written to `public/uploads` on local disk — fine for a single-instance
  deployment, but won't survive ephemeral/serverless filesystems or scale across instances; swap
  the upload route for a cloud object store (S3, Sanity assets, etc.) for that scenario.
- **Rate limiting** (`src/lib/rate-limit.ts`) is in-memory per isolate; back it with a shared
  store (e.g. Upstash Redis) for a hard guarantee on multi-instance edge deployments.
- **GDPR erasure** is exposed only to staff with the `gdpr.manage` permission (not as a public
  endpoint), to prevent anyone purging another person's data by just knowing their email.


