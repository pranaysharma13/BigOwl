-- BigOwl: per-user progress storage.
-- Each signed-in user has exactly one row. Row-level security guarantees that a user
-- can only ever read, write or delete their own row.

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  -- keep documents small: progress is a few kilobytes; reject anything over 256 KB
  constraint progress_data_size check (pg_column_size(data) < 262144)
);

alter table public.progress enable row level security;

create policy "Users read their own progress" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users insert their own progress" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Users update their own progress" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users delete their own progress" on public.progress
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.progress from anon;
grant select, insert, update, delete on public.progress to authenticated;

-- Lets a signed-in user delete their own account. Deleting the auth user cascades to
-- their progress row. SECURITY DEFINER is required to touch auth.users; the function
-- only ever deletes the caller (auth.uid()) and has a fixed, empty search_path.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- The project was created with "Automatically expose new tables" switched on, which grants
-- the API roles access to every future table in the public schema. Switch that off so new
-- tables are private until access is granted deliberately.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
