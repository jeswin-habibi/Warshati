# ورشتي · Warshati

Mobile-first, **Arabic-first (RTL)**, offline-capable PWA for managing small mechanic shops in Kuwait — customers, vehicles, jobs/invoices, inventory, expenses, and a daily close. Built to replace the paper notebook, not add to it.

## Stack
- **React + TypeScript + Vite**, **Tailwind CSS** + shadcn-style components (RTL via logical properties)
- **Supabase** — Postgres, RLS (multi-tenant), Auth, Storage, Realtime
- **TanStack Query** (server state, IndexedDB-persisted → offline-first) + **Zustand** (UI state)
- **React Hook Form + Zod**, **i18next** (ar primary / en), **vite-plugin-pwa** (Workbox)
- Hosted on **GitHub Pages**. Capacitor-ready (no browser-only API without a fallback) for future native wrap.

## Getting started
```bash
npm install
cp .env.example .env      # fill in your Supabase URL + anon key
npm run dev
```

### Supabase setup
1. Create a project at supabase.com.
2. In **SQL Editor**, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) (schema + RLS + the private `media` Storage bucket).
3. **Auth → Providers → Email**: keep enabled. (Phone OTP is wired later once an SMS provider is configured.)
4. Copy **Project URL** + **anon public key** (Settings → API) into `.env`.

## Scripts
- `npm run dev` — local dev server
- `npm run build` — type-check + production build (`dist/`)
- `npm run preview` — preview the build

## Deployment
Pushing to `main` triggers `.github/workflows/deploy.yml` → builds with the `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` repo secrets → publishes to GitHub Pages at `/Warshati/`.

## Structure
```
src/
  app/        session provider + routing/gating
  components/ shell, sync status, shared UI (components/ui = shadcn-style)
  features/   auth, onboarding, dashboard, customers, jobs, inventory, more
  hooks/      useOnlineStatus (useVoiceRecorder/useCamera/useOfflineQueue next)
  lib/        supabase, i18n, queryClient (offline persist), format (KWD/dates), utils
  locales/    ar.json (primary), en.json
supabase/migrations/  SQL (schema, RLS, storage)
```

See [ROADMAP.md](ROADMAP.md) for the build plan.
