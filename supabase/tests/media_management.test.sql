begin;
select plan(7);

insert into auth.users (id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000901','authenticated','authenticated','media-teacher@example.test','','{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000902','authenticated','authenticated','media-student@example.test','','{}','{}',now(),now())
on conflict(id) do nothing;
update public.profiles set role='teacher' where id='00000000-0000-0000-0000-000000000901';

select ok((select relrowsecurity from pg_class where oid='public.media_assets'::regclass),'media metadata has row-level security enabled');
select ok(has_table_privilege('authenticated','public.media_assets','SELECT'),'signed-in users can request library rows subject to owner RLS');
select ok(not has_table_privilege('authenticated','public.media_assets','INSERT'),'browser clients cannot create metadata outside the validation RPC');
select ok(has_function_privilege('authenticated','public.register_media_asset(jsonb)','EXECUTE'),'authenticated users can use the validated media registration RPC');
select ok(not has_function_privilege('anon','public.register_media_asset(jsonb)','EXECUTE'),'anonymous users cannot register media');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000901',true);
select throws_ok($$select public.register_media_asset('{"id":"00000000-0000-0000-0000-000000000911","storage_path":"00000000-0000-0000-0000-000000000901/library/00000000-0000-0000-0000-000000000911.png","title":"Missing upload","media_kind":"image","purpose":"question","language":"en","mime_type":"image/png","byte_size":10,"alt_text":""}')$$,
  'P0001','The uploaded file is missing. Retry the upload before saving it.','metadata cannot be registered for a broken storage reference');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000902',true);
select throws_ok($$select public.register_media_asset('{"id":"00000000-0000-0000-0000-000000000912","storage_path":"00000000-0000-0000-0000-000000000902/library/00000000-0000-0000-0000-000000000912.png","title":"Student upload","media_kind":"image","purpose":"question","language":"en","mime_type":"image/png","byte_size":10,"alt_text":""}')$$,
  'P0001','Teacher access is required to manage media.','students cannot manage teacher media');
select * from finish();
rollback;
