# SuchanSpace Productivity App

Personal productivity dashboard with:
- multi-user authentication (Supabase Auth)
- cloud database backup/sync per user (Supabase Postgres)
- local fast state with IndexedDB (Dexie)

## 1) Free backend option used

This project uses **Supabase free tier** (best free choice for auth + database in one service).

## 2) Supabase setup

1. Create a new Supabase project.
2. In Supabase SQL Editor, run [supabase/schema.sql](supabase/schema.sql).
3. In `Authentication > Providers`, keep Email provider enabled.
4. Copy project URL and anon key from `Project Settings > API`.

## 3) Environment variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 4) Run locally

```bash
npm install
npm run dev
```

## 5) How user data works

- Users sign up / sign in with email + password.
- App data stays in local IndexedDB for speed.
- Per-user cloud backup is stored in `public.user_backups`.
- On login, cloud data is restored to local.
- Auto backup runs every 60 seconds and on tab close.
