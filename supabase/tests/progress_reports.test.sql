begin;
select plan(20);

insert into auth.users (id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('00000000-0000-0000-0000-00000000a001','authenticated','authenticated','report-teacher@example.test','','{}','{}',now(),now()),
 ('00000000-0000-0000-0000-00000000a002','authenticated','authenticated','report-parent@example.test','','{}','{}',now(),now()),
 ('00000000-0000-0000-0000-00000000a003','authenticated','authenticated','report-child@example.test','','{}','{}',now(),now()),
 ('00000000-0000-0000-0000-00000000a004','authenticated','authenticated','report-other-child@example.test','','{}','{}',now(),now()),
 ('00000000-0000-0000-0000-00000000a005','authenticated','authenticated','report-second-child@example.test','','{}','{}',now(),now()),
 ('00000000-0000-0000-0000-00000000a006','authenticated','authenticated','report-unlinked-parent@example.test','','{}','{}',now(),now())
on conflict(id) do nothing;
update public.profiles set role='teacher' where id='00000000-0000-0000-0000-00000000a001';
update public.profiles set role='parent' where id='00000000-0000-0000-0000-00000000a002';
update public.profiles set role='parent' where id='00000000-0000-0000-0000-00000000a006';
insert into public.classes(id,name,teacher_id) values('00000000-0000-0000-0000-00000000a101','Report test class','00000000-0000-0000-0000-00000000a001');
insert into public.class_members(class_id,student_id) values('00000000-0000-0000-0000-00000000a101','00000000-0000-0000-0000-00000000a003');
insert into public.parent_children(parent_id,student_id) values('00000000-0000-0000-0000-00000000a002','00000000-0000-0000-0000-00000000a003');
insert into public.parent_children(parent_id,student_id) values('00000000-0000-0000-0000-00000000a002','00000000-0000-0000-0000-00000000a005');
insert into public.activities(id,slug,title,category,route,active,published,visibility,engine_type)
values('00000000-0000-0000-0000-00000000a102','progress-report-test','Progress report test','phonics','/game-player.html',true,true,'public','multiple_choice')
on conflict(id) do nothing;
insert into public.literacy_activities(id,slug,title,language,learning_area,learning_objective,instructions,published)
values('00000000-0000-0000-0000-00000000a301','progress-report-literacy-test','Literacy report test','km','alphabet','Recognize letters','Choose the letter.',true)
on conflict(id) do nothing;
insert into public.literacy_questions(id,activity_id,position,prompt,choices) values
 ('00000000-0000-0000-0000-00000000a302','00000000-0000-0000-0000-00000000a301',1,'Letter one','[{"id":"a","text":"A"},{"id":"b","text":"B"}]'),
 ('00000000-0000-0000-0000-00000000a303','00000000-0000-0000-0000-00000000a301',2,'Letter two','[{"id":"a","text":"A"},{"id":"b","text":"B"}]')
on conflict(id) do nothing;
insert into public.achievements(id,slug,title,description,icon)
values('00000000-0000-0000-0000-00000000a108','report-test-reward','Reading explorer','Finished a reading activity','★')
on conflict(id) do nothing;
insert into public.student_achievements(student_id,achievement_id) values
 ('00000000-0000-0000-0000-00000000a003','00000000-0000-0000-0000-00000000a108'),
 ('00000000-0000-0000-0000-00000000a004','00000000-0000-0000-0000-00000000a108')
on conflict do nothing;
insert into public.game_questions(id,activity_id,engine_type,ordinal,content,answer_key,published)
select ('00000000-0000-0000-0000-00000000a'||lpad((110+n)::text,3,'0'))::uuid, '00000000-0000-0000-0000-00000000a102', 'multiple_choice', n,
  '{"prompt":"Choose A","choices":[{"id":"a","text":"A"},{"id":"b","text":"B"}]}'::jsonb,
  '{"choice_id":"a"}'::jsonb,true
from generate_series(1,7) as generated(n)
on conflict(activity_id,ordinal) do nothing;
insert into public.game_sessions(id,student_id,activity_id,started_at,completed_at,duration_seconds,score,status) values
 ('00000000-0000-0000-0000-00000000a201','00000000-0000-0000-0000-00000000a003','00000000-0000-0000-0000-00000000a102',now()-interval '1 day',now()-interval '1 day'+interval '2 minutes',120,80,'completed'),
 ('00000000-0000-0000-0000-00000000a202','00000000-0000-0000-0000-00000000a003','00000000-0000-0000-0000-00000000a102',now()-interval '2 days',null,null,null,'abandoned'),
 ('00000000-0000-0000-0000-00000000a203','00000000-0000-0000-0000-00000000a003','00000000-0000-0000-0000-00000000a102',now()-interval '3 days',null,null,null,'in_progress'),
 ('00000000-0000-0000-0000-00000000a204','00000000-0000-0000-0000-00000000a003','00000000-0000-0000-0000-00000000a102',now()-interval '4 days',now()-interval '4 days'+interval '2 minutes',120,81,'completed');
insert into public.game_session_questions(session_id,question_id,position,content_snapshot,answer_key_snapshot)
select '00000000-0000-0000-0000-00000000a201',q.id,row_number() over(order by q.ordinal)::smallint,q.content,q.answer_key
from public.game_questions q where q.activity_id='00000000-0000-0000-0000-00000000a102' and q.ordinal between 1 and 5;
insert into public.game_session_questions(session_id,question_id,position,content_snapshot,answer_key_snapshot)
select '00000000-0000-0000-0000-00000000a202',q.id,1,q.content,q.answer_key from public.game_questions q
where q.activity_id='00000000-0000-0000-0000-00000000a102' and q.ordinal=6;
insert into public.game_session_questions(session_id,question_id,position,content_snapshot,answer_key_snapshot)
select '00000000-0000-0000-0000-00000000a203',q.id,1,q.content,q.answer_key from public.game_questions q
where q.activity_id='00000000-0000-0000-0000-00000000a102' and q.ordinal=7;
insert into public.game_session_questions(session_id,question_id,position,content_snapshot,answer_key_snapshot)
select '00000000-0000-0000-0000-00000000a204',q.id,1,q.content,q.answer_key from public.game_questions q
where q.activity_id='00000000-0000-0000-0000-00000000a102' and q.ordinal=1;
insert into public.game_session_answers(session_id,position,response,is_correct)
select '00000000-0000-0000-0000-00000000a201',n,'{"choice_id":"a"}'::jsonb,n<=4 from generate_series(1,5) as generated(n);
insert into public.game_session_answers(session_id,position,response,is_correct)
values('00000000-0000-0000-0000-00000000a202',1,'{"choice_id":"b"}'::jsonb,false);
insert into public.game_session_answers(session_id,position,response,is_correct)
values('00000000-0000-0000-0000-00000000a204',1,'{"choice_id":"b"}'::jsonb,false);
insert into public.literacy_attempts(id,student_id,activity_id,total_questions,status,score,started_at,completed_at) values
 ('00000000-0000-0000-0000-00000000a304','00000000-0000-0000-0000-00000000a003','00000000-0000-0000-0000-00000000a301',2,'completed',100,now()-interval '12 hours',now()-interval '11 hours'),
 ('00000000-0000-0000-0000-00000000a305','00000000-0000-0000-0000-00000000a003','00000000-0000-0000-0000-00000000a301',2,'abandoned',null,now()-interval '2 days',null);
insert into public.literacy_answers(attempt_id,question_id,choice_id,is_correct) values
 ('00000000-0000-0000-0000-00000000a304','00000000-0000-0000-0000-00000000a302','a',true),
 ('00000000-0000-0000-0000-00000000a304','00000000-0000-0000-0000-00000000a303','a',true),
 ('00000000-0000-0000-0000-00000000a305','00000000-0000-0000-0000-00000000a302','b',false);

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000a002',true);
select is(jsonb_array_length(public.get_progress_report_students()),2,'parent report picker supports multiple linked children');
select ok(not exists(select 1 from jsonb_array_elements(public.get_progress_report_students()) child where child->>'id'='00000000-0000-0000-0000-00000000a004'),'parent picker excludes unrelated children');
select is((public.get_progress_report('00000000-0000-0000-0000-00000000a005',now()-interval '7 days',now()+interval '1 day')->'metrics'->>'attemptCount')::integer,0,'parent can open a second linked child report with a real empty state');
select is((select count(*)::integer from public.student_achievements),1,'parent can read earned rewards for linked children only');
select is((public.get_progress_report('00000000-0000-0000-0000-00000000a003',now()-interval '30 days',now()+interval '1 day')->'metrics'->>'attemptCount')::integer,6,'attempt count includes game and literacy attempts, repeats, abandoned, and in-progress');
select is((public.get_progress_report('00000000-0000-0000-0000-00000000a003',now()-interval '30 days',now()+interval '1 day')->'metrics'->>'completedRounds')::integer,3,'only completed game and literacy attempts count as completed');
select is((public.get_progress_report('00000000-0000-0000-0000-00000000a003',now()-interval '30 days',now()+interval '1 day')->'metrics'->>'correctAnswers')::integer,6,'correct answer total matches saved game and literacy answer rows');
select is((public.get_progress_report('00000000-0000-0000-0000-00000000a003',now()-interval '30 days',now()+interval '1 day')->'metrics'->>'totalAnswers')::integer,10,'answer denominator includes persisted game and literacy answers');
select is((public.get_progress_report('00000000-0000-0000-0000-00000000a003',now()-interval '30 days',now()+interval '1 day')->'metrics'->>'averageScore')::integer,87,'average score includes completed games and literacy attempts; incomplete attempts are excluded');
select is((public.get_progress_report('00000000-0000-0000-0000-00000000a003',now()-interval '30 days',now()+interval '1 day')->'metrics'->>'completionRate')::integer,50,'completion rate is completed rounds divided by all attempts');
select is((public.get_progress_report('00000000-0000-0000-0000-00000000a003',now()-interval '30 days',now()+interval '1 day')->'metrics'->>'timeSpentSeconds')::integer,240,'time includes only completed sessions with recorded duration');
select is((public.get_progress_report('00000000-0000-0000-0000-00000000a003',now()-interval '36 hours',now()+interval '1 day')->'metrics'->>'attemptCount')::integer,2,'date filters use session start time across game and literacy attempts');
select is((public.get_progress_report('00000000-0000-0000-0000-00000000a003',now()+interval '10 days',now()+interval '11 days')->'metrics'->>'attemptCount')::integer,0,'empty report period returns zero attempts without fabricated activity');
select throws_ok($$select public.get_progress_report('00000000-0000-0000-0000-00000000a004',now()-interval '30 days',now())$$,
  '42501','This learner is not linked to your account or one of your classes.','parent cannot read an unlinked student report');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000a006',true);
select is(jsonb_array_length(public.get_progress_report_students()),0,'parent with no linked children receives an empty list');
select is((select count(*)::integer from public.student_achievements),0,'parent without linked children sees no rewards');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000a001',true);
select is(jsonb_array_length(public.get_progress_report_students()),1,'teacher report picker includes students in owned classes');
select throws_ok($$select public.get_progress_report('00000000-0000-0000-0000-00000000a004',now()-interval '30 days',now())$$,
  '42501','This learner is not linked to your account or one of your classes.','teacher cannot read a student outside owned classes');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000a003',true);
select is((public.get_progress_report(null,now()-interval '30 days',now()+interval '1 day')->'metrics'->>'attemptCount')::integer,6,'student can read own game and literacy report');
select throws_ok($$select public.get_progress_report('00000000-0000-0000-0000-00000000a004',now()-interval '30 days',now())$$,
  '42501','You can only view your own learning report.','student cannot access another student report');

select * from finish();
rollback;
