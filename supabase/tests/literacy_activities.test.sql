begin;
select plan(10);

insert into auth.users (id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('00000000-0000-0000-0000-000000000801','authenticated','authenticated','literacy-student@example.test','','{}','{"display_name":"Literacy Test"}',now(),now())
on conflict(id) do nothing;

select ok(not exists (
  select 1 from public.literacy_questions q
  join public.literacy_activities a on a.id=q.activity_id
  left join public.literacy_answer_keys k on k.question_id=q.id
  where a.published and (jsonb_array_length(q.choices)<>3 or k.question_id is null or not exists (
    select 1 from jsonb_array_elements(q.choices) choice where choice->>'id'=k.correct_choice_id
  ))
),'published phonics and reading questions have three choices and a matching answer key');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000801',true);

select is((select count(*)::integer from public.literacy_activities where language='km' and published),3,'students can see the Khmer literacy catalog');
select is((select count(*)::integer from public.literacy_activities where language='en' and published),6,'students can see the English literacy catalog');
select ok(not has_table_privilege('authenticated','public.literacy_answer_keys','SELECT'),'browser accounts cannot read literacy answer keys');

select ok(not exists (
  select 1 from public.literacy_activities a
  left join public.literacy_questions q on q.activity_id=a.id
  where a.published and (strpos(a.title,chr(65533))>0 or strpos(coalesce(q.prompt,''),chr(65533))>0
    or exists(select 1 from jsonb_array_elements(coalesce(q.choices,'[]'::jsonb)) choice where strpos(coalesce(choice->>'text',''),chr(65533))>0))
),'published literacy copy contains no Unicode replacement glyphs');
select set_config('test.literacy_attempt',public.start_literacy_attempt((select id from public.literacy_activities where slug='qb-en-letter-friends'))::text,true);
select is((public.submit_literacy_answer(current_setting('test.literacy_attempt')::uuid,
  (select q.id from public.literacy_questions q join public.literacy_activities a on a.id=q.activity_id where a.slug='qb-en-letter-friends' and q.position=1),'b')->>'correct')::boolean,false,
  'server marks an incorrect selection as incorrect');
select is((select status from public.literacy_attempts where id=current_setting('test.literacy_attempt')::uuid),'in_progress','an unfinished round remains in progress');
select is((select count(*)::integer from public.literacy_answers where attempt_id=current_setting('test.literacy_attempt')::uuid),1,'the submitted answer persists to the student attempt');
select throws_ok(format('select public.submit_literacy_answer(%L::uuid,%L::uuid,%L)',current_setting('test.literacy_attempt'),
  (select q.id from public.literacy_questions q join public.literacy_activities a on a.id=q.activity_id where a.slug='qb-en-letter-friends' and q.position=1),'b'),
  'P0001','This question has already been answered.','duplicate answer submissions are rejected');
select throws_ok(format('select public.submit_literacy_answer(%L::uuid,%L::uuid,%L)',current_setting('test.literacy_attempt'),
  (select q.id from public.literacy_questions q join public.literacy_activities a on a.id=q.activity_id where a.slug='qb-en-letter-friends' and q.position=2),'not-a-choice'),
  'P0001','Choose one of the answers shown on this question.','unlisted answer choices are rejected');
select * from finish();
rollback;
