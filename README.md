# FORGED

A real-time social communication platform — communities, text spaces,
DMs, friends, and presence, built on Next.js and Supabase.

## Stack

- Next.js App Router (React, TypeScript strict, `src/` directory)
- Tailwind CSS v4 + hand-authored shadcn/ui-style primitives
- Supabase: Postgres + RLS, Auth, Realtime (`postgres_changes`)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project values
npm run dev
```

Open http://localhost:3000.

The database schema (tables, RLS policies, triggers, RPC functions) is
already applied to the live Supabase project and is **not** managed
from this repo — there are no migrations here. Point `.env.local` at
that project and everything just works against it.

## Project structure

```
src/
  app/                  Routes (App Router)
  components/
    ui/                 Base primitives (button, input, card, ...)
    layout/             App chrome (nav, rails, headers)
    chat/                Message list, composer, reactions
    community/           Community/space UI
    profile/              Profile + avatar UI
  lib/
    supabase/            Browser + server Supabase clients
    services/             Supabase calls — the ONLY layer allowed to
                           import the Supabase client. Components never
                           call Supabase directly; they go through a
                           hook, which goes through a service.
    utils.ts              `cn()` class-merge helper
  hooks/                   React hooks wrapping services
  types/
    database.ts            Hand-written types mirroring the live schema
```

## Architecture rules

1. UI components never call Supabase directly — always
   component → hook → service → client.
2. All authorization is enforced server-side via RLS.
3. Multi-step writes go through the provided Postgres RPC functions
   (`create_community`, `join_community`, `join_by_invite`, `start_dm`)
   rather than sequences of client-side inserts.
4. Pagination is cursor-based on `created_at`, batches of 50 — no
   offset pagination.
5. Realtime subscriptions are scoped to whatever space/conversation is
   currently open, never a blanket subscription.

## Design tokens

Single dark theme, no light mode. Defined as CSS variables in
`src/app/globals.css` and exposed to Tailwind via `@theme inline`:

| Token | Value |
|---|---|
| `background` | `#070b16` |
| `card` | `#0d1226` |
| `elevated` | `#131a33` |
| `border` | `rgba(255,255,255,0.08)` |
| `primary` | `#5b7cfa` |
| `violet` | `#8b5cf6` |
| `online` / `idle` / `dnd` | `#3ddc97` / `#fbbf24` / `#f43f5e` |

Primary buttons use a 135° blue → violet gradient
(`var(--gradient-primary)`).

## Milestones

Built incrementally, one milestone per session-checkpoint:

- [x] **M0** — Scaffold, theme, folder skeleton, Supabase clients
- [ ] **M1** — UI shell with mock data (all screens, responsive)
- [ ] **M2** — Auth (register/login/logout/session), route protection
- [ ] **M3** — Communities live (create/join/spaces via RPC + RLS)
- [ ] **M4** — Realtime messaging (send/receive/edit/delete/reactions)
- [ ] M5+ — Friends, DMs, notifications, moderation, voice (later)
