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

## 6) Account approval flow (confirm/deny before use)

This project supports a manual approval gate:

- Anyone can create an auth account.
- New accounts are inserted into `public.user_access_requests` with status `pending`.
- While `pending` or `denied`, the app blocks access to main sections.
- Only `approved` users can proceed and sync data.

### Approve a user

Run in Supabase SQL Editor:

```sql
update public.user_access_requests
set status = 'approved', decided_at = now(), note = 'approved by owner'
where email = 'user@example.com';
```

### Deny a user

```sql
update public.user_access_requests
set status = 'denied', decided_at = now(), note = 'denied by owner'
where email = 'user@example.com';
```

### See pending requests

```sql
select user_id, email, status, requested_at
from public.user_access_requests
where status = 'pending'
order by requested_at desc;
```

## 7) In-app admin approval panel

The Settings page now includes an **Admin · Account Approvals** panel.

Only users listed in `public.admin_users` can see and use it.

### One-time: make yourself admin

Run in Supabase SQL Editor (replace your email):

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'your-email@example.com'
on conflict (user_id) do nothing;
```

After that, sign in with that account and open **Settings**.
You can approve or deny pending users directly from the app UI.
