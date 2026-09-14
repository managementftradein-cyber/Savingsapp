-- Nestegg: Site settings + media storage
-- Run this AFTER all previous schema files.
--
-- Backs the admin CMS feature for the splash/login/signup background
-- video and image, uploaded via /admin/media instead of a code deploy.

-- 1. Settings table -----------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('auth_background_video_url', null),
  ('auth_background_image_url', null)
on conflict (key) do nothing;

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- 2. RLS -----------------------------------------------------------------------
-- Readable by EVERYONE, including logged-out visitors — the splash page
-- that uses this loads before anyone has signed in. No client, logged in
-- or not, can write to it — that only happens through the admin API
-- route, using the service-role client after requireAdminUser() checks
-- the caller's own role.
alter table public.app_settings enable row level security;

drop policy if exists "Anyone can read settings" on public.app_settings;
create policy "Anyone can read settings"
  on public.app_settings for select
  to authenticated, anon
  using (true);

grant usage on schema public to anon;
grant select on table public.app_settings to authenticated, anon;
grant select, update on table public.app_settings to service_role;

-- 3. Storage bucket for uploaded media -----------------------------------------
insert into storage.buckets (id, name, public)
values ('app-media', 'app-media', true)
on conflict (id) do nothing;

-- Public read (so the video/image actually loads on the splash page for
-- anyone), but uploads/deletes only via the service-role client in the
-- admin API route — no storage policy grants insert/update/delete to
-- authenticated or anon at all.
drop policy if exists "Public can view app-media" on storage.objects;
create policy "Public can view app-media"
  on storage.objects for select
  to authenticated, anon
  using (bucket_id = 'app-media');
