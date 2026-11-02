-- BigOwl: tighten grants left behind by Supabase defaults (security review L3, L4).
-- Not applied automatically: paste this file into the Supabase SQL Editor and run it.
-- Every statement is safe to run more than once.

-- 1. progress table (L3).
-- Supabase's "automatically expose new tables" default granted ALL privileges to the API
-- roles when the table was created. The app only needs select, insert, update and delete,
-- which the first migration grants. TRUNCATE ignores row-level security, so remove it and
-- the other unused privileges from signed-in users.
revoke truncate, references, trigger on public.progress from authenticated;

-- 2. Future functions (L4).
-- Postgres grants EXECUTE on every new function to PUBLIC, which includes anon. The first
-- migration only revoked the default from anon and authenticated, so a new function in
-- public would still be callable by anyone through PUBLIC. Make new functions private
-- until access is granted deliberately.
alter default privileges for role postgres in schema public revoke execute on functions from public;

-- 3. rls_auto_enable() (Security Advisor warning).
-- Supabase creates this SECURITY DEFINER event-trigger function when "automatically enable
-- RLS on new tables" is switched on. Event triggers run it themselves, so no API role needs
-- to call it directly. Revoke direct execution only; the function and its event trigger are
-- left untouched so new tables keep getting RLS. Does nothing if the function is absent.
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn);
  end loop;
end
$$;
