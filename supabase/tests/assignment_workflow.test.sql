begin;
select plan(16);

insert into auth.users (id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
  ('00000000-0000-0000-0000-000000000901','authenticated','authenticated','assign-teacher-a@example.test','','{}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000902','authenticated','authenticated','assign-teacher-b@example.test','','{}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000903','authenticated','authenticated','assign-student-a@example.test','','{}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000904','authenticated','authenticated','assign-student-b@example.test','','{}','{}',now(),now())
on conflict(id) do nothing;
update public.profiles set role='teacher' where id in ('00000000-0000-0000-0000-000000000901','00000000-0000-0000-0000-000000000902');
insert into public.activities(slug,title,category,route,active,published,visibility,engine_type)
values('assignment-workflow-test','Assignment workflow test','reading','/game-player.html',true,true,'public','multiple_choice')
on conflict(slug) do update set active=true,published=true,visibility='public',engine_type='multiple_choice';
insert into public.game_questions(activity_id,engine_type,ordinal,content,answer_key,published)
select id,'multiple_choice',1,
  '{"prompt":"Choose the letter A","choices":[{"id":"a","text":"A"},{"id":"b","text":"B"}]}'::jsonb,
  '{"choice_id":"a"}'::jsonb,true
from public.activities where slug='assignment-workflow-test'
on conflict(activity_id,ordinal) do update set published=true;

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000901',true);
select set_config('test.assignment_class',public.create_teacher_class('Assignment lifecycle test','Grade 1')->>'id',true);
select set_config('test.assignment_code',public.get_teacher_classroom(current_setting('test.assignment_class')::uuid)->'selectedClass'->>'joinCode',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000903',true);
select public.join_class_with_code(current_setting('test.assignment_code'));
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000904',true);
select public.join_class_with_code(current_setting('test.assignment_code'));
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000901',true);

select throws_ok($$select public.publish_teacher_assignment(
  current_setting('test.assignment_class')::uuid,
  (select id from public.activities where slug='assignment-workflow-test'),
  '   ', '', '{}'::uuid[], true, null, gen_random_uuid())$$,
  '22023','Assignment title must be between 1 and 120 characters.','blank assignment titles are rejected');
select throws_ok($$select public.publish_teacher_assignment(
  current_setting('test.assignment_class')::uuid,
  (select id from public.activities where slug='assignment-workflow-test'),
  'Past assignment', '', '{}'::uuid[], true, (current_date - 1)::timestamp at time zone 'UTC', gen_random_uuid())$$,
  '22023','The due date must be today or later.','past assignment deadlines are rejected');
select throws_ok($$select public.publish_teacher_assignment(
  current_setting('test.assignment_class')::uuid,
  (select id from public.activities where slug='assignment-workflow-test'),
  'Unauthorized recipient', '', array['00000000-0000-0000-0000-000000000902'::uuid], false, null, gen_random_uuid())$$,
  '42501','Every selected learner must belong to this class.','teachers cannot assign to an unrelated account');

select set_config('test.publish_result',public.publish_teacher_assignment(
  current_setting('test.assignment_class')::uuid,
  (select id from public.activities where slug='assignment-workflow-test'),
  'Weekly reading', 'Read each question out loud.', '{}', true, null,
  '00000000-0000-0000-0000-0000000009aa'::uuid
)::text,true);
select is((current_setting('test.publish_result')::jsonb->>'inserted_count')::integer,1,'class assignment publishes as one class row');
select is((select count(*)::integer from public.assignments where request_key='00000000-0000-0000-0000-0000000009aa'),1,'a publish request does not duplicate assignment rows');
select is((select instructions from public.assignments where request_key='00000000-0000-0000-0000-0000000009aa'),'Read each question out loud.','assignment instructions persist');
reset role;
insert into public.game_sessions(assignment_id,student_id,activity_id,status,score,completed_at)
select a.id,'00000000-0000-0000-0000-000000000903',a.activity_id,'completed',80,now()
from public.assignments a where a.request_key='00000000-0000-0000-0000-0000000009aa';
insert into public.game_sessions(assignment_id,student_id,activity_id,status)
select a.id,'00000000-0000-0000-0000-000000000904',a.activity_id,'in_progress'
from public.assignments a where a.request_key='00000000-0000-0000-0000-0000000009aa';
insert into public.activities(slug,title,category,route,active,published,visibility,engine_type)
values('assignment-workflow-wrong-activity','Unassigned activity','reading','/game-player.html',true,true,'public','multiple_choice')
on conflict(slug) do update set active=true,published=true,visibility='public',engine_type='multiple_choice';
insert into public.game_sessions(assignment_id,student_id,activity_id,status,score,completed_at)
select a.id,'00000000-0000-0000-0000-000000000903',wrong.id,'completed',100,now()+interval '1 second'
from public.assignments a cross join public.activities wrong
where a.request_key='00000000-0000-0000-0000-0000000009aa' and wrong.slug='assignment-workflow-wrong-activity';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000901',true);
select is((public.publish_teacher_assignment(
  current_setting('test.assignment_class')::uuid,
  (select id from public.activities where slug='assignment-workflow-test'),
  'Weekly reading', 'Read each question out loud.', '{}', true, null,
  '00000000-0000-0000-0000-0000000009aa'::uuid
)->>'inserted_count')::integer,0,'retry with the same request key is idempotent');
select is(jsonb_array_length(public.get_teacher_assignment_progress(current_setting('test.assignment_class')::uuid)),2,'teacher progress expands to both enrolled learners');
select is((select value->>'status' from jsonb_array_elements(public.get_teacher_assignment_progress(current_setting('test.assignment_class')::uuid)) as result_row(value) where value->>'studentId'='00000000-0000-0000-0000-000000000903'),'completed','saved completion is reflected in teacher progress');
select is((select value->>'status' from jsonb_array_elements(public.get_teacher_assignment_progress(current_setting('test.assignment_class')::uuid)) as result_row(value) where value->>'studentId'='00000000-0000-0000-0000-000000000904'),'in_progress','in-progress sessions update the matching learner assignment state');
select is((select (value->>'score')::integer from jsonb_array_elements(public.get_teacher_assignment_progress(current_setting('test.assignment_class')::uuid)) as result_row(value) where value->>'studentId'='00000000-0000-0000-0000-000000000903'),80,'teacher sees the score persisted by game results');
select is((select (value->>'score')::integer from jsonb_array_elements(public.get_teacher_assignment_progress(current_setting('test.assignment_class')::uuid)) as result_row(value) where value->>'studentId'='00000000-0000-0000-0000-000000000903'),80,'completion for a different activity cannot replace this assignment result');
select is((public.publish_teacher_assignment(
  current_setting('test.assignment_class')::uuid,
  (select id from public.activities where slug='assignment-workflow-test'),
  'Practice round', '', array['00000000-0000-0000-0000-000000000903'::uuid,
    '00000000-0000-0000-0000-000000000904'::uuid,'00000000-0000-0000-0000-000000000903'::uuid], false, null,
  '00000000-0000-0000-0000-0000000009ab'::uuid
)->>'inserted_count')::integer,2,'duplicate learner ids collapse to one recipient each');
select is((select count(*)::integer from public.assignments where request_key='00000000-0000-0000-0000-0000000009ab'),2,'targeted assignments persist once per learner');
select is(jsonb_array_length(public.get_teacher_assignment_progress(current_setting('test.assignment_class')::uuid)),4,'teacher progress includes both class and targeted assignment learners');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000902',true);
select throws_ok(format('select public.get_teacher_assignment_progress(%L::uuid)',current_setting('test.assignment_class')),
  '42501','You can only view assignments in your own classes.','another teacher cannot inspect assignment results');

select * from finish();
rollback;
