-- Teacher dashboard summary. All records are scoped to the authenticated
-- teacher's own classes; no client-supplied teacher or student IDs are used.
create or replace function public.get_teacher_dashboard(days_back integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_teacher_id uuid := (select auth.uid());
  window_start timestamptz := now() - make_interval(days => greatest(1, least(coalesce(days_back, 30), 90)));
  summary jsonb;
begin
  if current_teacher_id is null or (select private.current_role()) <> 'teacher' then
    raise exception 'Teacher access is required' using errcode = '42501';
  end if;

  with own_classes as (
    select c.id, c.name, c.grade_level
    from public.classes c where c.teacher_id = current_teacher_id
  ),
  roster as (
    select m.student_id, m.class_id, p.display_name, oc.name as class_name
    from own_classes oc
    join public.class_members m on m.class_id = oc.id
    join public.profiles p on p.id = m.student_id and p.role = 'student'
  ),
  active_assignments as (
    select a.id, a.class_id, a.title, a.created_at, a.due_at,
      act.title as activity_title, oc.name as class_name,
      case when a.student_id is not null then 1
        else (select count(*) from roster r where r.class_id = a.class_id)::integer end as student_count
    from public.assignments a
    join own_classes oc on oc.id = a.class_id
    join public.activities act on act.id = a.activity_id
    where act.active and act.published and (a.due_at is null or a.due_at >= now())
  ),
  assignment_totals as (
    select count(*)::integer as total,
      coalesce(sum(aa.student_count), 0)::integer as expected_completions,
      (select count(*)::integer
       from (select distinct gs.assignment_id, gs.student_id
         from public.game_sessions gs
         join active_assignments aa2 on aa2.id = gs.assignment_id
         where gs.status = 'completed' and gs.completed_at >= window_start
       ) done) as completed_students
    from active_assignments aa
  ),
  completed_sessions as (
    select gs.id, gs.student_id, gs.assignment_id, gs.activity_id,
      gs.started_at, gs.completed_at, gs.score, gs.status,
      p.display_name, act.title as activity_title,
      coalesce(a.title, act.title) as assignment_title,
      oc.name as class_name
    from public.game_sessions gs
    join roster r on r.student_id = gs.student_id
    join own_classes oc on oc.id = r.class_id
    join public.profiles p on p.id = gs.student_id
    join public.activities act on act.id = gs.activity_id
    left join public.assignments a on a.id = gs.assignment_id and a.class_id = oc.id
    where gs.started_at >= window_start
      and (
        (gs.assignment_id is not null and a.id is not null)
        or (gs.assignment_id is null and r.class_id = (
          select min(r2.class_id) from roster r2 where r2.student_id = gs.student_id
        ))
      )
  ),
  latest_student_scores as (
    select distinct on (cs.student_id)
      cs.student_id, cs.display_name, cs.class_name, cs.score, cs.completed_at,
      cs.activity_title
    from completed_sessions cs
    where cs.status = 'completed' and cs.score is not null
    order by cs.student_id, cs.completed_at desc
  )
  select jsonb_build_object(
    'periodDays', greatest(1, least(coalesce(days_back, 30), 90)),
    'studentCount', (select count(distinct student_id)::integer from roster),
    'classCount', (select count(*)::integer from own_classes),
    'publishedActivityCount', (select count(*)::integer from public.activities act
      where act.active and act.published and (act.visibility = 'public' or exists (
        select 1 from public.assignments a join own_classes oc on oc.id = a.class_id
        where a.activity_id = act.id
      ))),
    'activeAssignmentCount', (select total from assignment_totals),
    'completionRate', case when (select expected_completions from assignment_totals) = 0 then null
      else round(100.0 * least((select completed_students from assignment_totals),
        (select expected_completions from assignment_totals)) /
        (select expected_completions from assignment_totals))::integer end,
    'completedAssignmentStudents', (select completed_students from assignment_totals),
    'expectedAssignmentStudents', (select expected_completions from assignment_totals),
    'completedSessionCount', (select count(*)::integer from completed_sessions where status = 'completed'),
    'averageScore', (select round(avg(score))::integer from completed_sessions where status = 'completed' and score is not null),
    'classes', coalesce((select jsonb_agg(jsonb_build_object(
      'id', oc.id, 'name', oc.name, 'gradeLevel', oc.grade_level,
      'studentCount', (select count(*)::integer from roster r where r.class_id = oc.id),
      'activeAssignmentCount', (select count(*)::integer from active_assignments aa where aa.class_id = oc.id)
    ) order by oc.name) from own_classes oc), '[]'::jsonb),
    'assignments', coalesce((select jsonb_agg(jsonb_build_object(
      'id', aa.id, 'title', aa.title, 'activityTitle', aa.activity_title,
      'className', aa.class_name, 'studentCount', aa.student_count,
      'completedCount', (select count(distinct gs.student_id)::integer from public.game_sessions gs
        where gs.assignment_id = aa.id and gs.status = 'completed' and gs.completed_at >= window_start),
      'dueAt', aa.due_at
    ) order by aa.due_at nulls last, aa.created_at desc) from active_assignments aa), '[]'::jsonb),
    'recentActivity', coalesce((select jsonb_agg(jsonb_build_object(
      'studentName', cs.display_name, 'activityTitle', cs.activity_title,
      'assignmentTitle', cs.assignment_title, 'className', cs.class_name,
      'status', cs.status, 'score', cs.score, 'startedAt', cs.started_at,
      'completedAt', cs.completed_at
    ) order by cs.started_at desc) from (select * from completed_sessions order by started_at desc limit 8) cs), '[]'::jsonb),
    'studentsNeedingPractice', coalesce((select jsonb_agg(jsonb_build_object(
      'studentName', lss.display_name, 'className', lss.class_name,
      'score', lss.score, 'activityTitle', lss.activity_title, 'completedAt', lss.completed_at
    ) order by lss.score, lss.display_name) from latest_student_scores lss where lss.score < 60), '[]'::jsonb)
  ) into summary;

  return summary;
end;
$$;

revoke all on function public.get_teacher_dashboard(integer) from public, anon;
grant execute on function public.get_teacher_dashboard(integer) to authenticated;
