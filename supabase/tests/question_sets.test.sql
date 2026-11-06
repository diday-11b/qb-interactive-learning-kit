begin;
select plan(13);

insert into auth.users (id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000801','authenticated','authenticated','sets-teacher-a@example.test','','{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000802','authenticated','authenticated','sets-teacher-b@example.test','','{}','{}',now(),now())
on conflict(id) do nothing;
update public.profiles set role='teacher' where id in ('00000000-0000-0000-0000-000000000801','00000000-0000-0000-0000-000000000802');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000801',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('test.question_set_id',public.save_question_set('{"title":"Test Khmer phonics set","description":"Lifecycle fixture","language":"km","category":"phonics","difficulty":"beginner","compatible_games":"multiple_choice","questions":[{"prompt":"តើពាក្យនេះចាប់ផ្តើមដោយអក្សរអ្វី?","choices":[{"id":"a","text":"ក"},{"id":"b","text":"ម"}],"correct_choice_id":"a"}]}')::text,true);
select is((select count(*)::integer from public.question_sets where id=current_setting('test.question_set_id')::uuid),1,'teacher can create a private draft');
select is((select count(*)::integer from public.question_set_questions where set_id=current_setting('test.question_set_id')::uuid),1,'saving persists question content');
select is((select language from public.question_sets where id=current_setting('test.question_set_id')::uuid),'km','Khmer language metadata persists');
select is((public.publish_question_set(current_setting('test.question_set_id')::uuid)->>'status'),'published','teacher can publish a valid set');
select set_config('test.game_id',public.create_game_from_question_set(current_setting('test.question_set_id')::uuid,'multiple_choice')::text,true);
select is((select count(*)::integer from public.question_set_activities where activity_id=current_setting('test.game_id')::uuid and engine_type='multiple_choice'),1,'published set becomes a playable game activity');
select is(public.create_game_from_question_set(current_setting('test.question_set_id')::uuid,'multiple_choice')::text,current_setting('test.game_id'),'reusing a set does not create duplicate game records');

select is(public.save_question_set(jsonb_build_object(
  'id',current_setting('test.question_set_id'),'title','Edited Khmer phonics set','description','Updated fixture',
  'language','km','category','phonics','difficulty','easy','compatible_games','multiple_choice',
  'questions',jsonb_build_array(jsonb_build_object('prompt','តើពាក្យថ្មីចាប់ផ្តើមដោយអក្សរអ្វី?','choices',
    jsonb_build_array(jsonb_build_object('id','new-a','text','ប'),jsonb_build_object('id','new-b','text','ល')),'correct_choice_id','new-a'))
  ))::text,current_setting('test.question_set_id'),'teacher can edit an owned question set');
select is((select status from public.question_sets where id=current_setting('test.question_set_id')::uuid),'draft','editing a published set returns it to draft');
select is((select prompt from public.question_set_questions where set_id=current_setting('test.question_set_id')::uuid and position=1),'តើពាក្យថ្មីចាប់ផ្តើមដោយអក្សរអ្វី?','edited Khmer question persists');
select is((public.publish_question_set(current_setting('test.question_set_id')::uuid)->>'status'),'published','edited draft can be published again');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000802',true);
select is((select count(*)::integer from public.question_sets where id=current_setting('test.question_set_id')::uuid),0,'another teacher cannot read the private set');
select throws_ok($$select public.publish_question_set(current_setting('test.question_set_id')::uuid)$$, 'P0001', 'This question set is unavailable or belongs to another teacher.', 'another teacher cannot publish the private set');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000801',true);
select is((select status from public.question_sets where id=current_setting('test.question_set_id')::uuid),'published','published state persists after a fresh read');
select * from finish();
rollback;
