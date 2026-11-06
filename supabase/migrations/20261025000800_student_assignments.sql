-- A teacher may assign an activity to a whole class or one student in it.
alter table public.assignments add column if not exists student_id uuid
  references public.profiles(id) on delete cascade;
create index if not exists assignments_student_class_idx on public.assignments(student_id, class_id);

drop policy if exists "read class assignments" on public.assignments;
create policy "read authorized class assignments" on public.assignments for select to authenticated
using (
  ((select private.is_class_teacher(class_id)) and (student_id is null or exists (
    select 1 from public.class_members m where m.class_id = assignments.class_id and m.student_id = assignments.student_id
  )))
  or ((select private.is_class_student(class_id)) and (student_id is null or student_id = (select auth.uid())))
  or exists (
    select 1 from public.class_members m
    where m.class_id = assignments.class_id
      and (select private.is_linked_parent(m.student_id))
      and (assignments.student_id is null or assignments.student_id = m.student_id)
  )
);

drop policy if exists "class teacher creates published game assignments" on public.assignments;
create policy "class teacher creates published game assignments" on public.assignments for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.is_class_teacher(class_id))
  and (select private.current_role()) = 'teacher'
  and (select private.is_active_published_activity(activity_id))
  and (student_id is null or exists (
    select 1 from public.class_members m join public.profiles p on p.id = m.student_id
    where m.class_id = assignments.class_id and m.student_id = assignments.student_id and p.role = 'student'
  ))
);
revoke insert on public.assignments from authenticated;
grant insert (class_id, activity_id, title, due_at, created_by, student_id) on public.assignments to authenticated;

create or replace function public.create_teacher_assignment(
  target_class uuid, target_activity uuid, assignment_title text,
  target_student uuid default null, assignment_due timestamptz default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare current_teacher uuid := (select auth.uid()); new_id uuid; clean_title text := trim(coalesce(assignment_title, ''));
begin
  if current_teacher is null or (select private.current_role()) <> 'teacher'
    or not (select private.is_class_teacher(target_class)) then
    raise exception 'You can only assign work to your own classes.' using errcode = '42501';
  end if;
  if char_length(clean_title) < 1 or char_length(clean_title) > 120 then
    raise exception 'Assignment title must be between 1 and 120 characters.' using errcode = '22023';
  end if;
  if not (select private.is_active_published_activity(target_activity)) then
    raise exception 'Choose an active published activity.' using errcode = '22023';
  end if;
  if target_student is not null and not exists (
    select 1 from public.class_members m join public.profiles p on p.id = m.student_id
    where m.class_id = target_class and m.student_id = target_student and p.role = 'student'
  ) then
    raise exception 'Choose a learner in this class.' using errcode = '22023';
  end if;
  if assignment_due is not null and assignment_due < now() then
    raise exception 'The due date must be today or later.' using errcode = '22023';
  end if;
  insert into public.assignments(class_id, activity_id, title, due_at, created_by, student_id)
    values(target_class, target_activity, clean_title, assignment_due, current_teacher, target_student)
    returning id into new_id;
  return jsonb_build_object('id', new_id, 'title', clean_title);
end;
$$;
revoke all on function public.create_teacher_assignment(uuid, uuid, text, uuid, timestamptz) from public, anon;
grant execute on function public.create_teacher_assignment(uuid, uuid, text, uuid, timestamptz) to authenticated;

-- Respect student-specific assignment visibility in the activity catalog.
create or replace function private.can_view_activity(target_activity uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.assignments a join public.class_members m on m.class_id = a.class_id
    where a.activity_id = target_activity and m.student_id = (select auth.uid())
      and (a.student_id is null or a.student_id = (select auth.uid()))
  )
  or exists (
    select 1 from public.assignments a join public.classes c on c.id = a.class_id
    where a.activity_id = target_activity and c.teacher_id = (select auth.uid())
  )
  or exists (
    select 1 from public.assignments a
    join public.class_members m on m.class_id = a.class_id
    join public.parent_children pc on pc.student_id = m.student_id
    where a.activity_id = target_activity and pc.parent_id = (select auth.uid())
      and (a.student_id is null or a.student_id = m.student_id)
  )
  or (select private.current_role()) = 'admin'
$$;
revoke all on function private.can_view_activity(uuid) from public, anon;
grant execute on function private.can_view_activity(uuid) to authenticated;

-- Update the existing student game-start RPC so targeted assignments cannot
-- be started by another learner in the same class.
create or replace function public.start_game_session(target_activity uuid, target_assignment uuid default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare act public.activities%rowtype; session_id uuid; total integer; round_size integer;
begin
  if (select private.current_role()) <> 'student' then raise exception 'A student account is required to play.'; end if;
  select * into act from public.activities a
    where a.id = target_activity and a.active and a.published and a.engine_type is not null;
  if not found then raise exception 'This activity is not ready to play.'; end if;

  if target_assignment is not null then
    if not exists (
      select 1 from public.assignments a join public.class_members m on m.class_id = a.class_id
      where a.id = target_assignment and a.activity_id = target_activity and m.student_id = (select auth.uid())
        and (a.student_id is null or a.student_id = (select auth.uid()))
    ) then raise exception 'This activity is not assigned to your account.'; end if;
  elsif act.visibility <> 'public' then
    select a.id into target_assignment
      from public.assignments a join public.class_members m on m.class_id = a.class_id
      where a.activity_id = target_activity and m.student_id = (select auth.uid())
        and (a.student_id is null or a.student_id = (select auth.uid()))
      order by a.created_at desc limit 1;
    if target_assignment is null then raise exception 'Choose an activity assigned to your class.'; end if;
  end if;

  select count(*) into total from public.game_questions q where q.activity_id = target_activity and q.published;
  if act.engine_type = 'picture_guessing' and total < 10 then
    raise exception 'Picture Guessing needs 10 published questions before it can start.';
  elsif total < 1 then raise exception 'This game needs published questions before it can start.'; end if;
  round_size := case when act.engine_type = 'picture_guessing' then 10 else least(total, 10) end;
  insert into public.game_sessions (student_id, activity_id, assignment_id, status)
    values ((select auth.uid()), target_activity, target_assignment, 'in_progress') returning id into session_id;
  insert into public.game_session_questions (session_id, question_id, position, content_snapshot, answer_key_snapshot)
    select session_id, q.id, row_number() over (order by q.ordinal)::smallint, q.content, q.answer_key
    from public.game_questions q where q.activity_id = target_activity and q.published
    order by q.ordinal limit round_size;
  return jsonb_build_object('session_id', session_id, 'activity_id', act.id, 'title', act.title,
    'engine_type', act.engine_type, 'total_questions', round_size,
    'questions', (select jsonb_agg(jsonb_build_object('id', sq.question_id, 'position', sq.position,
      'content', sq.content_snapshot) order by sq.position)
      from public.game_session_questions sq where sq.session_id = session_id));
end;
$$;
