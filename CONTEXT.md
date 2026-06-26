# Warshati — Project Context (read this first)

Living reference for the Warshati app. If you're picking this up cold, read this top-to-bottom; it
captures the architecture, decisions, conventions, and what's done vs pending. See also
[README.md](README.md) (setup) and [ROADMAP.md](ROADMAP.md) (phase plan).

---

## 1. What it is
**Warshati (ورشتي)** — a mobile-first PWA to run a small **mechanic shop in Kuwait**: customers &
vehicles, jobs → invoices, inventory, expenses, a daily close, an analytics dashboard, and
growth tools (follow-ups / collections / profit). Multi-tenant (each shop is isolated). Built to
replace the paper notebook.

- **Repo:** https://github.com/jeswin-habibi/Warshati (public, owner GitHub `jeswin-habibi`)
- **Live:** https://jeswin-habibi.github.io/Warshati/ (GitHub Pages, served under `/Warshati/`)
- **Demo login:** `owner@warshati.app` / `warshati123` &nbsp; ⚠️ _throwaway demo account — rotate/remove before any real use._

## 2. Stack
- **React 19 + TypeScript + Vite 8**; **Tailwind v3** (RTL via logical properties `ps-/pe-/ms-/me-/start-/end-`, **Cairo** font, shadcn-style CSS-var tokens). UI components in `src/components/ui` are **hand-written** shadcn-style (no shadcn CLI). `class-variance-authority` for variants.
- **Supabase** — Postgres + RLS (multi-tenant), Auth (email/password), Storage (private `media` bucket).
- **TanStack Query** for server state, **persisted to IndexedDB** (`idb-keyval`) → offline-first reads; `networkMode: 'offlineFirst'`. **Zustand** available for UI state (lightly used).
- **i18next** (`react-i18next`, `i18next-browser-languagedetector`) — **English default**, Arabic on explicit selection.
- **vite-plugin-pwa** (Workbox, autoUpdate), **browser-image-compression**, **lucide-react**, **react-router-dom** (`BrowserRouter basename="/Warshati"`).
- **Capacitor-ready**: no browser-only API without a guard (e.g. `useVoiceRecorder.supported`).

## 3. Deployment & CI
- `.github/workflows/deploy.yml` → on push to `main`: `npm ci` → `npm run build` → GitHub Pages. Node 24, actions checkout@v6 / setup-node@v6 / upload-pages-artifact@v5 / deploy-pages@v5.
- Build needs repo **secrets** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (already set in GitHub Actions). Same values live in local `.env` (gitignored).
- `vite.config.ts`: `base: '/Warshati/'`, `@` alias → `src`, PWA manifest scoped to `/Warshati/`.
- **To deploy:** commit + push to `main` (auto-deploys). Verify: `gh run watch <id>`.

## 4. Supabase
- Project ref **`wwmkdtxelbupmqepoabo`**, URL `https://wwmkdtxelbupmqepoabo.supabase.co`. **Email confirmation is OFF** (so signup logs in immediately).
- Keys are **not committed** — in `.env` (local) and GitHub Actions secrets. The anon key ships in the client bundle (that's expected; RLS protects data).
- **Schema:** `supabase/migrations/0001_init.sql` — run once in the SQL editor on a fresh project. Creates 20 tables, indexes, `updated_at` triggers, RLS, the private `media` Storage bucket + policy.
  - Helper fns (security definer): `is_member(bid)`, `has_role(bid, …roles)`, `set_updated_at()`. **They're defined AFTER `business_users`** (LANGUAGE sql bodies validate at create time — don't move them before that table).
- **Migration `0002_customer_name_en.sql`** adds `customers.name_en` (bilingual names). **May not be applied yet** — see Pending.
- **RLS model:** most business tables = any member (`is_member(business_id)`); `invoices`/`payments` = owner+cashier; `expenses`/`expense_categories` = owner only; `businesses` insert = any authed user, update = owner; `business_users` insert allows self-join (onboarding) or owner; Storage `media` gated by first path folder = `business_id`.
- **Onboarding RLS gotcha:** `businesses` row id is generated **client-side** and inserted **without** `.select()` — an `INSERT … RETURNING` would be filtered by the SELECT policy before the owner's `business_users` membership exists.

## 5. Auth
Email/password (`supabase.auth`). `SessionProvider` (`src/app/session.tsx`) tracks the session.
`App.tsx` gates: loading → spinner; no session → Login; session but no business → Onboarding; else
→ AppShell. **Phone OTP deferred** (needs an SMS provider configured in Supabase).

## 6. Repo structure
```
src/
  app/         App.tsx (routing + auth/business gating), session.tsx (SessionProvider/useSession)
  components/  AppShell (5 bottom tabs + SyncStatus), ScreenHeader, Picker (generic searchable),
               StatusBadge, VoiceNote, PhotoGrid (job photos), PhotoField (single photo), Thumb
               (signed-url/direct image), Placeholder, ui/ (button,input,label,card,spinner,select,textarea)
  features/
    auth/        LoginPage
    onboarding/  OnboardingWizard
    businesses/  useBusiness (single source for current business + id)
    customers/   CustomersPage, CustomerForm, CustomerDetailPage, VehicleForm, api.ts, types.ts
    jobs/        JobsPage, JobForm, JobDetailPage, LineItemForm, api.ts, types.ts
    inventory/   InventoryPage, ItemForm, AdjustStock, api.ts, types.ts
    expenses/    ExpensesPage, ExpenseForm, api.ts, types.ts
    dailyclose/  DailyClosePage
    dashboard/   HomePage (the dashboard), api.ts (useInvoices, useLineItems)
    insights/    FollowUpsPage, MoneyOwedPage, ProfitPage, api.ts
    more/        MorePage (menu + language toggle + sign out)
  hooks/       useOnlineStatus, useVoiceRecorder (MediaRecorder, 60s cap), useCamera (compressImage)
  lib/         supabase, i18n, queryClient (offline persist), format (KWD/dates), loc (locName),
               whatsapp (waLink), utils (cn)
  locales/     ar.json, en.json   (keep keys in sync — English falls back to itself, not Arabic)
supabase/migrations/  0001_init.sql, 0002_customer_name_en.sql
scripts/seed-demo.mjs   demo seeder (GITIGNORED — has the demo login)
```

## 7. Data model (Phase 1)
Multi-tenant by `business_id`. Tables: `businesses`, `profiles`, `business_users` (role
owner|mechanic|cashier), `customers` (+`name_en` via 0002), `vehicles`, `service_types`,
`suppliers`, `inventory_items`, `inventory_movements`, `purchases`, `purchase_items`, `jobs`,
`job_line_items` (type labor|part|service|resale; `inventory_item_id` links a part to stock),
`job_attachments` (photo|audio|document), `invoices` (`INV-####`, balance/paid_amount),
`payments`, `expense_categories`, `expenses`, `activity_log`.

## 8. Features built (all of Phase 1 + extras)
- **Onboarding** wizard (shop name → language → KWD) generating the business + owner membership.
- **Customers + Vehicles**: CRUD, fuzzy search (name/phone/plate), voice note on a customer, bilingual name (`name_en`), localized display.
- **Jobs → Invoice**: create (customer/vehicle Picker + complaint) → line items (labor/part/service/resale; **parts pickable from inventory** → links `inventory_item_id`, autofills localized name + sell price) → **photos** → **Complete** generates an invoice **and deducts stock** for tracked linked parts (+ `inventory_movement`) → **WhatsApp share**.
- **Inventory**: list (search, localized names, photo thumbnail, low-stock), add/edit item (bilingual name, cost/sell, track-stock toggle, min alert, **photo via PhotoField**), **stock adjust** (in/out + reason → movement).
- **Expenses**: add/edit (category, amount, date, recurring), monthly total.
- **Daily Close**: today revenue / expenses / net + outstanding.
- **Dashboard (Home)**: month revenue + MoM %, net profit + revenue/expense bars, 14-day mini bar chart, KPI grid (jobs / avg invoice / new customers / outstanding), job pipeline, top customers, top parts, low-stock; **CTA cards** (follow-ups due count, money owed). Inline CSS/SVG charts — **no chart library**.
- **Growth tools** (`insights/`): **Follow-ups** (customers not seen 75+ days → one-tap WhatsApp), **Money owed** (unpaid invoices → WhatsApp + **Mark paid** records a payment), **Profit** (gross profit + margin% + most-profitable items, parts cost joined from inventory).
- **Media**: voice (webm/opus, 60s) + photos (compressed ~200 KB) → private Storage `media/<business_id>/<yyyy>/<mm>/…`, displayed via short-lived signed URLs.

## 9. Conventions & key helpers
- **`locName(primary, secondary)`** (`src/lib/loc.ts`): English → `secondary || primary`; Arabic → `primary || secondary`. Customers = `locName(name, name_en)`; inventory = `locName(name_ar, name_en)`. Re-evaluated per render (components use `useTranslation`, so they re-render on language change).
- **`waLink(phone, text)`** (`src/lib/whatsapp.ts`): `wa.me` link, normalizes Kuwait 8-digit → `+965`.
- **`format.ts`**: `formatMoney` (KWD, **3 decimals**, `ar-KW`/Latin), `formatNumber`, `formatDate` (Kuwait).
- **IDs are generated client-side** (`crypto.randomUUID()`) for inserts to dodge the RLS `RETURNING` issue and keep optimism simple.
- **Mutations invalidate on success** (not full optimistic yet). Reads cached + offline via TanStack persist.
- **i18n:** `fallbackLng: 'en'`, detection `['localStorage']` only (no navigator auto-detect), `load: 'languageOnly'`. `<html dir>` flips to RTL only for Arabic (`applyDir`). **Keep ar.json / en.json keys in parity.**
- **Tailwind:** mobile-first, `max-w-md` column, min 44px tap targets (`.tap`), big numbers (`.stat-number`), `rtl:` variant where needed.

## 10. Demo data
`scripts/seed-demo.mjs` (gitignored) signs in as the demo owner, **wipes** the business's data, and
seeds ~5 months: 12 customers (+EN names if `name_en` exists), vehicles, 15 inventory items (with
emoji-tile photos), jobs (weighted recent, ~82% completed), line items, invoices (≈80% paid),
payments, expenses. Run: `node scripts/seed-demo.mjs`. It **probes** for `customers.name_en` and
seeds bilingual if present, English-only otherwise.

## 11. Decisions & preferences (don't re-litigate)
- **Hosting = GitHub Pages.** User declined Cloudflare and **won't pay / create new accounts** → always prefer free tiers + existing accounts.
- **Commits carry only the user's name — NO Claude/AI attribution** (applies to all the user's repos).
- **English is the default language;** Arabic only when explicitly selected.
- Forms use plain controlled inputs (RHF + Zod deferred); optimistic UI deferred.

## 12. Pending / deferred (next candidates)
- **Run `0002_customer_name_en.sql`** then re-run the seeder for bilingual customer names (demo customers are currently English-only until then).
- **Payment capture at job-complete** (cash/KNET/credit split). Today invoices are created unpaid; "Mark paid" exists in Money owed.
- **Durable offline write-queue** (IndexedDB outbox) — currently only TanStack offline-first retry.
- RHF+Zod, optimistic UI, service-catalog UI, complaint voice in job form, real **PWA icons** (placeholder `public/icon.svg`), **phone OTP**, profit date-filter, smart reorder / slow-stock alerts, evening WhatsApp summary, quotes/approval flow, multi-user roles UI, vehicle service history, mechanic productivity.

## 13. Common commands
```bash
npm install
cp .env.example .env          # fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev                   # local
npm run build                 # tsc -b && vite build
git push origin main          # deploy (GitHub Pages)
node scripts/seed-demo.mjs    # (re)seed demo data
```
