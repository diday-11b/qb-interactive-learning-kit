begin;
select plan(6);

-- Isolated fixture data: these examples exist only inside this rolled-back test.
insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000101', 'authenticated', 'authenticated', 'privacy-student-a@example.test', '', '{}', '{"display_name":"Test A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000102', 'authenticated', 'authenticated', 'privacy-student-b@example.test', '', '{}', '{"display_name":"Test B"}', now(), now()),
  ('00000000-0000-0000-0000-000000000103', 'authenticated', 'authenticated', 'privacy-teacher@example.test', '', '{}', '{"display_name":"Test Teacher"}', now(), now()),
  ('00000000-0000-0000-0000-000000000104', 'authenticated', 'authenticated', 'privacy-parent@example.test', '', '{}', '{"display_name":"Test Parent"}', now(), now())
on conflict (id) do nothing;

update public.profiles set role = 'teacher' where id = '00000000-0000-0000-0000-000000000103';
update public.profiles set role = 'parent' where id = '00000000-0000-0000-0000-000000000104';

insert into public.activities (slug, title, category, route)
values ('privacy-test-activity', 'Privacy test activity', 'reading', '/test')
on conflict (slug) do nothing;

insert into public.classes (id, name, teacher_id)
values ('00000000-0000-0000-0000-000000000201', 'Privacy test class', '00000000-0000-0000-0000-000000000103');
insert into public.class_members (class_id, student_id)
values ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101');
insert into public.parent_children (parent_id, student_id)
values ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000101');
insert into public.assignments (id, class_id, activity_id, title, created_by)
select '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000201', a.id,
  'Privacy test assignment', '00000000-0000-0000-0000-000000000103'
from public.activities a where a.slug = 'privacy-test-activity';

insert into public.game_sessions (student_id, activity_id, started_at, completed_at, status, score, stars_earned)
select '00000000-0000-0000-0000-000000000101', a.id, now(), now(), 'completed', 42, 3
from public.activities a where a.slug = 'privacy-test-activity';
insert into public.game_sessions (student_id, activity_id, started_at, completed_at, status, score, stars_earned)
select '00000000-0000-0000-0000-000000000102', a.id, now(), now(), 'completed', 42, 3
from public.activities a where a.slug = 'privacy-test-activity';
update public.game_sessions set assignment_id = '00000000-0000-0000-0000-000000000202'
where student_id = '00000000-0000-0000-0000-000000000101';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select is((select count(*)::integer from public.game_sessions), 1, 'a student can see their own session');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select is((select count(*)::integer from public.game_sessions), 1, 'a second student sees only their own session');
select is(has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'), false, 'students cannot update their role column');
select is(has_column_privilege('authenticated', 'public.game_sessions', 'score', 'UPDATE'), false, 'students cannot change scores');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
select is((select count(*)::integer from public.game_sessions), 1, 'a teacher sees only sessions for students in their class');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000104', true);
select is((select count(*)::integer from public.game_sessions), 1, 'a parent sees only linked child sessions');

select * from finish();
rollback;
