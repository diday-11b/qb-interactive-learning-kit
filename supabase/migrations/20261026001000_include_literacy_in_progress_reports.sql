-- Keep the established game report as a private base and extend it with the
-- separately persisted Khmer/English literacy attempts and answers.
alter function public.get_progress_report(uuid, timestamptz, timestamptz)
  rename to get_game_progress_report;
revoke all on function public.get_game_progress_report(uuid, timestamptz, timestamptz)
  from public, anon, authenticated;

create or replace function public.get_progress_report(
  target_student uuid default null,
  period_start timestamptz default (now() - interval '30 days'),
  period_end timestamptz default now()
)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  report jsonb;
  metrics jsonb;
  student uuid;
  literacy_attempts integer;
  literacy_completed integer;
  literacy_abandoned integer;
  literacy_correct integer;
  literacy_answers integer;
  all_attempts integer;
  all_completed integer;
  combined_score jsonb;
  activity_items jsonb;
  category_items jsonb;
  history_items jsonb;
  strengths jsonb;
  practice_topics jsonb;
begin
  -- The original server function remains the authority for caller role,
  -- student identity, allowed parent links, teacher class membership, and dates.
  report := public.get_game_progress_report(target_student, period_start, period_end);
  student := (report->'student'->>'id')::uuid;

  select count(*)::integer,
      count(*) filter (where a.status='completed')::integer,
      count(*) filter (where a.status='abandoned')::integer,
      coalesce(sum(ans.correct_answers),0)::integer,
      coalesce(sum(ans.total_answers),0)::integer
    into literacy_attempts, literacy_completed, literacy_abandoned, literacy_correct, literacy_answers
  from public.literacy_attempts a
  left join lateral (
    select count(*) filter (where x.is_correct)::integer correct_answers, count(*)::integer total_answers
    from public.literacy_answers x where x.attempt_id=a.id
  ) ans on true
  where a.student_id=student and a.started_at>=period_start and a.started_at<period_end;

  metrics := report->'metrics';
  all_attempts := coalesce((metrics->>'attemptCount')::integer,0) + literacy_attempts;
  all_completed := coalesce((metrics->>'completedRounds')::integer,0) + literacy_completed;
  metrics := jsonb_set(metrics,'{attemptCount}',to_jsonb(all_attempts),true);
  metrics := jsonb_set(metrics,'{completedRounds}',to_jsonb(all_completed),true);
  metrics := jsonb_set(metrics,'{abandonedAttempts}',to_jsonb(coalesce((metrics->>'abandonedAttempts')::integer,0)+literacy_abandoned),true);
  metrics := jsonb_set(metrics,'{correctAnswers}',to_jsonb(coalesce((metrics->>'correctAnswers')::integer,0)+literacy_correct),true);
  metrics := jsonb_set(metrics,'{totalAnswers}',to_jsonb(coalesce((metrics->>'totalAnswers')::integer,0)+literacy_answers),true);
  metrics := jsonb_set(metrics,'{completionRate}',case when all_attempts=0 then 'null'::jsonb else to_jsonb(round(all_completed*100.0/all_attempts)::integer) end,true);

  select case when count(*)=0 then 'null'::jsonb else to_jsonb(round(avg(score))::integer) end
    into combined_score
  from (
    select gs.score from public.game_sessions gs
      where gs.student_id=student and gs.started_at>=period_start and gs.started_at<period_end
        and gs.status='completed' and gs.score is not null
    union all
    select la.score from public.literacy_attempts la
      where la.student_id=student and la.started_at>=period_start and la.started_at<period_end
        and la.status='completed' and la.score is not null
  ) scored;
  metrics := jsonb_set(metrics,'{averageScore}',coalesce(combined_score,'null'::jsonb),true);

  with game_rows as (
    select gs.activity_id, act.title, act.category, gs.started_at, gs.status, gs.score,
      coalesce(ans.correct_answers,0)::integer correct_answers, coalesce(ans.total_answers,0)::integer total_answers
    from public.game_sessions gs join public.activities act on act.id=gs.activity_id
    left join lateral (
      select count(*) filter (where x.is_correct)::integer correct_answers, count(*)::integer total_answers
      from public.game_session_answers x where x.session_id=gs.id
    ) ans on true
    where gs.student_id=student and gs.started_at>=period_start and gs.started_at<period_end
  ), literacy_rows as (
    select la.activity_id, act.title, act.learning_area as category, la.started_at, la.status, la.score,
      coalesce(ans.correct_answers,0)::integer correct_answers, coalesce(ans.total_answers,0)::integer total_answers
    from public.literacy_attempts la join public.literacy_activities act on act.id=la.activity_id
    left join lateral (
      select count(*) filter (where x.is_correct)::integer correct_answers, count(*)::integer total_answers
      from public.literacy_answers x where x.attempt_id=la.id
    ) ans on true
    where la.student_id=student and la.started_at>=period_start and la.started_at<period_end
  ), all_rows as (select * from game_rows union all select * from literacy_rows)
  select coalesce(jsonb_agg(jsonb_build_object('id',item.activity_id,'title',item.title,'category',item.category,
      'attemptCount',item.attempt_count,'completedRounds',item.completed_rounds,'averageScore',item.average_score,
      'correctAnswers',item.correct_answers,'totalAnswers',item.total_answers) order by item.last_started desc),'[]'::jsonb)
    into activity_items
  from (
    select activity_id,title,category,max(started_at) last_started,count(*)::integer attempt_count,
      count(*) filter(where status='completed')::integer completed_rounds,
      round(avg(score) filter(where status='completed' and score is not null))::integer average_score,
      sum(correct_answers)::integer correct_answers,sum(total_answers)::integer total_answers
    from all_rows group by activity_id,title,category
  ) item;

  with game_rows as (
    select act.category, gs.status, gs.score, coalesce(ans.correct_answers,0)::integer correct_answers,
      coalesce(ans.total_answers,0)::integer total_answers
    from public.game_sessions gs join public.activities act on act.id=gs.activity_id
    left join lateral (select count(*) filter(where x.is_correct)::integer correct_answers,count(*)::integer total_answers
      from public.game_session_answers x where x.session_id=gs.id) ans on true
    where gs.student_id=student and gs.started_at>=period_start and gs.started_at<period_end
  ), literacy_rows as (
    select act.learning_area category, la.status, la.score, coalesce(ans.correct_answers,0)::integer correct_answers,
      coalesce(ans.total_answers,0)::integer total_answers
    from public.literacy_attempts la join public.literacy_activities act on act.id=la.activity_id
    left join lateral (select count(*) filter(where x.is_correct)::integer correct_answers,count(*)::integer total_answers
      from public.literacy_answers x where x.attempt_id=la.id) ans on true
    where la.student_id=student and la.started_at>=period_start and la.started_at<period_end
  ), all_rows as (select * from game_rows union all select * from literacy_rows)
  select coalesce(jsonb_agg(jsonb_build_object('category',item.category,'attemptCount',item.attempt_count,
      'completedRounds',item.completed_rounds,'correctAnswers',item.correct_answers,'totalAnswers',item.total_answers,
      'accuracy',case when item.total_answers=0 then null else round(item.correct_answers*100.0/item.total_answers)::integer end,
      'averageScore',item.average_score) order by item.category),'[]'::jsonb)
    into category_items
  from (
    select category,count(*)::integer attempt_count,count(*) filter(where status='completed')::integer completed_rounds,
      sum(correct_answers)::integer correct_answers,sum(total_answers)::integer total_answers,
      round(avg(score) filter(where status='completed' and score is not null))::integer average_score
    from all_rows group by category
  ) item;

  select coalesce(jsonb_agg(entry order by started_at desc),'[]'::jsonb) into history_items
  from (
    select entry,started_at from (
      select item entry,(item->>'startedAt')::timestamptz started_at from jsonb_array_elements(report->'history') item
      union all
      select jsonb_build_object('sessionId',la.id,'activityTitle',act.title,'category',act.learning_area,
        'status',la.status,'score',case when la.status='completed' then la.score else null end,
        'correctAnswers',coalesce(ans.correct_answers,0),'totalAnswers',coalesce(ans.total_answers,0),
        'startedAt',la.started_at,'completedAt',la.completed_at,'durationSeconds',null),la.started_at
      from public.literacy_attempts la join public.literacy_activities act on act.id=la.activity_id
      left join lateral (select count(*) filter(where x.is_correct)::integer correct_answers,count(*)::integer total_answers
        from public.literacy_answers x where x.attempt_id=la.id) ans on true
      where la.student_id=student and la.started_at>=period_start and la.started_at<period_end
    ) combined order by started_at desc limit 50
  ) recent;

  select coalesce(jsonb_agg(jsonb_build_object('category',item->>'category','accuracy',(item->>'accuracy')::integer,
      'answers',(item->>'totalAnswers')::integer) order by item->>'category'),'[]'::jsonb)
    into strengths from jsonb_array_elements(category_items) item
    where (item->>'totalAnswers')::integer>=5 and (item->>'accuracy')::integer>=80;
  select coalesce(jsonb_agg(jsonb_build_object('category',item->>'category','accuracy',(item->>'accuracy')::integer,
      'answers',(item->>'totalAnswers')::integer) order by item->>'category'),'[]'::jsonb)
    into practice_topics from jsonb_array_elements(category_items) item
    where (item->>'totalAnswers')::integer>=5 and (item->>'accuracy')::integer<60;

  report := jsonb_set(report,'{metrics}',metrics,true);
  report := jsonb_set(report,'{activities}',activity_items,true);
  report := jsonb_set(report,'{categories}',category_items,true);
  report := jsonb_set(report,'{history}',history_items,true);
  report := jsonb_set(report,'{strengths}',strengths,true);
  report := jsonb_set(report,'{practiceTopics}',practice_topics,true);
  return report;
end;
$$;

revoke all on function public.get_progress_report(uuid,timestamptz,timestamptz) from public,anon;
grant execute on function public.get_progress_report(uuid,timestamptz,timestamptz) to authenticated;
