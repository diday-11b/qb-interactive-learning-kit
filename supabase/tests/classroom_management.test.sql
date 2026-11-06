begin;
select plan(14);

insert into auth.users (id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
  ('00000000-0000-0000-0000-000000000701','authenticated','authenticated','class-teacher-a@example.test','','{}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000702','authenticated','authenticated','class-teacher-b@example.test','','{}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000703','authenticated','authenticated','class-student-a@example.test','','{}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000704','authenticated','authenticated','class-student-b@example.test','','{}','{}',now(),now())
on conflict(id) do nothing;
update public.profiles set role='teacher' where id in ('00000000-0000-0000-0000-000000000701','00000000-0000-0000-0000-000000000702');
insert into public.activities(slug,title,category,route,active,published,visibility,engine_type)
values('classroom-management-test','Classroom management test','reading','/game-player.html',true,true,'public','multiple_choice')
on conflict(slug) do update set active=true,published=true,visibility='public',engine_type='multiple_choice',route='/game-player.html';
insert into public.game_questions(activity_id,engine_type,ordinal,content,answer_key,published)
select id,'multiple_choice',1,
  '{"prompt":"Choose the letter A","choices":[{"id":"a","text":"A"},{"id":"b","text":"B"}]}'::jsonb,
  '{"choice_id":"a"}'::jsonb,true
from public.activities where slug='classroom-management-test'
on conflict(activity_id,ordinal) do update set published=true;

select ok(not has_column_privilege('authenticated','public.classes','join_code','SELECT'), 'learners cannot read invitation codes from the classes table');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000701',true);
select set_config('test.class_id',public.create_teacher_class('Classroom test group','Grade 1')->>'id',true);
select set_config('test.invite_code',(public.get_teacher_classroom(current_setting('test.class_id')::uuid)->'selectedClass'->>'joinCode'),true);
select ok((public.get_teacher_classroom(current_setting('test.class_id')::uuid)->'selectedClass'->>'joinCode') = current_setting('test.invite_code'), 'owner can manage and retrieve their class invitation');
select is((public.update_teacher_class(current_setting('test.class_id')::uuid,'Renamed classroom','Grade 2')->>'name'),'Renamed classroom','teacher can edit their own class and save the new name');
select throws_ok($$select public.create_teacher_class('renamed classroom','Grade 2')$$,
  '23505','You already have a class with that name.','class names are duplicate-checked without case sensitivity');
select throws_ok($$select public.create_teacher_class('   ','Grade 2')$$,
  '22023','Class name must be between 1 and 100 characters.','blank class names are rejected');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000702',true);
select throws_ok(format('select public.get_teacher_classroom(%L::uuid)',current_setting('test.class_id')),
  '42501','This class is unavailable.','another teacher cannot view the private class roster');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000703',true);
select is((public.join_class_with_code(current_setting('test.invite_code'))->>'alreadyJoined')::boolean,false,'student joins with a valid invitation code');
select is((public.join_class_with_code(current_setting('test.invite_code'))->>'alreadyJoined')::boolean,true,'re-entering the code does not duplicate membership');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000704',true);
select public.join_class_with_code(current_setting('test.invite_code'));
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000702',true);
select throws_ok($$select public.get_teacher_classroom(null,'00000000-0000-0000-0000-000000000703'::uuid)$$,
  '42501','This student is not in one of your classes.','teacher cannot open an unrelated student profile');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000701',true);
select is((public.get_teacher_classroom(current_setting('test.class_id')::uuid)->'selectedClass'->'students')::jsonb <> '[]'::jsonb,true,'joined learners appear in the authorized class roster');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000704',true);
select throws_ok($$select public.get_teacher_classroom(null,'00000000-0000-0000-0000-000000000703'::uuid)$$,
  '42501','Teacher access is required.','students cannot call the teacher classroom data RPC');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000701',true);
select set_config('test.assignment_id',public.create_teacher_assignment(current_setting('test.class_id')::uuid,
  (select id from public.activities where slug='classroom-management-test'),'Individual reading practice',
  '00000000-0000-0000-0000-000000000703'::uuid,null)->>'id',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000703',true);
select is((select count(*)::integer from public.assignments where id=current_setting('test.assignment_id')::uuid),1,'target learner can see their assignment');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000704',true);
select is((select count(*)::integer from public.assignments where id=current_setting('test.assignment_id')::uuid),0,'classmate cannot see another student-only assignment');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000701',true);
select public.remove_teacher_class_student(current_setting('test.class_id')::uuid,'00000000-0000-0000-0000-000000000703'::uuid);
select is((select count(*)::integer from public.class_members where class_id=current_setting('test.class_id')::uuid and student_id='00000000-0000-0000-0000-000000000703'),0,'teacher can remove a learner from their own class');

select * from finish();
rollback;
