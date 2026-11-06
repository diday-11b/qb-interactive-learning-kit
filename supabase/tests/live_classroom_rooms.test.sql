begin;
select plan(16);

insert into auth.users (id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
  ('00000000-0000-0000-0000-000000000920','authenticated','authenticated','live-room-teacher-a@example.test','','{}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000921','authenticated','authenticated','live-room-teacher-b@example.test','','{}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000922','authenticated','authenticated','live-room-student-a@example.test','','{}','{}',now(),now()),
  ('00000000-0000-0000-0000-000000000923','authenticated','authenticated','live-room-outsider@example.test','','{}','{}',now(),now())
on conflict(id) do nothing;
update public.profiles set role='teacher' where id in (
  '00000000-0000-0000-0000-000000000920','00000000-0000-0000-0000-000000000921');
insert into public.activities(slug,title,category,route,active,published,visibility,engine_type)
values('live-room-flow-test','Live room flow test','reading','/game-player.html',true,true,'public','multiple_choice')
on conflict(slug) do update set active=true,published=true,visibility='public',engine_type='multiple_choice';
insert into public.game_questions(activity_id,engine_type,ordinal,content,answer_key,published)
select id,'multiple_choice',1,'{"prompt":"Pick A","choices":[{"id":"a","text":"A"},{"id":"b","text":"B"}]}'::jsonb,
  '{"choice_id":"a"}'::jsonb,true from public.activities where slug='live-room-flow-test'
on conflict(activity_id,ordinal) do update set published=true;

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000920',true);
select set_config('test.room_class',public.create_teacher_class('Live room class','Grade 2')->>'id',true);
select set_config('test.room_code',public.get_teacher_classroom(current_setting('test.room_class')::uuid)->'selectedClass'->>'joinCode',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000922',true);
select public.join_class_with_code(current_setting('test.room_code'));
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000920',true);
select set_config('test.room_assignment',public.publish_teacher_assignment(
  current_setting('test.room_class')::uuid,
  (select id from public.activities where slug='live-room-flow-test'),
  'Live room activity','Join your teacher in the room.','{}',true,null,
  '00000000-0000-0000-0000-0000000009c0'::uuid
)->'assignments'->0->>'id',true);
select set_config('test.room_json',public.create_live_game_room(current_setting('test.room_assignment')::uuid)::text,true);
select set_config('test.room_id',current_setting('test.room_json')::jsonb->>'roomId',true);
select set_config('test.live_code',current_setting('test.room_json')::jsonb->>'joinCode',true);

select ok(current_setting('test.live_code') ~ '^[A-F0-9]{16}$','the teacher receives a 16-character room code');
select is((public.create_live_game_room(current_setting('test.room_assignment')::uuid)->>'roomId'),current_setting('test.room_id'),'creating a room for the same assignment is idempotent');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000922',true);
select throws_ok($$select public.create_live_game_room(current_setting('test.room_assignment')::uuid)$$,
  '42501','Teacher access is required.','students cannot create live rooms');
select is(public.join_live_game_room(current_setting('test.live_code'))->>'status','waiting','an assigned student joins a waiting room');
select is((public.join_live_game_room(current_setting('test.live_code'))->>'roomId'),current_setting('test.room_id'),'joining a second time returns the same room');
select is((public.get_live_game_room_state(current_setting('test.room_id')::uuid)->>'participantCount')::integer,1,'duplicate joins do not duplicate participants');
select is(public.get_live_game_room_state(current_setting('test.room_id')::uuid)->'participants','null'::jsonb,'students do not receive peer identities');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000923',true);
select throws_ok(format('select public.join_live_game_room(%L)',current_setting('test.live_code')),
  '42501','This game is not assigned to your account.','a student outside the assigned class cannot join');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000920',true);
select is((public.get_live_game_room_state(current_setting('test.room_id')::uuid)->'participants'->0->>'displayName'),'Learner','the owning teacher can see joined learner names');
select is(public.start_live_game_room(current_setting('test.room_id')::uuid)->>'status','active','teacher start changes the room to active');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000922',true);
select is(public.get_live_game_room_state(current_setting('test.room_id')::uuid)->>'status','active','joined learners receive the real active state');
select is((public.start_game_session(
  (current_setting('test.room_json')::jsonb->>'activityId')::uuid,
  current_setting('test.room_assignment')::uuid
)->>'engine_type'),'multiple_choice','students can launch through the existing server-scored game engine');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000920',true);
select is(public.finish_live_game_room(current_setting('test.room_id')::uuid)->>'status','finished','the owning teacher can close a room');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000922',true);
select is(public.get_live_game_room_state(current_setting('test.room_id')::uuid)->>'status','finished','the joined learner sees the room close');
select throws_ok($$select public.finish_live_game_room(current_setting('test.room_id')::uuid)$$,
  '42501','Teacher access is required.','students cannot close live rooms');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000921',true);
select throws_ok(format('select public.get_live_game_room_state(%L::uuid)',current_setting('test.room_id')),
  '42501','You are not a participant in this live game.','another teacher cannot read a room they do not own');

select * from finish();
rollback;
