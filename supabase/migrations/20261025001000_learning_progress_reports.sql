-- Report audiences are resolved on the server; callers never get to choose
-- arbitrary student IDs. The same check is repeated for each report request.
create or replace function public.get_progress_report_students()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare uid uuid := (select auth.uid()); role_name text := (select private.current_role()); result jsonb;
begin
  if uid is null then raise exception 'Sign in to view learning reports.' using errcode = '42501'; end if;
  if role_name = 'student' then
    select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name) order by p.display_name), '[]'::jsonb)
      into result from public.profiles p where p.id = uid and p.role = 'student';
  elsif role_name = 'parent' then
    select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name) order by p.display_name), '[]'::jsonb)
      into result from public.parent_children pc join public.profiles p on p.id = pc.student_id and p.role = 'student'
      where pc.parent_id = uid;
  elsif role_name = 'teacher' then
    select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name) order by p.display_name), '[]'::jsonb)
      into result from public.profiles p
      where p.role = 'student' and exists (
        select 1 from public.class_members m join public.classes c on c.id = m.class_id
        where m.student_id = p.id and c.teacher_id = uid
      );
  else
    raise exception 'Progress reports are available to students, linked parents, and their teachers.' using errcode = '42501';
  end if;
  return coalesce(result, '[]'::jsonb);
end;
$$;

create or replace function public.get_progress_report(
  target_student uuid default null,
  period_start timestamptz default (now() - interval '30 days'),
  period_end timestamptz default now()
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  role_name text := (select private.current_role());
  student uuid;
  student_name text;
  report jsonb;
begin
  if uid is null then raise exception 'Sign in to view learning reports.' using errcode = '42501'; end if;
  if period_start is null or period_end is null or period_end <= period_start
    or period_end - period_start > interval '366 days' then
    raise exception 'Choose a valid report period of up to 12 months.' using errcode = '22023';
  end if;

  if role_name = 'student' then
    student := uid;
    if target_student is not null and target_student <> uid then
      raise exception 'You can only view your own learning report.' using errcode = '42501';
    end if;
  elsif role_name = 'parent' and target_student is not null and exists (
    select 1 from public.parent_children pc where pc.parent_id = uid and pc.student_id = target_student
  ) then
    student := target_student;
  elsif role_name = 'teacher' and target_student is not null and exists (
    select 1 from public.class_members m join public.classes c on c.id = m.class_id
    where m.student_id = target_student and c.teacher_id = uid
  ) then
    student := target_student;
  else
    raise exception 'This learner is not linked to your account or one of your classes.' using errcode = '42501';
  end if;

  select p.display_name into student_name from public.profiles p where p.id = student and p.role = 'student';
  if student_name is null then raise exception 'Student report is unavailable.' using errcode = '42501'; end if;

  with period_sessions as (
    select gs.* from public.game_sessions gs
    where gs.student_id = student and gs.started_at >= period_start and gs.started_at < period_end
  ), answers as (
    select a.session_id, count(*)::integer as total_answers,
      count(*) filter (where a.is_correct)::integer as correct_answers
    from public.game_session_answers a join period_sessions s on s.id = a.session_id
    group by a.session_id
  )
  select jsonb_build_object(
    'student', jsonb_build_object('id', student, 'name', student_name),
    'period', jsonb_build_object('from', period_start, 'to', period_end, 'basis', 'session start time'),
    'metrics', jsonb_build_object(
      'attemptCount', (select count(*)::integer from period_sessions),
      'completedRounds', (select count(*)::integer from period_sessions where status = 'completed'),
      'abandonedAttempts', (select count(*)::integer from period_sessions where status = 'abandoned'),
      'correctAnswers', coalesce((select sum(a.correct_answers)::integer from answers a), 0),
      'totalAnswers', coalesce((select sum(a.total_answers)::integer from answers a), 0),
      'averageScore', (select round(avg(s.score))::integer from period_sessions s where s.status = 'completed' and s.score is not null),
      'completionRate', (select case when count(*) = 0 then null else round(count(*) filter (where status = 'completed') * 100.0 / count(*))::integer end from period_sessions),
      'timeSpentSeconds', coalesce((select sum(s.duration_seconds)::integer from period_sessions s where s.status = 'completed' and s.duration_seconds is not null), 0),
      'timedCompletedRounds', (select count(*)::integer from period_sessions s where s.status = 'completed' and s.duration_seconds is not null)
    ),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object('id', item.activity_id, 'title', item.title, 'category', item.category,
        'attemptCount', item.attempt_count, 'completedRounds', item.completed_rounds,
        'averageScore', item.average_score, 'correctAnswers', item.correct_answers,
        'totalAnswers', item.total_answers) order by item.last_started desc)
      from (
        select act.id activity_id, act.title, act.category, max(s.started_at) last_started,
          count(*)::integer attempt_count, count(*) filter (where s.status = 'completed')::integer completed_rounds,
          round(avg(s.score) filter (where s.status = 'completed' and s.score is not null))::integer average_score,
          coalesce(sum(a.correct_answers),0)::integer correct_answers,
          coalesce(sum(a.total_answers),0)::integer total_answers
        from period_sessions s join public.activities act on act.id = s.activity_id
        left join answers a on a.session_id = s.id
        group by act.id, act.title, act.category
      ) item
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('category', item.category,
        'attemptCount', item.attempt_count, 'completedRounds', item.completed_rounds,
        'correctAnswers', item.correct_answers, 'totalAnswers', item.total_answers,
        'accuracy', case when item.total_answers = 0 then null else round(item.correct_answers * 100.0 / item.total_answers)::integer end,
        'averageScore', item.average_score) order by item.category)
      from (
        select act.category, count(*)::integer attempt_count,
          count(*) filter (where s.status = 'completed')::integer completed_rounds,
          coalesce(sum(a.correct_answers),0)::integer correct_answers,
          coalesce(sum(a.total_answers),0)::integer total_answers,
          round(avg(s.score) filter (where s.status = 'completed' and s.score is not null))::integer average_score
        from period_sessions s join public.activities act on act.id = s.activity_id
        left join answers a on a.session_id = s.id
        group by act.category
      ) item
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object('sessionId', s.id, 'activityTitle', act.title,
        'category', act.category, 'status', s.status, 'score', case when s.status = 'completed' then s.score else null end,
        'correctAnswers', coalesce(a.correct_answers,0), 'totalAnswers', coalesce(a.total_answers,0),
        'startedAt', s.started_at, 'completedAt', s.completed_at,
        'durationSeconds', case when s.status = 'completed' then s.duration_seconds else null end)
        order by s.started_at desc)
      from (select * from period_sessions order by started_at desc limit 50) s
      join public.activities act on act.id = s.activity_id left join answers a on a.session_id = s.id
    ), '[]'::jsonb),
    'strengths', coalesce((select jsonb_agg(jsonb_build_object('category', c.category, 'accuracy', c.accuracy, 'answers', c.total_answers))
      from (select act.category, count(*) filter (where a.is_correct)::integer correct_answers,
        count(*)::integer total_answers, round(count(*) filter (where a.is_correct) * 100.0 / count(*))::integer accuracy
        from period_sessions s join public.activities act on act.id=s.activity_id
        join public.game_session_answers a on a.session_id=s.id
        group by act.category having count(*) >= 5 and count(*) filter (where a.is_correct)::numeric / count(*) >= 0.8) c), '[]'::jsonb),
    'practiceTopics', coalesce((select jsonb_agg(jsonb_build_object('category', c.category, 'accuracy', c.accuracy, 'answers', c.total_answers))
      from (select act.category, count(*) filter (where a.is_correct)::integer correct_answers,
        count(*)::integer total_answers, round(count(*) filter (where a.is_correct) * 100.0 / count(*))::integer accuracy
        from period_sessions s join public.activities act on act.id=s.activity_id
        join public.game_session_answers a on a.session_id=s.id
        group by act.category having count(*) >= 5 and count(*) filter (where a.is_correct)::numeric / count(*) < 0.6) c), '[]'::jsonb),
    'recommendations', coalesce((
      select jsonb_agg(jsonb_build_object('activityId', picks.id, 'title', picks.title, 'category', picks.category,
        'route', picks.route, 'engineType', picks.engine_type, 'assignmentId', picks.assignment_id,
        'reason', case when picks.needs_practice then 'Suggested practice for ' || replace(picks.category, '_', ' ') else 'A new activity to explore' end))
      from (
        select act.id, act.title, act.category, act.route, act.engine_type, assignment.assignment_id,
          exists(select 1 from public.game_session_answers wa join public.game_sessions ws on ws.id=wa.session_id
            join public.activities wact on wact.id=ws.activity_id
            where ws.student_id=student and wact.category=act.category and ws.started_at>=period_start and ws.started_at<period_end
            group by wact.category having count(*)>=5 and count(*) filter(where wa.is_correct)::numeric/count(*)<0.6) needs_practice
        from public.activities act
        left join lateral (
          select a.id assignment_id from public.assignments a join public.class_members m on m.class_id=a.class_id
          where m.student_id=student and a.activity_id=act.id and (a.student_id is null or a.student_id=student)
          order by a.created_at desc limit 1
        ) assignment on true
        where act.active and act.published and act.engine_type is not null and act.route='/game-player.html'
          and (select count(*) from public.game_questions q where q.activity_id=act.id and q.published)
            >= case when act.engine_type='picture_guessing' then 10 else 1 end
          and (act.visibility='public' or assignment.assignment_id is not null)
          and not exists(select 1 from public.game_sessions done where done.student_id=student and done.activity_id=act.id and done.status='completed')
          and (not exists(select 1 from public.game_session_answers wa join public.game_sessions ws on ws.id=wa.session_id join public.activities wact on wact.id=ws.activity_id
            where ws.student_id=student and ws.started_at>=period_start and ws.started_at<period_end and wact.category=act.category
            group by wact.category having count(*)>=5 and count(*) filter(where wa.is_correct)::numeric/count(*)<0.6)
            or exists(select 1 from public.game_session_answers wa join public.game_sessions ws on ws.id=wa.session_id join public.activities wact on wact.id=ws.activity_id
            where ws.student_id=student and ws.started_at>=period_start and ws.started_at<period_end and wact.category=act.category
            group by wact.category having count(*)>=5 and count(*) filter(where wa.is_correct)::numeric/count(*)<0.6))
        order by (assignment.assignment_id is null), act.title limit 4
      ) picks
    ), '[]'::jsonb)
  ) into report;

  return report;
end;
$$;

revoke all on function public.get_progress_report_students() from public, anon;
revoke all on function public.get_progress_report(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.get_progress_report_students() to authenticated;
grant execute on function public.get_progress_report(uuid, timestamptz, timestamptz) to authenticated;
