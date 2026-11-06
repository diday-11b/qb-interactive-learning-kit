-- Persist non-sensitive account preferences without allowing role or credential edits.
create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  sound_enabled boolean not null default true,
  reduced_motion boolean not null default false,
  high_contrast boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
revoke all on public.user_preferences from public, anon, authenticated;
grant select, insert (user_id, sound_enabled, reduced_motion, high_contrast),
  update (sound_enabled, reduced_motion, high_contrast, updated_at)
  on public.user_preferences to authenticated;

create policy "read own preferences" on public.user_preferences for select to authenticated
using (user_id = (select auth.uid()));
create policy "create own preferences" on public.user_preferences for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "update own preferences" on public.user_preferences for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create or replace function public.get_account_settings()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  account public.profiles%rowtype;
  preferences public.user_preferences%rowtype;
  has_saved_preferences boolean := false;
begin
  if current_user_id is null then
    raise exception 'Sign in to view account settings.' using errcode = '42501';
  end if;
  select * into account from public.profiles where id = current_user_id;
  if not found then
    raise exception 'Account settings are unavailable.' using errcode = '42501';
  end if;
  select * into preferences from public.user_preferences where user_id = current_user_id;
  has_saved_preferences := found;
  return jsonb_build_object(
    'profile', jsonb_build_object(
      'displayName', account.display_name,
      'role', account.role,
      'language', account.preferred_language
    ),
    'preferences', jsonb_build_object(
      'soundEnabled', coalesce(preferences.sound_enabled, true),
      'reducedMotion', coalesce(preferences.reduced_motion, false),
      'highContrast', coalesce(preferences.high_contrast, false)
    ),
    'hasSavedPreferences', has_saved_preferences
  );
end;
$$;

create or replace function public.save_account_settings(
  profile_display_name text,
  profile_language text,
  setting_sound_enabled boolean,
  setting_reduced_motion boolean,
  setting_high_contrast boolean
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  safe_name text := btrim(profile_display_name);
begin
  if current_user_id is null then
    raise exception 'Sign in to save account settings.' using errcode = '42501';
  end if;
  if safe_name is null or char_length(safe_name) < 1 or char_length(safe_name) > 80 then
    raise exception 'Enter a name between 1 and 80 characters.' using errcode = '22023';
  end if;
  if profile_language is null or profile_language not in ('en', 'km') then
    raise exception 'Choose English or Khmer.' using errcode = '22023';
  end if;
  if setting_sound_enabled is null or setting_reduced_motion is null or setting_high_contrast is null then
    raise exception 'Choose a value for each preference.' using errcode = '22023';
  end if;

  update public.profiles
    set display_name = safe_name, preferred_language = profile_language
    where id = current_user_id;
  if not found then
    raise exception 'Account settings are unavailable.' using errcode = '42501';
  end if;

  insert into public.user_preferences (user_id, sound_enabled, reduced_motion, high_contrast, updated_at)
    values (current_user_id, setting_sound_enabled, setting_reduced_motion, setting_high_contrast, now())
  on conflict (user_id) do update set
    sound_enabled = excluded.sound_enabled,
    reduced_motion = excluded.reduced_motion,
    high_contrast = excluded.high_contrast,
    updated_at = excluded.updated_at;

  return public.get_account_settings();
end;
$$;

revoke all on function public.get_account_settings(),
  public.save_account_settings(text, text, boolean, boolean, boolean) from public, anon;
grant execute on function public.get_account_settings(),
  public.save_account_settings(text, text, boolean, boolean, boolean) to authenticated;
