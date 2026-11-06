-- Publishable catalog metadata and assignment-aware discovery permissions.
alter table public.activities
  add column if not exists short_description text,
  add column if not exists language text,
  add column if not exists min_age smallint,
  add column if not exists max_age smallint,
  add column if not exists difficulty text,
  add column if not exists duration_minutes smallint,
  add column if not exists game_type text,
  add column if not exists thumbnail_url text,
  add column if not exists published boolean not null default false,
  add column if not exists visibility text not null default 'assigned';

alter table public.activities drop constraint if exists activities_category_check;
update public.activities set category = case
  when slug = 'alien-spelling' then 'spelling'
  when slug = 'ship-battle' then 'phonics'
  else category
end;
alter table public.activities add constraint activities_category_check check (
  category in ('alphabet_learning', 'phonics', 'spelling', 'vocabulary', 'picture_games',
    'memory_games', 'matching', 'quizzes', 'flashcards', 'reading',
    'math', 'khmer', 'other')
);

alter table public.activities add constraint activities_language_check
  check (language is null or language in ('en', 'km', 'dual'));
alter table public.activities add constraint activities_age_range_check
  check ((min_age is null or min_age between 3 and 18)
    and (max_age is null or max_age between 3 and 18)
    and (min_age is null or max_age is null or min_age <= max_age));
alter table public.activities add constraint activities_difficulty_check
  check (difficulty is null or difficulty in ('beginner', 'easy', 'medium', 'advanced'));
alter table public.activities add constraint activities_duration_check
  check (duration_minutes is null or duration_minutes between 1 and 180);
alter table public.activities add constraint activities_game_type_check
  check (game_type is null or game_type in ('solo', 'classroom', 'multiplayer'));
alter table public.activities add constraint activities_visibility_check
  check (visibility in ('public', 'assigned'));
alter table public.activities add constraint activities_route_check
  check (route like '/%' and route not like '%..%');

-- Use only facts supported by the existing project pages; leave unknown metadata NULL.
update public.activities set
  short_description = 'Answer phonics questions to guide your ship through a playful battle.',
  category = 'phonics', language = 'dual', game_type = 'classroom',
  published = true, visibility = 'public'
where slug = 'ship-battle';

update public.activities set
  short_description = 'Build spelling words with letter clues on a space mission.',
  category = 'spelling', language = 'en', game_type = 'solo',
  published = true, visibility = 'public'
where slug = 'alien-spelling';

create index if not exists activities_public_catalog_idx
  on public.activities (category, language, difficulty, game_type)
  where active = true and published = true;
create index if not exists assignments_activity_class_idx
  on public.assignments (activity_id, class_id);

create or replace function private.can_view_activity(target_activity uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.assignments a
    join public.class_members m on m.class_id = a.class_id
    where a.activity_id = target_activity and m.student_id = (select auth.uid())
  )
  or exists (
    select 1 from public.assignments a
    join public.classes c on c.id = a.class_id
    where a.activity_id = target_activity and c.teacher_id = (select auth.uid())
  )
  or exists (
    select 1 from public.assignments a
    join public.class_members m on m.class_id = a.class_id
    join public.parent_children pc on pc.student_id = m.student_id
    where a.activity_id = target_activity and pc.parent_id = (select auth.uid())
  )
  or (select private.current_role()) = 'admin'
$$;

revoke all on function private.can_view_activity(uuid) from public, anon;
grant execute on function private.can_view_activity(uuid) to authenticated;

create or replace function private.is_active_published_activity(target_activity uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.activities a
    where a.id = target_activity and a.active and a.published
  )
$$;
revoke all on function private.is_active_published_activity(uuid) from public, anon;
grant execute on function private.is_active_published_activity(uuid) to authenticated;

drop policy if exists "read active activities" on public.activities;
create policy "read published visible activities" on public.activities for select to authenticated
using (
  active = true and published = true
  and (visibility = 'public' or (select private.can_view_activity(id)))
);

drop policy if exists "class teacher creates assignments" on public.assignments;
create policy "class teacher creates published game assignments" on public.assignments for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.is_class_teacher(class_id))
  and (select private.current_role()) = 'teacher'
  and (select private.is_active_published_activity(activity_id))
);

