begin;
select plan(3);

insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000301', 'authenticated', 'authenticated', 'catalog-student-a@example.test', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000302', 'authenticated', 'authenticated', 'catalog-student-b@example.test', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000303', 'authenticated', 'authenticated', 'catalog-teacher@example.test', '', '{}', '{}', now(), now())
on conflict (id) do nothing;

update public.profiles set role = 'teacher' where id = '00000000-0000-0000-0000-000000000303';

insert into public.activities (id, slug, title, short_description, category, language, route, active, published, visibility)
values
  ('00000000-0000-0000-0000-000000000311', 'catalog-public-test', 'Public test game', 'Public catalog test', 'phonics', 'en', '/test-public', true, true, 'public'),
  ('00000000-0000-0000-0000-000000000312', 'catalog-assigned-test', 'Assigned test game', 'Assigned catalog test', 'reading', 'km', '/test-assigned', true, true, 'assigned'),
  ('00000000-0000-0000-0000-000000000313', 'catalog-unpublished-test', 'Unpublished test game', 'Hidden test', 'quizzes', 'en', '/test-hidden', true, false, 'public');

insert into public.classes (id, name, teacher_id)
values ('00000000-0000-0000-0000-000000000321', 'Catalog test class', '00000000-0000-0000-0000-000000000303');
insert into public.class_members (class_id, student_id)
values ('00000000-0000-0000-0000-000000000321', '00000000-0000-0000-0000-000000000301');
insert into public.assignments (id, class_id, activity_id, title, created_by)
values ('00000000-0000-0000-0000-000000000331', '00000000-0000-0000-0000-000000000321',
  '00000000-0000-0000-0000-000000000312', 'Assigned catalog test', '00000000-0000-0000-0000-000000000303');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000301', true);
select is((select count(*)::integer from public.activities where slug like 'catalog-%'), 2,
  'a student sees public and assigned published activities, but not unpublished ones');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000302', true);
select is((select count(*)::integer from public.activities where slug like 'catalog-%'), 1,
  'a student outside the assigned class sees only the public activity');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000303', true);
select is((select count(*)::integer from public.activities where slug like 'catalog-%'), 2,
  'the class teacher sees public games and games assigned to their class');

select * from finish();
rollback;
