# SiteCraft AI — public AI website builder

A complete, redesignr.ai-style framework: paste a **URL**, upload a **screenshot**, or **describe** a site → AI generates
multiple complete designs → edit with **prompts** or a **visual click-to-edit** editor → **export** HTML/Tailwind or
**publish** to a hosted link. Credit-based plans included.

## Stack

| Layer      | Choice                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, TypeScript, Turbopack)                          |
| Styling    | Tailwind CSS v4 + custom design tokens (warm dark / gold)               |
| AI         | Anthropic Claude (default) or OpenAI — switch with `AI_PROVIDER`        |
| Database   | **SQLite** by default (`./data/sitecraft.db`, zero setup) → **Supabase Postgres** when keys are set |
| Auth       | Supabase Auth (Google / GitHub / email) — or demo login without Supabase |
| Payments   | **Razorpay** (INR/UPI) or **Stripe** — checkout + webhooks + credit ledger |
| Demo mode  | No keys needed: SQLite + mock generator                                 |

## Quick start (2 minutes, no accounts needed)

```bash
npm install
cp .env.example .env.local
npm run dev
# open http://localhost:3000 → Sign in with any email (demo mode)
```

Add `ANTHROPIC_API_KEY` to `.env.local` and restart to get real AI designs.

## Production setup

1. **Supabase**: create a project → SQL editor → run `supabase/schema.sql` → copy URL, anon key and service-role key into
   `.env.local`. Enable Google / GitHub under *Authentication → Providers* and add `https://yourdomain.com/auth/callback`
   as a redirect URL.
2. **AI key**: `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY` + `AI_PROVIDER=openai`).
3. **Payments**: `src/app/api/billing/route.ts` — plug in Stripe or Razorpay checkout and set the plan from a webhook.
4. Deploy to Vercel (or any Node host). `maxDuration` is set to 300 s on the streaming routes.

## Backend overview

| Concern | Where | Notes |
| --- | --- | --- |
| Database | `src/lib/db/` | One `Database` interface, three drivers: `sqlite.ts` (default, `node:sqlite`), `supabase.ts` (Postgres), `local.ts` (JSON fallback). `DB_DRIVER` overrides. |
| Credits | `spend_credits` / `grant_credits` | Atomic (SQL transaction / Postgres function) + ledger table `credit_transactions`. Monthly refill on login. |
| Payments | `src/lib/payments.ts`, `api/billing/*` | Razorpay order → Checkout popup → `/api/billing/verify` (HMAC) · Stripe Checkout → webhook. Idempotent fulfilment. |
| Validation | `src/lib/validate.ts` | Every POST body validated; clear 400 messages. |
| Rate limits | `src/lib/ratelimit.ts` | Per-user sliding windows (generate 20/10 min, edit 40, scrape 30…), 429 + `Retry-After`. |
| Storage | `src/lib/storage.ts` | Screenshots → Supabase Storage bucket `screenshots` (public URL) when configured; inline data URL otherwise. |
| Auth guard | `src/proxy.ts` | Refreshes Supabase session cookies, redirects signed-out users from `/dashboard` & `/editor`, security headers. |
| Health | `GET /api/health` | DB / AI / payments status for uptime checks. |
| Usage | `GET /api/usage` | Credits, counts and ledger for the signed-in user. |

### API reference

| Method | Route | Purpose |
| --- | --- | --- |
| GET/POST | `/api/projects` | list / create project (validated, rate-limited) |
| GET/PATCH/DELETE | `/api/projects/:id` | project + variants / rename, set active / delete |
| PATCH/DELETE | `/api/variants/:id` | save edited HTML / delete |
| POST | `/api/scrape` | read a URL (SSRF-guarded) |
| POST | `/api/generate` | stream one design (1 credit) |
| POST | `/api/edit` | stream an AI edit (1 credit) |
| POST | `/api/publish` | publish / unpublish → `/s/:slug` |
| GET/POST | `/api/billing` | payment history / start checkout |
| POST | `/api/billing/verify` | Razorpay signature verification |
| POST | `/api/billing/webhook/{razorpay,stripe}` | payment webhooks |
| GET | `/api/usage`, `/api/me`, `/api/health` | account / status |

## Project structure

```
src/
  app/
    page.tsx                 landing (hero, how it works, features, styles, pricing, FAQ)
    login/                   split-layout sign-in / sign-up (OAuth + email, or demo)
    pricing/, privacy/, terms/
    dashboard/               sidebar layout → projects grid, new-site wizard, billing, settings
    editor/[id]/             full-screen editor (variants, live preview, AI / Edit / Code panels)
    s/[slug]/                public hosting of published sites
    auth/callback/           Supabase OAuth callback
    api/
      projects, projects/[id], variants/[id]     CRUD
      scrape                 read a URL (title, headings, copy, nav, brand colours)
      generate               streams one design variant (1 credit)
      edit                   streams an AI edit of a variant (1 credit)
      publish                publish / unpublish to /s/<slug>
      billing, me, auth/*
  lib/
    ai/provider.ts           streamText() — Anthropic / OpenAI
    ai/prompts.ts            system prompts + brief builder (anti-"AI slop" rules)
    ai/mock.ts               offline generator for demos
    db/                      Database interface → supabase.ts | local.ts
    auth.ts                  getCurrentUser() (Supabase session or demo cookie), monthly credit refill
    scrape.ts                cheerio-based site reader (SSRF-guarded)
    editor/inspect.ts        visual editor: element picker, describe, serialize
  components/
    landing/, auth/, dashboard/, editor/
supabase/schema.sql          tables, atomic spend_credits(), RLS
```

## How generation works

1. `POST /api/projects` stores the brief (URL / screenshot data-URL / description + mode + instructions).
2. The editor opens with `?autogen=1` and calls `POST /api/generate` once per style
   (Multi mode = 2 light + 1 dark presets chosen at random; Manual = your pick).
3. The route scrapes the URL (if any), builds a brief, streams the model's HTML back; the preview re-renders live.
   The variant is saved when the stream finishes. The variant id is returned in the `X-Variant-Id` header.
4. Edits (`POST /api/edit`) send the full HTML + instruction (+ selected element path) and stream the full updated page.
5. The visual editor mutates the iframe DOM directly (same-origin `srcdoc`) and saves via `PATCH /api/variants/:id`.

Credits: 1 per generated variant, 1 per AI edit. Visual edits are free. Plans in `src/lib/types.ts` (`PLAN_LIMITS`).

## Customising

- **Brand**: tokens in `src/app/globals.css` (`--gold`, `--bg`, …) and `components/Logo.tsx`.
- **Styles**: `STYLE_PRESETS` in `src/lib/types.ts` — add a key, label, theme and a prompt hint.
- **Prompts**: `src/lib/ai/prompts.ts`.
- **Model**: `ANTHROPIC_MODEL` / `OPENAI_MODEL` env vars.

## Notes / next steps

- Screenshots are stored as data URLs in the DB; move to Supabase Storage for large volumes.
- Generated pages render same-origin inside the editor so the visual editor can access the DOM. Published pages at
  `/s/<slug>` are served as plain HTML; consider a separate domain for user content in production.
- Multi-page sites, a sections/themes library, team seats and a Chrome extension are natural next features; the data
  model (project → variants) already supports more than one variant per project.
