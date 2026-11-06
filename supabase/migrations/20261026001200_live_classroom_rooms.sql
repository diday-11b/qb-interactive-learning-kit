-- Teacher-controlled live rooms build on the existing assignment and game
-- session authorization. Codes are shared only by the owning teacher.
create table if not exists public.live_game_rooms (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.assignments(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete restrict,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  check (join_code ~ '^[A-F0-9]{16}$'),
  check (
    (status = 'waiting' and started_at is null and finished_at is null)
    or (status = 'active' and started_at is not null and finished_at is null)
    or (status = 'finished' and finished_at is not null)
  )
);
create index if not exists live_game_rooms_class_status_idx on public.live_game_rooms(class_id, status, created_at desc);

create table if not exists public.live_game_room_participants (
  room_id uuid not null references public.live_game_rooms(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, student_id)
);
create index if not exists live_game_room_participants_student_idx on public.live_game_room_participants(student_id, joined_at desc);

alter table public.live_game_rooms enable row level security;
alter table public.live_game_room_participants enable row level security;
revoke all on public.live_game_rooms, public.live_game_room_participants from public, anon, authenticated;

create or replace function public.create_live_game_room(target_assignment uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  current_teacher uuid := (select auth.uid());
  assignment_row public.assignments%rowtype;
  activity_row public.activities%rowtype;
  room public.live_game_rooms%rowtype;
  question_count integer;
begin
  if current_teacher is null or (select private.current_role()) <> 'teacher' then
    raise exception 'Teacher access is required.' using errcode = '42501';
  end if;
  select a.* into assignment_row
    from public.assignments a join public.classes c on c.id = a.class_id
    where a.id = target_assignment and c.teacher_id = current_teacher and a.created_by = current_teacher
      and a.student_id is null
    for update of a;
  if not found then
    raise exception 'Choose a whole-class assignment owned by your account.' using errcode = '42501';
  end if;
  select * into activity_row from public.activities a
    where a.id = assignment_row.activity_id and a.active and a.published
      and a.route = '/game-player.html' and a.engine_type is not null;
  if not found then raise exception 'Choose a published game supported by the student player.' using errcode = '22023'; end if;
  select count(*) into question_count from public.game_questions q
    where q.activity_id = activity_row.id and q.published;
  if (activity_row.engine_type = 'picture_guessing' and question_count < 10)
    or (activity_row.engine_type <> 'picture_guessing' and question_count < 1) then
    raise exception 'This game needs published questions before a live room can open.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.class_members m join public.profiles p on p.id = m.student_id
      where m.class_id = assignment_row.class_id and p.role = 'student') then
    raise exception 'Add at least one student to this class before creating a room.' using errcode = '22023';
  end if;

  insert into public.live_game_rooms(assignment_id, class_id, activity_id, teacher_id)
    values(assignment_row.id, assignment_row.class_id, assignment_row.activity_id, current_teacher)
    on conflict (assignment_id) do nothing;
  select * into room from public.live_game_rooms r where r.assignment_id = assignment_row.id;
  if room.teacher_id <> current_teacher then
    raise exception 'This assignment already has a room owned by another teacher.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'roomId', room.id, 'assignmentId', room.assignment_id, 'classId', room.class_id,
    'activityId', room.activity_id, 'joinCode', room.join_code, 'status', room.status,
    'className', (select c.name from public.classes c where c.id = room.class_id),
    'activityTitle', activity_row.title
  );
end;
$$;

create or replace function public.join_live_game_room(invitation_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare current_student uuid := (select auth.uid()); room public.live_game_rooms%rowtype;
  assignment_row public.assignments%rowtype; activity_title text;
begin
  if current_student is null or (select private.current_role()) <> 'student' then
    raise exception 'Sign in with a student account to join a live game.' using errcode = '42501';
  end if;
  select * into room from public.live_game_rooms r
    where r.join_code = upper(trim(coalesce(invitation_code, '')))
    for update;
  if not found then raise exception 'That live game code was not found.' using errcode = '22023'; end if;
  if room.status = 'finished' then raise exception 'This live game has ended.' using errcode = '22023'; end if;
  select * into assignment_row from public.assignments a
    where a.id = room.assignment_id and a.class_id = room.class_id and a.activity_id = room.activity_id
      and a.student_id is null;
  if not found or not exists (select 1 from public.class_members m
      where m.class_id = room.class_id and m.student_id = current_student) then
    raise exception 'This game is not assigned to your account.' using errcode = '42501';
  end if;
  insert into public.live_game_room_participants(room_id, student_id)
    values(room.id, current_student) on conflict (room_id, student_id) do nothing;
  select a.title into activity_title from public.activities a where a.id = room.activity_id;
  return jsonb_build_object('roomId', room.id, 'assignmentId', room.assignment_id,
    'activityId', room.activity_id, 'activityTitle', activity_title, 'className',
    (select c.name from public.classes c where c.id = room.class_id), 'status', room.status);
end;
$$;

create or replace function public.get_live_game_room_state(target_room uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare current_user_id uuid := (select auth.uid()); room public.live_game_rooms%rowtype;
  is_teacher boolean; result jsonb;
begin
  if current_user_id is null then raise exception 'Sign in to view this live game.' using errcode = '42501'; end if;
  select * into room from public.live_game_rooms r where r.id = target_room;
  if not found then raise exception 'This live game is unavailable.' using errcode = '42501'; end if;
  is_teacher := room.teacher_id = current_user_id and (select private.current_role()) = 'teacher';
  if not is_teacher and not exists (select 1 from public.live_game_room_participants p
      join public.class_members m on m.class_id = room.class_id and m.student_id = p.student_id
      join public.assignments a on a.id = room.assignment_id and a.class_id = room.class_id
        and a.activity_id = room.activity_id and (a.student_id is null or a.student_id = p.student_id)
      where p.room_id = room.id and p.student_id = current_user_id) then
    raise exception 'You are not a participant in this live game.' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'roomId', room.id, 'assignmentId', room.assignment_id, 'activityId', room.activity_id,
    'status', room.status, 'startedAt', room.started_at, 'finishedAt', room.finished_at,
    'className', c.name, 'activityTitle', act.title,
    'participantCount', (select count(*)::integer from public.live_game_room_participants p where p.room_id = room.id),
    'joinCode', case when is_teacher then room.join_code else null end,
    'participants', case when is_teacher then coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.student_id, 'displayName', profile.display_name, 'joinedAt', p.joined_at
    ) order by p.joined_at, profile.display_name)
      from public.live_game_room_participants p join public.profiles profile on profile.id = p.student_id
      where p.room_id = room.id), '[]'::jsonb) else null end
  ) into result
  from public.classes c join public.activities act on act.id = room.activity_id
  where c.id = room.class_id;
  return result;
end;
$$;

create or replace function public.start_live_game_room(target_room uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare current_teacher uuid := (select auth.uid()); room public.live_game_rooms%rowtype;
begin
  if current_teacher is null or (select private.current_role()) <> 'teacher' then
    raise exception 'Teacher access is required.' using errcode = '42501';
  end if;
  select * into room from public.live_game_rooms r
    where r.id = target_room and r.teacher_id = current_teacher for update;
  if not found then raise exception 'This room is unavailable to your teacher account.' using errcode = '42501'; end if;
  if room.status = 'finished' then raise exception 'This room has already ended.' using errcode = '22023'; end if;
  if room.status = 'waiting' then
    if not exists (select 1 from public.live_game_room_participants p where p.room_id = room.id) then
      raise exception 'Wait for at least one student to join before starting.' using errcode = '22023';
    end if;
    update public.live_game_rooms set status = 'active', started_at = now() where id = room.id returning * into room;
  end if;
  return jsonb_build_object('roomId', room.id, 'status', room.status, 'startedAt', room.started_at);
end;
$$;

create or replace function public.finish_live_game_room(target_room uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare current_teacher uuid := (select auth.uid()); room public.live_game_rooms%rowtype;
begin
  if current_teacher is null or (select private.current_role()) <> 'teacher' then
    raise exception 'Teacher access is required.' using errcode = '42501';
  end if;
  update public.live_game_rooms r set status = 'finished', finished_at = coalesce(r.finished_at, now())
    where r.id = target_room and r.teacher_id = current_teacher returning * into room;
  if not found then raise exception 'This room is unavailable to your teacher account.' using errcode = '42501'; end if;
  return jsonb_build_object('roomId', room.id, 'status', room.status, 'finishedAt', room.finished_at);
end;
$$;

revoke all on function public.create_live_game_room(uuid), public.join_live_game_room(text),
  public.get_live_game_room_state(uuid), public.start_live_game_room(uuid), public.finish_live_game_room(uuid)
  from public, anon;
grant execute on function public.create_live_game_room(uuid), public.get_live_game_room_state(uuid),
  public.start_live_game_room(uuid), public.finish_live_game_room(uuid) to authenticated;
grant execute on function public.join_live_game_room(text) to authenticated;
