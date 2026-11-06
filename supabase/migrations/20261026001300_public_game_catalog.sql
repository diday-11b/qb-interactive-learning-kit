-- Expose only metadata for active, published public games to signed-out visitors.
-- Private/assigned games and all user-specific data remain behind authenticated RLS.
create or replace function public.get_public_game_library()
returns table (
  id uuid,
  slug text,
  title text,
  short_description text,
  category text,
  language text,
  min_age smallint,
  max_age smallint,
  difficulty text,
  duration_minutes smallint,
  game_type text,
  engine_type text,
  thumbnail_url text,
  route text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.slug, a.title, a.short_description, a.category, a.language,
         a.min_age, a.max_age, a.difficulty, a.duration_minutes, a.game_type,
         a.engine_type, a.thumbnail_url, a.route
  from public.activities as a
  where a.active = true
    and a.published = true
    and a.visibility = 'public'
  order by a.title;
$$;

revoke all on function public.get_public_game_library() from public, anon, authenticated;
grant execute on function public.get_public_game_library() to anon, authenticated;
