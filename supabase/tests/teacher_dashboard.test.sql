begin;
select plan(3);

insert into auth.users (id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000921','authenticated','authenticated','dashboard-teacher@example.test','','{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000922','authenticated','authenticated','dashboard-student@example.test','','{}','{}',now(),now())
on conflict(id) do nothing;
update public.profiles set role='teacher' where id='00000000-0000-0000-0000-000000000921';
update public.profiles set role='student' where id='00000000-0000-0000-0000-000000000922';

select ok(has_function_privilege('authenticated','public.get_teacher_dashboard(integer)','EXECUTE'),
  'signed-in users can call the teacher dashboard RPC subject to its role check');
select ok(not has_function_privilege('anon','public.get_teacher_dashboard(integer)','EXECUTE'),
  'anonymous users cannot call the teacher dashboard RPC');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000922',true);
select throws_ok($$select public.get_teacher_dashboard(30)$$,
  '42501','Teacher access is required','students cannot read teacher dashboard data');
select * from finish();
rollback;
