# Warshati — Roadmap

Design principles (do not violate): Arabic-first/RTL · mobile-first (360px) · voice notes & photos everywhere · big tap targets · offline-first · one primary action per screen · huge readable numbers · optimistic UI (no spinners as primary UX) · confirm only destructive actions.

## Foundation — DONE (this build)
- Vite + TS + Tailwind (RTL, Cairo font, shadcn tokens), `<html dir=rtl lang=ar>`
- i18n (ar/en) with live RTL/LTR switching
- Supabase client; TanStack Query persisted to IndexedDB (offline-first); online/sync indicator
- App shell: bottom tab nav (Home/Customers/Jobs/Inventory/More), max 5 tabs
- Auth (email/password) + 3-minute onboarding wizard (shop name → language → KWD)
- **Phase 1 schema + RLS + Storage** migration (multi-tenant by `business_id`)
- PWA manifest + service worker; GitHub Pages CI

## Phase 1 — MVP (next, build in order)
1. Customers + vehicles CRUD (voice note + photo attachments, fuzzy search by name/phone/plate)
2. Job → invoice flow (line items: labor/part/service/resale; complaint voice; photos; complete → invoice → WhatsApp share)
3. Inventory list + add item (photo, low-stock, track-stock toggle, stock adjustment)
4. Expenses (quick add, monthly total, recurring suggestions)
5. Daily close (revenue / cash / KNET / credit / profit / pending) — the owner's daily ritual
6. Dashboard (week/month revenue, top customers/items, profit) with drill-through
7. Cross-cutting: `useVoiceRecorder`, `useCamera` (client compression ~200 KB), `useOfflineQueue` write queue

## Phase 2
WhatsApp 1:1 (invoice send, service reminders), quotation approval flow, supplier credit, vehicle service-history report, multi-user roles UI.

## Phase 3
WhatsApp Business API templates, advanced analytics (slow inventory, churn), Bluetooth thermal printing (needs Capacitor), loyalty.

## Known follow-ups
- Phone OTP auth once an SMS provider (Twilio/MessageBird) is configured in Supabase.
- Generate proper PNG/maskable PWA icons (placeholder SVG for now).
- Custom "Add to Home Screen" prompt UI.
