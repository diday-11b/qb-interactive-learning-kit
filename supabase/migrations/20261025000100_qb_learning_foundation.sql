-- QB Interactive Learning Kits: first Supabase data foundation.
-- Apply with `supabase db push` after linking a Supabase project.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner' check (char_length(display_name) between 1 and 80),
  role text not null default 'student' check (role in ('student', 'teacher', 'parent', 'admin')),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'km')),
  avatar_id text,
  daily_goal_sessions smallint check (daily_goal_sessions between 1 and 20),
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  grade_level text,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);
create index if not exists class_members_student_id_idx on public.class_members(student_id);

-- Parent-child links are created only by a trusted administrator workflow.
create table if not exists public.parent_children (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  linked_at timestamptz not null default now(),
  primary key (parent_id, student_id),
  check (parent_id <> student_id)
);
create index if not exists parent_children_student_id_idx on public.parent_children(student_id);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null check (category in ('phonics', 'reading', 'math', 'vocabulary', 'khmer', 'other')),
  route text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.activities (slug, title, category, route) values
  ('ship-battle', 'Ship Battle', 'phonics', '/qb_student_gameplay_ship_battle_arena/code.html'),
  ('alien-spelling', 'Alien Spelling Shuttle', 'vocabulary', '/19._qb_student_gameplay_alien_spelling_shuttle/code.html')
on conflict (slug) do nothing;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete restrict,
  title text not null,
  due_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists assignments_class_id_idx on public.assignments(class_id);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete set null,
  student_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  score integer,
  stars_earned integer,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  check ((status = 'completed') = (completed_at is not null))
);
create index if not exists game_sessions_student_started_idx on public.game_sessions(student_id, started_at desc);
create index if not exists game_sessions_assignment_student_idx on public.game_sessions(assignment_id, student_id);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon text not null
);

create table if not exists public.student_achievements (
  student_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete restrict,
  earned_at timestamptz not null default now(),
  primary key (student_id, achievement_id)
);
create index if not exists student_achievements_student_idx on public.student_achievements(student_id);

-- Role and relationship lookups live outside the exposed API schema to avoid
-- recursive RLS policies. The fixed search_path prevents object-shadowing.
create or replace function private.current_role()
returns text language sql stable security definer set search_path = ''
as $$ select p.role from public.profiles p where p.id = (select auth.uid()) $$;

create or replace function private.is_class_teacher(target_class uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.classes c
  where c.id = target_class and c.teacher_id = (select auth.uid())
) $$;

create or replace function private.is_class_student(target_class uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.class_members m
  where m.class_id = target_class and m.student_id = (select auth.uid())
) $$;

create or replace function private.is_linked_parent(target_student uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.parent_children pc
  where pc.parent_id = (select auth.uid()) and pc.student_id = target_student
) $$;

create or replace function private.profile_role(target_user uuid)
returns text language sql stable security definer set search_path = ''
as $$ select p.role from public.profiles p where p.id = target_user $$;

revoke all on function private.current_role() from public, anon;
revoke all on function private.is_class_teacher(uuid) from public, anon;
revoke all on function private.is_class_student(uuid) from public, anon;
revoke all on function private.is_linked_parent(uuid) from public, anon;
revoke all on function private.profile_role(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.is_class_teacher(uuid) to authenticated;
grant execute on function private.is_class_student(uuid) to authenticated;
grant execute on function private.is_linked_parent(uuid) to authenticated;
grant execute on function private.profile_role(uuid) to authenticated;

-- Auth-created accounts always begin as students. User-supplied metadata cannot
-- grant teacher, parent, or admin access.
create or replace function private.create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 80), ''), 'Learner'),
    'student'
  );
  return new;
end;
$$;
revoke all on function private.create_profile_for_auth_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function private.create_profile_for_auth_user();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.parent_children enable row level security;
alter table public.activities enable row level security;
alter table public.assignments enable row level security;
alter table public.game_sessions enable row level security;
alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;

revoke all on public.profiles, public.classes, public.class_members, public.parent_children,
  public.activities, public.assignments, public.game_sessions, public.achievements,
  public.student_achievements from anon, authenticated;

grant select on public.profiles, public.classes, public.class_members, public.parent_children,
  public.activities, public.assignments, public.game_sessions, public.achievements,
  public.student_achievements to authenticated;
grant update (display_name, preferred_language, avatar_id) on public.profiles to authenticated;
grant insert (class_id, student_id) on public.class_members to authenticated;
grant insert (class_id, activity_id, title, due_at, created_by) on public.assignments to authenticated;
grant insert (assignment_id, student_id, activity_id, started_at) on public.game_sessions to authenticated;

create policy "read own or associated profiles" on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select private.is_linked_parent(id))
  or exists (
    select 1 from public.classes c
    join public.class_members m on m.class_id = c.id
    where c.teacher_id = (select auth.uid()) and m.student_id = profiles.id
  )
);
create policy "update own safe profile fields" on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and role = (select private.current_role()));

create policy "read own classes" on public.classes for select to authenticated
using (teacher_id = (select auth.uid()) or (select private.is_class_student(id)));
create policy "teacher creates own classes" on public.classes for insert to authenticated
with check (teacher_id = (select auth.uid()) and (select private.current_role()) = 'teacher');
create policy "teacher updates own classes" on public.classes for update to authenticated
using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));
grant insert (name, grade_level, teacher_id) on public.classes to authenticated;
grant update (name, grade_level) on public.classes to authenticated;

create policy "read own class memberships" on public.class_members for select to authenticated
using (
  student_id = (select auth.uid())
  or (select private.is_class_teacher(class_id))
  or (select private.is_linked_parent(student_id))
);
create policy "teacher adds a student to own class" on public.class_members for insert to authenticated
with check (
  (select private.is_class_teacher(class_id))
  and (select private.current_role()) = 'teacher'
  and (select private.profile_role(student_id)) = 'student'
);

create policy "read own parent links" on public.parent_children for select to authenticated
using (parent_id = (select auth.uid()) or student_id = (select auth.uid()));

create policy "read active activities" on public.activities for select to authenticated
using (active = true);

create policy "read class assignments" on public.assignments for select to authenticated
using (
  (select private.is_class_teacher(class_id))
  or (select private.is_class_student(class_id))
  or exists (
    select 1 from public.class_members m
    where m.class_id = assignments.class_id
      and (select private.is_linked_parent(m.student_id))
  )
);
create policy "class teacher creates assignments" on public.assignments for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.is_class_teacher(class_id))
  and (select private.current_role()) = 'teacher'
);

create policy "read own or associated game sessions" on public.game_sessions for select to authenticated
using (
  student_id = (select auth.uid())
  or (assignment_id is not null and exists (
    select 1 from public.assignments a
    where a.id = game_sessions.assignment_id and (select private.is_class_teacher(a.class_id))
  ))
  or (select private.is_linked_parent(student_id))
);
create policy "student starts own assigned or free session" on public.game_sessions for insert to authenticated
with check (
  student_id = (select auth.uid())
  and (select private.current_role()) = 'student'
  and status = 'in_progress'
  and completed_at is null and duration_seconds is null and score is null and stars_earned is null
  and (assignment_id is null or exists (
    select 1 from public.assignments a
    join public.class_members m on m.class_id = a.class_id
    where a.id = assignment_id and m.student_id = (select auth.uid())
      and a.activity_id = game_sessions.activity_id
  ))
);

create policy "read achievement catalog" on public.achievements for select to authenticated
using (true);
create policy "read own or associated achievements" on public.student_achievements for select to authenticated
using (
  student_id = (select auth.uid())
  or (select private.is_linked_parent(student_id))
  or exists (
    select 1 from public.class_members m
    join public.classes c on c.id = m.class_id
    where m.student_id = student_achievements.student_id and c.teacher_id = (select auth.uid())
  )
);

-- Trusted server-side processes may record verified completions and rewards.
-- Do not grant client UPDATE/INSERT access to score, stars, or award rows.
grant all on public.profiles, public.classes, public.class_members, public.parent_children,
  public.activities, public.assignments, public.game_sessions, public.achievements,
  public.student_achievements to service_role;
