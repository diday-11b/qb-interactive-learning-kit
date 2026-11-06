-- Batch assignments are one row per recipient. A shared request key makes a
-- retried publish idempotent while preserving separate student result links.
alter table public.assignments
  add column if not exists instructions text not null default '',
  add column if not exists request_key uuid not null default gen_random_uuid();

alter table public.assignments drop constraint if exists assignments_instructions_length;
alter table public.assignments add constraint assignments_instructions_length
  check (char_length(instructions) <= 500);
create unique index if not exists assignments_request_recipient_uidx
  on public.assignments(request_key, class_id, (coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid)));

create or replace function public.publish_teacher_assignment(
  target_class uuid,
  target_activity uuid,
  assignment_title text,
  assignment_instructions text default '',
  target_students uuid[] default '{}',
  whole_class boolean default false,
  assignment_due timestamptz default null,
  publish_request uuid default gen_random_uuid()
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  current_teacher uuid := (select auth.uid());
  clean_title text := trim(coalesce(assignment_title, ''));
  clean_instructions text := trim(coalesce(assignment_instructions, ''));
  recipients uuid[];
  inserted_count integer;
  selected_engine text;
  question_count integer;
begin
  if current_teacher is null or (select private.current_role()) <> 'teacher'
    or not (select private.is_class_teacher(target_class)) then
    raise exception 'You can only assign work to your own classes.' using errcode = '42501';
  end if;
  if char_length(clean_title) not between 1 and 120 then
    raise exception 'Assignment title must be between 1 and 120 characters.' using errcode = '22023';
  end if;
  if char_length(clean_instructions) > 500 then
    raise exception 'Instructions must be 500 characters or fewer.' using errcode = '22023';
  end if;
  if not (select private.is_active_published_activity(target_activity)) then
    raise exception 'Choose an active published activity.' using errcode = '22023';
  end if;
  select a.engine_type into selected_engine from public.activities a
    where a.id = target_activity and a.route = '/game-player.html';
  if selected_engine is null then
    raise exception 'Choose an activity supported by the saved learning player.' using errcode = '22023';
  end if;
  select count(*) into question_count from public.game_questions q
    where q.activity_id = target_activity and q.published;
  if (selected_engine = 'picture_guessing' and question_count < 10)
    or (selected_engine <> 'picture_guessing' and question_count < 1) then
    raise exception 'This activity needs published questions before it can be assigned.' using errcode = '22023';
  end if;
  if assignment_due is not null and assignment_due::date < current_date then
    raise exception 'The due date must be today or later.' using errcode = '22023';
  end if;
  if publish_request is null then
    raise exception 'A publish request identifier is required.' using errcode = '22023';
  end if;

  if whole_class then
    recipients := array[null::uuid];
  else
    select coalesce(array_agg(distinct requested.student_id), '{}'::uuid[])
      into recipients
      from unnest(coalesce(target_students, '{}'::uuid[])) requested(student_id)
      where requested.student_id is not null;
    if cardinality(recipients) = 0 then
      raise exception 'Choose at least one learner or assign to the whole class.' using errcode = '22023';
    end if;
    if exists (
      select 1 from unnest(recipients) requested(student_id)
      where not exists (
        select 1 from public.class_members m join public.profiles p on p.id = m.student_id
        where m.class_id = target_class and m.student_id = requested.student_id and p.role = 'student'
      )
    ) then
      raise exception 'Every selected learner must belong to this class.' using errcode = '42501';
    end if;
  end if;

  insert into public.assignments(class_id, activity_id, title, due_at, created_by, student_id, instructions, request_key)
    select target_class, target_activity, clean_title, assignment_due, current_teacher, recipient, clean_instructions, publish_request
    from unnest(recipients) recipient
    on conflict (request_key, class_id, (coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid))) do nothing;
  get diagnostics inserted_count = row_count;

  return jsonb_build_object(
    'request_key', publish_request,
    'inserted_count', inserted_count,
    'assignments', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'student_id', a.student_id, 'title', a.title)
        order by a.student_id nulls first)
      from public.assignments a where a.request_key = publish_request and a.class_id = target_class
        and a.created_by = current_teacher
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.publish_teacher_assignment(uuid, uuid, text, text, uuid[], boolean, timestamptz, uuid) from public, anon;
grant execute on function public.publish_teacher_assignment(uuid, uuid, text, text, uuid[], boolean, timestamptz, uuid) to authenticated;

-- Keep the earlier single-recipient RPC safe for any older page still using it.
create or replace function public.create_teacher_assignment(
  target_class uuid, target_activity uuid, assignment_title text,
  target_student uuid default null, assignment_due timestamptz default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare result jsonb;
begin
  result := public.publish_teacher_assignment(
    target_class, target_activity, assignment_title, '',
    case when target_student is null then '{}'::uuid[] else array[target_student] end,
    target_student is null, assignment_due, gen_random_uuid()
  );
  return jsonb_build_object('id', result->'assignments'->0->'id', 'title', trim(assignment_title));
end;
$$;
revoke all on function public.create_teacher_assignment(uuid, uuid, text, uuid, timestamptz) from public, anon;
grant execute on function public.create_teacher_assignment(uuid, uuid, text, uuid, timestamptz) to authenticated;

-- Returns one row per learner/assignment, expanded from whole-class assignments.
-- Status and scores come only from persisted game sessions.
create or replace function public.get_teacher_assignment_progress(target_class uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  if (select private.current_role()) <> 'teacher' or not (select private.is_class_teacher(target_class)) then
    raise exception 'You can only view assignments in your own classes.' using errcode = '42501';
  end if;

  with recipients as (
    select a.id assignment_id, a.class_id, a.activity_id, a.title, a.instructions, a.due_at, a.created_at,
      a.student_id, m.student_id recipient_id
    from public.assignments a
    join public.class_members m on m.class_id = a.class_id
      and (a.student_id is null or a.student_id = m.student_id)
    where a.class_id = target_class
  ), states as (
    select r.*, p.display_name,
      case when stats.completed_at is not null then 'completed'
           when stats.started_at is not null then 'in_progress' else 'assigned' end as status,
      stats.score, stats.started_at, stats.completed_at,
      act.title as activity_title, act.route as activity_route, act.engine_type
    from recipients r
    join public.profiles p on p.id = r.recipient_id
    join public.activities act on act.id = r.activity_id
    left join lateral (
      select max(gs.started_at) filter (where gs.status = 'in_progress') started_at, max(gs.completed_at) completed_at,
        (array_agg(gs.score order by gs.completed_at desc nulls last, gs.started_at desc)
          filter (where gs.status = 'completed'))[1] score
      from public.game_sessions gs
      where gs.assignment_id = r.assignment_id and gs.student_id = r.recipient_id
    ) stats on true
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.assignment_id, 'studentId', s.recipient_id, 'studentName', s.display_name,
    'title', s.title, 'instructions', s.instructions, 'dueAt', s.due_at, 'createdAt', s.created_at,
    'activityId', s.activity_id, 'activityTitle', s.activity_title, 'activityRoute', s.activity_route,
    'engineType', s.engine_type, 'status', s.status, 'score', s.score,
    'startedAt', s.started_at, 'completedAt', s.completed_at
  ) order by s.created_at desc, s.display_name), '[]'::jsonb)
    into result from states s;
  return result;
end;
$$;
revoke all on function public.get_teacher_assignment_progress(uuid) from public, anon;
grant execute on function public.get_teacher_assignment_progress(uuid) to authenticated;

