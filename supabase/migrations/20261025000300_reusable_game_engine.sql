-- Server-validated player content, immutable round snapshots, and score RPCs.
alter table public.activities
  add column if not exists engine_type text
    check (engine_type is null or engine_type in ('picture_guessing', 'multiple_choice', 'matching_pairs', 'flashcards'));

create table if not exists public.game_questions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  engine_type text not null check (engine_type in ('picture_guessing', 'multiple_choice', 'matching_pairs', 'flashcards')),
  ordinal integer not null check (ordinal > 0),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  answer_key jsonb not null check (jsonb_typeof(answer_key) = 'object'),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (activity_id, ordinal)
);
create index if not exists game_questions_published_idx
  on public.game_questions(activity_id, ordinal) where published;

create table if not exists public.game_session_questions (
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  question_id uuid not null references public.game_questions(id) on delete restrict,
  position smallint not null check (position > 0),
  content_snapshot jsonb not null,
  answer_key_snapshot jsonb not null,
  primary key (session_id, position),
  unique (session_id, question_id)
);

create table if not exists public.game_session_answers (
  session_id uuid not null,
  position smallint not null,
  response jsonb not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (session_id, position),
  foreign key (session_id, position)
    references public.game_session_questions(session_id, position) on delete cascade
);

alter table public.game_questions enable row level security;
alter table public.game_session_questions enable row level security;
alter table public.game_session_answers enable row level security;
revoke all on public.game_questions, public.game_session_questions, public.game_session_answers from public, anon, authenticated;
grant all on public.game_questions, public.game_session_questions, public.game_session_answers to service_role;

create or replace function private.valid_game_question(game_type text, payload jsonb, answer jsonb)
returns boolean language plpgsql immutable set search_path = ''
as $$
declare item jsonb; item_id text; pair_count integer; choice_count integer;
begin
  if jsonb_typeof(payload) is distinct from 'object' or jsonb_typeof(answer) is distinct from 'object' then return false; end if;
  if game_type = 'picture_guessing' or game_type = 'multiple_choice' then
    if jsonb_typeof(payload->'choices') is distinct from 'array' then return false; end if;
    choice_count := jsonb_array_length(payload->'choices');
    if (game_type = 'picture_guessing' and choice_count <> 3)
      or (game_type = 'multiple_choice' and (choice_count < 2 or choice_count > 6)) then return false; end if;
    if game_type = 'picture_guessing' and coalesce(payload->>'image_url', '') = '' then return false; end if;
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
      or jsonb_object_length(answer->'matches') <> pair_count then return false; end if;
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
revoke all on function private.valid_game_question(text, jsonb, jsonb) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.valid_game_question(text, jsonb, jsonb) to service_role;

alter table public.game_questions add constraint game_question_matches_engine
  check (private.valid_game_question(engine_type, content, answer_key));

create or replace function private.enforce_game_question_engine()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare activity_engine text;
begin
  select a.engine_type into activity_engine from public.activities a where a.id = new.activity_id;
  if activity_engine is null or activity_engine <> new.engine_type then
    raise exception 'Question type must match the activity game type.';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_game_question_engine() from public, anon, authenticated;
grant execute on function private.enforce_game_question_engine() to service_role;
create trigger enforce_game_question_engine
  before insert or update of activity_id, engine_type on public.game_questions
  for each row execute function private.enforce_game_question_engine();

create or replace function private.prevent_engine_change_with_questions()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.engine_type is distinct from old.engine_type and exists (
    select 1 from public.game_questions q where q.activity_id = old.id
  ) then raise exception 'Remove or migrate the activity questions before changing its game type.'; end if;
  return new;
end;
$$;
revoke all on function private.prevent_engine_change_with_questions() from public, anon, authenticated;
grant execute on function private.prevent_engine_change_with_questions() to service_role;
create trigger prevent_engine_change_with_questions
  before update of engine_type on public.activities
  for each row execute function private.prevent_engine_change_with_questions();

create or replace function private.game_response_is_correct(game_type text, answer jsonb, response jsonb)
returns boolean language sql immutable set search_path = ''
as $$
  select case
    when game_type in ('picture_guessing', 'multiple_choice')
      then jsonb_typeof(response) = 'object' and response->>'choice_id' = answer->>'choice_id'
    when game_type = 'matching_pairs'
      then jsonb_typeof(response->'matches') = 'object' and response->'matches' = answer->'matches'
    when game_type = 'flashcards'
      then response->>'rating' = 'know'
    else false
  end
$$;
revoke all on function private.game_response_is_correct(text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function private.game_response_is_correct(text, jsonb, jsonb) to service_role;

create or replace function public.start_game_session(target_activity uuid, target_assignment uuid default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare act public.activities%rowtype; session_id uuid; total integer; round_size integer;
begin
  if (select private.current_role()) <> 'student' then raise exception 'A student account is required to play.'; end if;
  select * into act from public.activities a
    where a.id = target_activity and a.active and a.published and a.engine_type is not null;
  if not found then raise exception 'This activity is not ready to play.'; end if;

  if target_assignment is not null then
    if not exists (
      select 1 from public.assignments a join public.class_members m on m.class_id = a.class_id
      where a.id = target_assignment and a.activity_id = target_activity and m.student_id = (select auth.uid())
    ) then raise exception 'This activity is not assigned to your class.'; end if;
  elsif act.visibility <> 'public' then
    select a.id into target_assignment
      from public.assignments a join public.class_members m on m.class_id = a.class_id
      where a.activity_id = target_activity and m.student_id = (select auth.uid())
      order by a.created_at desc limit 1;
    if target_assignment is null then raise exception 'Choose an activity assigned to your class.'; end if;
  end if;

  select count(*) into total from public.game_questions q
    where q.activity_id = target_activity and q.published;
  if act.engine_type = 'picture_guessing' and total < 10 then
    raise exception 'Picture Guessing needs 10 published questions before it can start.';
  elsif total < 1 then
    raise exception 'This game needs published questions before it can start.';
  end if;
  round_size := case when act.engine_type = 'picture_guessing' then 10 else least(total, 10) end;

  insert into public.game_sessions (student_id, activity_id, assignment_id, status)
    values ((select auth.uid()), target_activity, target_assignment, 'in_progress') returning id into session_id;
  insert into public.game_session_questions (session_id, question_id, position, content_snapshot, answer_key_snapshot)
    select session_id, q.id, row_number() over (order by q.ordinal)::smallint, q.content, q.answer_key
    from public.game_questions q where q.activity_id = target_activity and q.published
    order by q.ordinal limit round_size;

  return jsonb_build_object(
    'session_id', session_id, 'activity_id', act.id, 'title', act.title,
    'engine_type', act.engine_type, 'total_questions', round_size,
    'questions', (select jsonb_agg(jsonb_build_object(
      'id', sq.question_id, 'position', sq.position, 'content', sq.content_snapshot
    ) order by sq.position) from public.game_session_questions sq where sq.session_id = session_id)
  );
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
    if jsonb_typeof(submitted) is distinct from 'object' or jsonb_object_length(submitted) <> 1
      or coalesce(submitted->>'choice_id', '') = '' then raise exception 'Choose one answer.'; end if;
  elsif engine = 'matching_pairs' then
    if jsonb_typeof(submitted->'matches') is distinct from 'object'
      or jsonb_object_length(submitted->'matches') <> jsonb_array_length(question.content_snapshot->'left_items') then
      raise exception 'Match every pair before checking your answer.';
    end if;
  elsif engine = 'flashcards' then
    if jsonb_typeof(submitted) is distinct from 'object' or jsonb_object_length(submitted) <> 1
      or submitted->>'rating' not in ('know', 'practice') then raise exception 'Choose a flashcard response.'; end if;
  else raise exception 'Unsupported game type.';
  end if;
  correct := private.game_response_is_correct(engine, question.answer_key_snapshot, submitted);
  insert into public.game_session_answers(session_id, position, response, is_correct)
    values (target_session, target_position, submitted, correct);
  return jsonb_build_object('accepted', true, 'correct', correct, 'answered', answered + 1, 'total_questions', total);
end;
$$;

create or replace function public.resume_game_session(target_session uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare game public.game_sessions%rowtype; act public.activities%rowtype;
begin
  select * into game from public.game_sessions g
    where g.id = target_session and g.student_id = (select auth.uid()) and g.status = 'in_progress';
  if not found then raise exception 'There is no unfinished round to resume.'; end if;
  select * into act from public.activities a where a.id = game.activity_id;
  return jsonb_build_object(
    'session_id', game.id, 'activity_id', act.id, 'assignment_id', game.assignment_id,
    'title', act.title, 'engine_type', act.engine_type,
    'total_questions', (select count(*) from public.game_session_questions q where q.session_id = game.id),
    'questions', (select jsonb_agg(jsonb_build_object(
      'id', sq.question_id, 'position', sq.position, 'content', sq.content_snapshot
    ) order by sq.position) from public.game_session_questions sq where sq.session_id = game.id),
    'answers', (select coalesce(jsonb_agg(jsonb_build_object(
      'position', sa.position, 'response', sa.response, 'correct', sa.is_correct
    ) order by sa.position), '[]'::jsonb) from public.game_session_answers sa where sa.session_id = game.id)
  );
end;
$$;

create or replace function public.finish_game_session(target_session uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare game public.game_sessions%rowtype; answered integer; total integer; correct integer; calculated_score integer;
begin
  select * into game from public.game_sessions g where g.id = target_session and g.student_id = (select auth.uid()) for update;
  if not found then raise exception 'Game session not found.'; end if;
  total := (select count(*) from public.game_session_questions q where q.session_id = target_session);
  answered := (select count(*) from public.game_session_answers a where a.session_id = target_session);
  if game.status = 'completed' then
    return jsonb_build_object('completed', true, 'score', game.score, 'correct_count',
      (select count(*) from public.game_session_answers a where a.session_id = target_session and a.is_correct),
      'total_questions', total);
  end if;
  if game.status <> 'in_progress' or total = 0 or answered <> total then
    raise exception 'Finish every question before seeing your result.';
  end if;
  select count(*) into correct from public.game_session_answers a
    where a.session_id = target_session and a.is_correct;
  calculated_score := round((correct::numeric * 100) / total)::integer;
  update public.game_sessions set status = 'completed', completed_at = now(),
    duration_seconds = greatest(0, floor(extract(epoch from (now() - started_at)))::integer),
    score = calculated_score
  where id = target_session;
  return jsonb_build_object('completed', true, 'score', calculated_score,
    'correct_count', correct, 'total_questions', total);
end;
$$;

create or replace function public.abandon_game_session(target_session uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  update public.game_sessions set status = 'abandoned'
  where id = target_session and student_id = (select auth.uid()) and status = 'in_progress';
  if not found and not exists (select 1 from public.game_sessions g where g.id = target_session and g.student_id = (select auth.uid())) then
    raise exception 'Game session not found.';
  end if;
  return true;
end;
$$;

create or replace function public.restart_game_session(target_session uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare game public.game_sessions%rowtype;
begin
  select * into game from public.game_sessions g where g.id = target_session and g.student_id = (select auth.uid()) for update;
  if not found then raise exception 'Game session not found.'; end if;
  if game.status = 'in_progress' then update public.game_sessions set status = 'abandoned' where id = target_session; end if;
  return public.start_game_session(game.activity_id, game.assignment_id);
end;
$$;

revoke all on function public.start_game_session(uuid, uuid) from public, anon;
revoke all on function public.submit_game_answer(uuid, smallint, jsonb) from public, anon;
revoke all on function public.resume_game_session(uuid) from public, anon;
revoke all on function public.finish_game_session(uuid) from public, anon;
revoke all on function public.abandon_game_session(uuid) from public, anon;
revoke all on function public.restart_game_session(uuid) from public, anon;
grant execute on function public.start_game_session(uuid, uuid) to authenticated;
grant execute on function public.submit_game_answer(uuid, smallint, jsonb) to authenticated;
grant execute on function public.resume_game_session(uuid) to authenticated;
grant execute on function public.finish_game_session(uuid) to authenticated;
grant execute on function public.abandon_game_session(uuid) to authenticated;
grant execute on function public.restart_game_session(uuid) to authenticated;
