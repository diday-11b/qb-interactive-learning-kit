begin;
select plan(17);

insert into auth.users(id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-0000-0000-00000000b701','authenticated','authenticated','reward-student@example.test','','{}','{"display_name":"Reward learner"}',now(),now())
on conflict(id) do nothing;
insert into public.activities(id,slug,title,category,route,active,published,visibility,engine_type)
values('00000000-0000-0000-0000-00000000b711','reward-test-quiz','Reward test','other','/game-player.html',true,true,'public','multiple_choice')
on conflict(id) do nothing;
insert into public.game_questions(activity_id,engine_type,ordinal,content,answer_key,published)
values('00000000-0000-0000-0000-00000000b711','multiple_choice',1,
  '{"prompt":"Pick the correct answer","choices":[{"id":"yes","text":"Yes"},{"id":"no","text":"No"}]}'::jsonb,
  '{"choice_id":"yes"}'::jsonb,true)
on conflict(activity_id,ordinal) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b701',true);
select ok(not has_table_privilege('authenticated','public.student_reward_events','INSERT'),'learners cannot mint reward events');
select ok(not has_table_privilege('authenticated','public.student_achievements','INSERT'),'learners cannot grant themselves badges');
select ok(not has_table_privilege('authenticated','public.reward_rules','UPDATE'),'learners cannot change reward rules');
select ok(not has_column_privilege('authenticated','public.game_sessions','score','UPDATE'),'learners cannot change scores to fabricate reward eligibility');
select set_config('test.reward_round',public.start_game_session('00000000-0000-0000-0000-00000000b711')::text,true);
select public.submit_game_answer((current_setting('test.reward_round')::jsonb->>'session_id')::uuid,1::smallint,'{"choice_id":"no"}'::jsonb);
select is((public.get_student_rewards()->>'stars')::integer,0,'an incomplete activity grants no stars');
select public.finish_game_session((current_setting('test.reward_round')::jsonb->>'session_id')::uuid);
select is((public.get_student_rewards()->>'stars')::integer,1,'a completed activity grants one star even with an incorrect answer');
select is((public.get_student_rewards()->>'points')::integer,10,'a completed activity grants its configured points');
select is((public.get_student_rewards()->>'stickers')::integer,1,'the first completion unlocks one milestone sticker');
select is((public.get_student_rewards()->'nextMilestone'->>'remaining')::integer,4,'progress reports the next milestone accurately');
select public.finish_game_session((current_setting('test.reward_round')::jsonb->>'session_id')::uuid);
select is((public.get_student_rewards()->>'stars')::integer,1,'repeating completion does not duplicate rewards');
select set_config('test.reward_round_2',public.start_game_session('00000000-0000-0000-0000-00000000b711')::text,true);
select public.submit_game_answer((current_setting('test.reward_round_2')::jsonb->>'session_id')::uuid,1::smallint,'{"choice_id":"no"}'::jsonb);
select public.finish_game_session((current_setting('test.reward_round_2')::jsonb->>'session_id')::uuid);
select set_config('test.reward_round_3',public.start_game_session('00000000-0000-0000-0000-00000000b711')::text,true);
select public.submit_game_answer((current_setting('test.reward_round_3')::jsonb->>'session_id')::uuid,1::smallint,'{"choice_id":"no"}'::jsonb);
select public.finish_game_session((current_setting('test.reward_round_3')::jsonb->>'session_id')::uuid);
select set_config('test.reward_round_4',public.start_game_session('00000000-0000-0000-0000-00000000b711')::text,true);
select public.submit_game_answer((current_setting('test.reward_round_4')::jsonb->>'session_id')::uuid,1::smallint,'{"choice_id":"no"}'::jsonb);
select public.finish_game_session((current_setting('test.reward_round_4')::jsonb->>'session_id')::uuid);
select is((public.get_student_rewards()->'nextMilestone'->>'remaining')::integer,1,'the five-activity badge remains one activity away at four completions');
select is((public.get_student_rewards()->>'stickers')::integer,1,'milestone sticker does not unlock before its boundary');
select set_config('test.reward_round_5',public.start_game_session('00000000-0000-0000-0000-00000000b711')::text,true);
select public.submit_game_answer((current_setting('test.reward_round_5')::jsonb->>'session_id')::uuid,1::smallint,'{"choice_id":"no"}'::jsonb);
select public.finish_game_session((current_setting('test.reward_round_5')::jsonb->>'session_id')::uuid);
select is((public.get_student_rewards()->>'stars')::integer,5,'each of five distinct completed attempts grants one star');
select is((public.get_student_rewards()->>'points')::integer,50,'points accumulate from completed attempts only');
select is((public.get_student_rewards()->>'stickers')::integer,2,'the five-completion boundary awards exactly one additional sticker');
select is((select count(*)::integer from public.student_achievements where student_id='00000000-0000-0000-0000-00000000b701'),2,'first and five-completion badges persist once for this learner');
select is((public.get_student_rewards()->'nextMilestone'->>'remaining')::integer,5,'progress advances to the next ten-completion milestone');
select * from finish();
rollback;
