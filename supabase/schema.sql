create table if not exists public.user_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_backups enable row level security;

drop policy if exists "Users can read own backup" on public.user_backups;

create policy "Users can read own backup"
  on public.user_backups
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own backup" on public.user_backups;

create policy "Users can insert own backup"
  on public.user_backups
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own backup" on public.user_backups;

create policy "Users can update own backup"
  on public.user_backups
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.user_access_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  note text
);

alter table public.user_access_requests enable row level security;

drop policy if exists "Users can read own access request" on public.user_access_requests;

create policy "Users can read own access request"
  on public.user_access_requests
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own pending access request" on public.user_access_requests;

create policy "Users can create own pending access request"
  on public.user_access_requests
  for insert
  with check (auth.uid() = user_id and status = 'pending');

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Users can read own admin membership" on public.admin_users;

create policy "Users can read own admin membership"
  on public.admin_users
  for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all access requests" on public.user_access_requests;

create policy "Admins can read all access requests"
  on public.user_access_requests
  for select
  using (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can update access requests" on public.user_access_requests;

create policy "Admins can update access requests"
  on public.user_access_requests
  for update
  using (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
    and status in ('pending', 'approved', 'denied')
  );

create or replace function public.handle_new_user_access_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_admin boolean;
begin
  select exists(select 1 from public.admin_users) into has_admin;

  if not has_admin then
    insert into public.admin_users (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

    insert into public.user_access_requests (user_id, email, status, decided_at, note)
    values (new.id, new.email, 'approved', now(), 'auto-approved as bootstrap admin')
    on conflict (user_id) do update
      set status = excluded.status,
          decided_at = excluded.decided_at,
          note = excluded.note,
          email = coalesce(public.user_access_requests.email, excluded.email);

    return new;
  end if;

  insert into public.user_access_requests (user_id, email, status)
  values (new.id, new.email, 'pending')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_access_request on auth.users;

create trigger on_auth_user_created_access_request
after insert on auth.users
for each row execute procedure public.handle_new_user_access_request();
