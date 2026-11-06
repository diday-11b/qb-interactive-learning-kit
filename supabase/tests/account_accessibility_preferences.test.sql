begin;
select plan(9);

insert into auth.users(id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('00000000-0000-0000-0000-00000000b901','authenticated','authenticated','settings-a@example.test','','{}','{"display_name":"Settings learner"}',now(),now()),
  ('00000000-0000-0000-0000-00000000b902','authenticated','authenticated','settings-b@example.test','','{}','{"display_name":"Other learner"}',now(),now())
on conflict(id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b901',true);
select is(public.get_account_settings()->'profile'->>'language','en','new account language defaults to English');
select is(public.get_account_settings()->'profile'->>'role','student','settings return the trusted account role');
select is((public.save_account_settings('Learner A','km',false,true,true)->'profile'->>'displayName'),'Learner A','account name is saved');
select is((public.get_account_settings()->'profile'->>'language'),'km','language persists after a separate settings read');
select is((public.get_account_settings()->'preferences'->>'soundEnabled'),'false','sound preference persists');
select is((public.get_account_settings()->'preferences'->>'reducedMotion'),'true','reduced-motion preference persists');
select is((public.get_account_settings()->'preferences'->>'highContrast'),'true','contrast preference persists');
select is(has_column_privilege('authenticated','public.profiles','role','UPDATE'),false,'a user cannot change their role');
select is((select count(*)::integer from public.user_preferences where user_id='00000000-0000-0000-0000-00000000b902'),0,'a user cannot read another account preferences');

select * from finish();
rollback;
