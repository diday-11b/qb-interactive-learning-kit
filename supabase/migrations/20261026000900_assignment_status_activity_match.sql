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
      where gs.assignment_id = r.assignment_id and gs.student_id = r.recipient_id and gs.activity_id = r.activity_id
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