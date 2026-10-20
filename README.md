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
| Auth + DB  | Supabase (Postgres, Google/GitHub/email) — **optional**                 |
| Demo mode  | No keys needed: local JSON DB (`.data/db.json`) + mock generator        |

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
