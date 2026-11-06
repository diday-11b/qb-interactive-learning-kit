-- Fix PostgreSQL JSON object counting and avoid PL/pgSQL/column name ambiguity.

create or replace function private.valid_game_question(game_type text, payload jsonb, answer jsonb)
returns boolean language plpgsql immutable set search_path = ''
as $$
declare item jsonb; item_id text; pair_count integer; choice_count integer;
begin
  if jsonb_typeof(payload) is distinct from 'object' or jsonb_typeof(answer) is distinct from 'object' then return false; end if;
  if game_type in ('picture_guessing', 'multiple_choice') then
    if jsonb_typeof(payload->'choices') is distinct from 'array' then return false; end if;
    choice_count := jsonb_array_length(payload->'choices');
    if (game_type = 'picture_guessing' and choice_count <> 3)
      or (game_type = 'multiple_choice' and (choice_count < 2 or choice_count > 6)) then return false; end if;
    if game_type = 'picture_guessing'
      and (jsonb_typeof(payload->'image_url') is distinct from 'string' or btrim(payload->>'image_url') = '') then return false; end if;
    if coalesce(answer->>'choice_id', '') = '' then return false; end if;
    if (select count(*) from jsonb_array_elements(payload->'choices') c
        where coalesce(c->>'id', '') <> '' and coalesce(c->>'text', '') <> '' and not (c ? 'image_url')) <> choice_count then return false; end if;
    if (select count(distinct c->>'id') from jsonb_array_elements(payload->'choices') c) <> choice_count then return false; end if;
    return (select count(*) from jsonb_array_elements(payload->'choices') c
      where c->>'id' = answer->>'choice_id') = 1;
  elsif game_type = 'matching_pairs' then
    if jsonb_typeof(payload->'left_items') is distinct from 'array'
      or jsonb_typeof(payload->'right_items') is distinct from 'array'
      or jsonb_typeof(answer->'matches') is distinct from 'object' then return false; end if;
    pair_count := jsonb_array_length(payload->'left_items');
    if pair_count < 2 or pair_count > 8 or jsonb_array_length(payload->'right_items') <> pair_count
      or (select count(*) from jsonb_object_keys(answer->'matches')) <> pair_count then return false; end if;
    if (select count(distinct p->>'id') from jsonb_array_elements(payload->'left_items') p) <> pair_count
      or (select count(distinct p->>'id') from jsonb_array_elements(payload->'right_items') p) <> pair_count then return false; end if;
    if (select count(distinct value) from jsonb_each_text(answer->'matches')) <> pair_count then return false; end if;
    for item in select value from jsonb_array_elements(payload->'left_items') loop
      item_id := item->>'id';
      if coalesce(item_id, '') = '' or coalesce(item->>'text', '') = ''
        or not exists (select 1 from jsonb_array_elements(payload->'right_items') r where r->>'id' = answer->'matches'->>item_id and coalesce(r->>'text', '') <> '') then
        return false;
      end if;
    end loop;
    if exists (select 1 from jsonb_array_elements(payload->'right_items') r where coalesce(r->>'id', '') = '' or coalesce(r->>'text', '') = '') then return false; end if;
    return true;
  elsif game_type = 'flashcards' then
    return coalesce(payload->>'front', '') <> '' and coalesce(payload->>'back', '') <> '';
  end if;
  return false;
end;
$$;

create or replace function public.submit_game_answer(target_session uuid, target_position smallint, submitted jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare existing public.game_session_answers%rowtype; game public.game_sessions%rowtype;
  question public.game_session_questions%rowtype; engine text; answered integer; total integer; correct boolean;
begin
  select * into game from public.game_sessions g where g.id = target_session and g.student_id = (select auth.uid()) for update;
  if not found then raise exception 'Game session not found.'; end if;
  select * into existing from public.game_session_answers a where a.session_id = target_session and a.position = target_position;
  if found then
    return jsonb_build_object('accepted', true, 'correct', existing.is_correct, 'answered',
      (select count(*) from public.game_session_answers a where a.session_id = target_session));
  end if;
  if game.status <> 'in_progress' then raise exception 'This game round is no longer active.'; end if;
  select * into question from public.game_session_questions q where q.session_id = target_session and q.position = target_position;
  if not found then raise exception 'Question not found in this game round.'; end if;
  select a.engine_type into engine from public.activities a where a.id = game.activity_id;
  select count(*) into answered from public.game_session_answers a where a.session_id = target_session;
  if target_position <> answered + 1 then raise exception 'Answer the questions in order.'; end if;
  total := (select count(*) from public.game_session_questions q where q.session_id = target_session);
  if engine in ('picture_guessing', 'multiple_choice') then
    if jsonb_typeof(submitted) is distinct from 'object' or (select count(*) from jsonb_object_keys(submitted)) <> 1
      or coalesce(submitted->>'choice_id', '') = '' then raise exception 'Choose one answer.'; end if;
  elsif engine = 'matching_pairs' then
    if jsonb_typeof(submitted->'matches') is distinct from 'object'
      or (select count(*) from jsonb_object_keys(submitted->'matches')) <> jsonb_array_length(question.content_snapshot->'left_items') then
      raise exception 'Match every pair before checking your answer.';
    end if;
  elsif engine = 'flashcards' then
    if jsonb_typeof(submitted) is distinct from 'object' or (select count(*) from jsonb_object_keys(submitted)) <> 1
      or submitted->>'rating' not in ('know', 'practice') then raise exception 'Choose a flashcard response.'; end if;
  else raise exception 'Unsupported game type.';
  end if;
  correct := private.game_response_is_correct(engine, question.answer_key_snapshot, submitted);
  insert into public.game_session_answers(session_id, position, response, is_correct)
    values (target_session, target_position, submitted, correct);
  return jsonb_build_object('accepted', true, 'correct', correct, 'answered', answered + 1, 'total_questions', total);
end;
$$;

create or replace function public.start_game_session(target_activity uuid, target_assignment uuid default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare act public.activities%rowtype; new_session_id uuid; total integer; round_size integer;
begin
  if (select private.current_role()) <> 'student' then raise exception 'A student account is required to play.'; end if;
  select * into act from public.activities a
    where a.id = target_activity and a.active and a.published and a.engine_type is not null;
  if not found then raise exception 'This activity is not ready to play.'; end if;

  if target_assignment is not null then
    if not exists (
      select 1 from public.assignments a join public.class_members m on m.class_id = a.class_id
      where a.id = target_assignment and a.activity_id = target_activity and m.student_id = (select auth.uid())
        and (a.student_id is null or a.student_id = (select auth.uid()))
    ) then raise exception 'This activity is not assigned to your account.'; end if;
  elsif act.visibility <> 'public' then
    select a.id into target_assignment
      from public.assignments a join public.class_members m on m.class_id = a.class_id
      where a.activity_id = target_activity and m.student_id = (select auth.uid())
        and (a.student_id is null or a.student_id = (select auth.uid()))
      order by a.created_at desc limit 1;
    if target_assignment is null then raise exception 'Choose an activity assigned to your class.'; end if;
  end if;

  select count(*) into total from public.game_questions q where q.activity_id = target_activity and q.published;
  if act.engine_type = 'picture_guessing' and total < 10 then
    raise exception 'Picture Guessing needs 10 published questions before it can start.';
  elsif total < 1 then raise exception 'This game needs published questions before it can start.'; end if;
  round_size := case when act.engine_type = 'picture_guessing' then 10 else least(total, 10) end;
  insert into public.game_sessions (student_id, activity_id, assignment_id, status)
    values ((select auth.uid()), target_activity, target_assignment, 'in_progress') returning id into new_session_id;
  insert into public.game_session_questions (session_id, question_id, position, content_snapshot, answer_key_snapshot)
    select new_session_id, q.id, row_number() over (order by q.ordinal)::smallint, q.content, q.answer_key
    from public.game_questions q where q.activity_id = target_activity and q.published
    order by q.ordinal limit round_size;
  return jsonb_build_object('session_id', new_session_id, 'activity_id', act.id, 'title', act.title,
    'engine_type', act.engine_type, 'total_questions', round_size,
    'questions', (select jsonb_agg(jsonb_build_object('id', sq.question_id, 'position', sq.position,
      'content', sq.content_snapshot) order by sq.position)
      from public.game_session_questions sq where sq.session_id = new_session_id));
end;
$$;

alter table public.game_questions validate constraint game_question_matches_engine;