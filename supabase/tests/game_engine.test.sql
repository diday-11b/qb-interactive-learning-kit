begin;
select plan(26);

-- Temporary test fixtures only. The transaction is rolled back after pgTAP.
insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000701', 'authenticated', 'authenticated', 'engine-student@example.test', '', '{}', '{"display_name":"Engine Test"}', now(), now())
on conflict (id) do nothing;

insert into public.activities (id, slug, title, category, route, active, published, visibility, engine_type) values
 ('00000000-0000-0000-0000-000000000711', 'engine-test-picture', 'Picture test', 'reading', '/game-player.html', true, true, 'public', 'picture_guessing'),
 ('00000000-0000-0000-0000-000000000712', 'engine-test-quiz', 'Quiz test', 'reading', '/game-player.html', true, true, 'public', 'multiple_choice'),
 ('00000000-0000-0000-0000-000000000713', 'engine-test-match', 'Matching test', 'reading', '/game-player.html', true, true, 'public', 'matching_pairs'),
 ('00000000-0000-0000-0000-000000000714', 'engine-test-cards', 'Flashcards test', 'reading', '/game-player.html', true, true, 'public', 'flashcards');

insert into public.game_questions (activity_id, engine_type, ordinal, content, answer_key, published)
select '00000000-0000-0000-0000-000000000711', 'picture_guessing', n,
  jsonb_build_object('prompt', 'Temporary picture fixture ' || n, 'image_url', 'https://example.test/fixture.svg',
    'choices', jsonb_build_array(jsonb_build_object('id','yes','text','A'), jsonb_build_object('id','no','text','B'), jsonb_build_object('id','maybe','text','C'))),
  '{"choice_id":"yes"}'::jsonb, true from generate_series(1, 10) n;
insert into public.game_questions (activity_id, engine_type, ordinal, content, answer_key, published) values
 ('00000000-0000-0000-0000-000000000712', 'multiple_choice', 1, '{"prompt":"Quiz fixture","choices":[{"id":"yes","text":"Yes"},{"id":"no","text":"No"}]}'::jsonb, '{"choice_id":"yes"}'::jsonb, true),
 ('00000000-0000-0000-0000-000000000713', 'matching_pairs', 1, '{"prompt":"Matching fixture","left_items":[{"id":"l1","text":"Sun"},{"id":"l2","text":"Moon"}],"right_items":[{"id":"r1","text":"Night"},{"id":"r2","text":"Day"}]}'::jsonb, '{"matches":{"l1":"r2","l2":"r1"}}'::jsonb, true),
 ('00000000-0000-0000-0000-000000000714', 'flashcards', 1, '{"front":"Front fixture","back":"Back fixture"}'::jsonb, '{"value":"Back fixture"}'::jsonb, true);

select ok(private.valid_game_question('picture_guessing', '{"image_url":"/pic.svg","choices":[{"id":"a","text":"A"},{"id":"b","text":"B"},{"id":"c","text":"C"}]}'::jsonb, '{"choice_id":"a"}'::jsonb), 'picture questions accept three unique choices');
select ok(not private.valid_game_question('picture_guessing', '{"image_url":"/pic.svg","choices":[{"id":"a","text":"A"},{"id":"b","text":"B"}]}'::jsonb, '{"choice_id":"a"}'::jsonb), 'picture questions reject any count other than three');
select ok(not private.valid_game_question('picture_guessing', '{"image_url":["/one.svg","/two.svg"],"choices":[{"id":"a","text":"A"},{"id":"b","text":"B"},{"id":"c","text":"C"}]}'::jsonb, '{"choice_id":"a"}'::jsonb), 'picture questions reject non-string image references');
select ok(not private.valid_game_question('picture_guessing', '{"image_url":"  ","choices":[{"id":"a","text":"A"},{"id":"b","text":"B"},{"id":"c","text":"C"}]}'::jsonb, '{"choice_id":"a"}'::jsonb), 'picture questions reject blank image references');
select ok(private.valid_game_question('multiple_choice', '{"choices":[{"id":"a","text":"A"},{"id":"b","text":"B"}]}'::jsonb, '{"choice_id":"a"}'::jsonb), 'multiple choice validates the correct option');
select ok(private.valid_game_question('matching_pairs', '{"left_items":[{"id":"l1","text":"Sun"},{"id":"l2","text":"Moon"}],"right_items":[{"id":"r1","text":"Night"},{"id":"r2","text":"Day"}]}'::jsonb, '{"matches":{"l1":"r2","l2":"r1"}}'::jsonb), 'matching validates a one-to-one answer map');
select ok(private.valid_game_question('flashcards', '{"front":"Front","back":"Back"}'::jsonb, '{"value":"Back"}'::jsonb), 'flashcards require a front and a back');
select ok(not has_table_privilege('authenticated', 'public.game_questions', 'SELECT'), 'browser clients cannot read answer keys');
select ok(not has_table_privilege('authenticated', 'public.game_session_answers', 'INSERT'), 'browser clients cannot write scores or correctness');

update public.game_questions set published = false
where activity_id = '00000000-0000-0000-0000-000000000711' and ordinal = 10;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);
select throws_ok(
  $$select public.start_game_session('00000000-0000-0000-0000-000000000711'::uuid)$$,
  'P0001', 'Picture Guessing needs 10 published questions before it can start.',
  'picture games cannot start with only nine published questions');
reset role;
update public.game_questions set published = true
where activity_id = '00000000-0000-0000-0000-000000000711' and ordinal = 10;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);
select set_config('test.picture_round', public.start_game_session('00000000-0000-0000-0000-000000000711')::text, true);
select is((current_setting('test.picture_round')::jsonb->>'total_questions')::integer, 10, 'picture rounds contain exactly ten questions');
select is(jsonb_array_length(current_setting('test.picture_round')::jsonb->'questions'), 10, 'picture start response includes exactly ten question snapshots');
select is((select count(distinct question->>'id')::integer from jsonb_array_elements(current_setting('test.picture_round')::jsonb->'questions') question), 10, 'picture round snapshots do not duplicate questions');
select is((select count(*)::integer from jsonb_array_elements(current_setting('test.picture_round')::jsonb->'questions') question where jsonb_typeof(question->'content'->'image_url') = 'string' and btrim(question->'content'->>'image_url') <> '' and jsonb_array_length(question->'content'->'choices') = 3), 10, 'every picture question has one usable image reference and three choices');
select ok(not (current_setting('test.picture_round')::jsonb ? 'answer_key') and not ((current_setting('test.picture_round')::jsonb->'questions'->0) ? 'answer_key'), 'start response omits answer keys');
select throws_ok(format('select public.finish_game_session(%L::uuid)', current_setting('test.picture_round')::jsonb->>'session_id'), 'P0001', 'Finish every question before seeing your result.', 'server blocks early completion');
select is((public.submit_game_answer((current_setting('test.picture_round')::jsonb->>'session_id')::uuid, 1::smallint, '{"choice_id":"no"}'::jsonb)->>'answered')::integer, 1, 'incorrect answer is recorded from actual response');
select is((public.submit_game_answer((current_setting('test.picture_round')::jsonb->>'session_id')::uuid, 1::smallint, '{"choice_id":"no"}'::jsonb)->>'answered')::integer, 1, 'duplicate answer submission is idempotent');
do $$
declare i integer; session uuid := (current_setting('test.picture_round')::jsonb->>'session_id')::uuid;
begin
  for i in 2..10 loop perform public.submit_game_answer(session, i::smallint, '{"choice_id":"yes"}'::jsonb); end loop;
  perform set_config('test.picture_result', public.finish_game_session(session)::text, true);
end $$;
select is((current_setting('test.picture_result')::jsonb->>'score')::integer, 90, 'picture score equals nine correct answers out of ten');
select is((public.finish_game_session((current_setting('test.picture_round')::jsonb->>'session_id')::uuid)->>'score')::integer, 90, 'repeated completion returns the same saved score');
do $$
declare round_data jsonb; session uuid;
begin
  round_data := public.start_game_session('00000000-0000-0000-0000-000000000712'); session := (round_data->>'session_id')::uuid;
  perform public.submit_game_answer(session, 1::smallint, '{"choice_id":"yes"}'::jsonb);
  perform set_config('test.quiz_result', public.finish_game_session(session)::text, true);
  round_data := public.start_game_session('00000000-0000-0000-0000-000000000713'); session := (round_data->>'session_id')::uuid;
  perform public.submit_game_answer(session, 1::smallint, '{"matches":{"l1":"r2","l2":"r1"}}'::jsonb);
  perform set_config('test.match_result', public.finish_game_session(session)::text, true);
  round_data := public.start_game_session('00000000-0000-0000-0000-000000000714'); session := (round_data->>'session_id')::uuid;
  perform public.submit_game_answer(session, 1::smallint, '{"rating":"know"}'::jsonb);
  perform set_config('test.flash_result', public.finish_game_session(session)::text, true);
end $$;
select is((current_setting('test.quiz_result')::jsonb->>'score')::integer, 100, 'multiple-choice round is scored by the server');
select is((current_setting('test.match_result')::jsonb->>'score')::integer, 100, 'matching-pairs round is scored by the server');
select is((current_setting('test.flash_result')::jsonb->>'score')::integer, 100, 'flashcard round records self-rating on the server');
select set_config('test.restarted_round', public.restart_game_session((current_setting('test.picture_round')::jsonb->>'session_id')::uuid)::text, true);
select ok(current_setting('test.restarted_round')::jsonb->>'session_id' <> current_setting('test.picture_round')::jsonb->>'session_id', 'restart opens a new attempt without overwriting the completed one');
select public.submit_game_answer((current_setting('test.restarted_round')::jsonb->>'session_id')::uuid, 1::smallint, '{"choice_id":"yes"}'::jsonb);
select set_config('test.resumed_round', public.resume_game_session((current_setting('test.restarted_round')::jsonb->>'session_id')::uuid)::text, true);
select is(jsonb_array_length(current_setting('test.resumed_round')::jsonb->'answers'), 1, 'interrupted rounds return saved answers for resume');
select ok(not ((current_setting('test.resumed_round')::jsonb->'questions'->0) ? 'answer_key'), 'resuming never exposes answer keys');

select * from finish();
rollback;
