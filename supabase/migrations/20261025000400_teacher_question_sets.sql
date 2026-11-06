-- Teacher-owned question sets with private media and atomic draft/publish RPCs.
create table if not exists public.question_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  language text not null check (language in ('en','km','dual')),
  category text not null check (category in ('phonics','reading','math','vocabulary','khmer','other')),
  difficulty text not null check (difficulty in ('beginner','easy','medium','hard')),
  compatible_games text[] not null default array['multiple_choice']::text[],
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create table if not exists public.question_set_questions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.question_sets(id) on delete cascade,
  position integer not null check (position between 1 and 100),
  prompt text not null default '' check (char_length(prompt) <= 500),
  instructions text not null default '' check (char_length(instructions) <= 500),
  image_path text,
  image_alt text not null default '' check (char_length(image_alt) <= 200),
  audio_path text,
  choices jsonb not null default '[]'::jsonb check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) <= 6),
  correct_choice_id text not null default '',
  explanation text not null default '' check (char_length(explanation) <= 500),
  unique(set_id, position),
  check (image_path is null or image_path like ('%/' || set_id::text || '/%') or image_path like '%/library/%'),
  check (audio_path is null or audio_path like ('%/' || set_id::text || '/%') or audio_path like '%/library/%')
);
create index if not exists question_sets_owner_idx on public.question_sets(owner_id, updated_at desc);
create table if not exists public.question_set_activities (
  id uuid primary key default gen_random_uuid(),
  question_set_id uuid not null references public.question_sets(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null unique references public.activities(id) on delete cascade,
  engine_type text not null check (engine_type in ('multiple_choice','picture_guessing')),
  created_at timestamptz not null default now(),
  unique(question_set_id,engine_type)
);
alter table public.question_sets enable row level security;
alter table public.question_set_questions enable row level security;
alter table public.question_set_activities enable row level security;
revoke all on public.question_sets, public.question_set_questions, public.question_set_activities from public, anon, authenticated;
grant select on public.question_sets, public.question_set_questions, public.question_set_activities to authenticated;
create policy question_sets_owner_read on public.question_sets for select to authenticated
  using (owner_id = (select auth.uid()) or (select coalesce((select role from public.profiles where id=auth.uid()),'')='admin'));
create policy question_set_questions_owner_read on public.question_set_questions for select to authenticated
  using (exists(select 1 from public.question_sets s where s.id=set_id and (s.owner_id=auth.uid() or (select coalesce((select role from public.profiles where id=auth.uid()),'')='admin'))));
create policy question_set_activities_owner_read on public.question_set_activities for select to authenticated
  using (owner_id=auth.uid() or (select coalesce((select role from public.profiles where id=auth.uid()),'')='admin'));

create or replace function private.refresh_question_set_games(target_set uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare link record; q record; n integer; payload jsonb; answer jsonb;
begin
  for link in select qa.* from public.question_set_activities qa where qa.question_set_id=target_set
    and exists(select 1 from public.question_sets s where s.id=target_set and qa.engine_type=any(s.compatible_games)) loop
    update public.game_questions set published=false where activity_id=link.activity_id;
    n:=0;
    for q in select * from public.question_set_questions where set_id=target_set order by position loop
      n:=n+1;
      payload:=jsonb_build_object('prompt',q.prompt,'instructions',q.instructions,'choices',q.choices,'explanation',q.explanation);
      if q.image_path is not null then payload:=payload||jsonb_build_object('image_url',q.image_path,'image_alt',q.image_alt); end if;
      if q.audio_path is not null then payload:=payload||jsonb_build_object('audio_path',q.audio_path); end if;
      answer:=jsonb_build_object('choice_id',q.correct_choice_id);
      insert into public.game_questions(activity_id,engine_type,ordinal,content,answer_key,published)
      values(link.activity_id,link.engine_type,n,payload,answer,true)
      on conflict(activity_id,ordinal) do update set engine_type=excluded.engine_type,content=excluded.content,answer_key=excluded.answer_key,published=true;
    end loop;
  end loop;
end $$;
revoke all on function private.refresh_question_set_games(uuid) from public, anon, authenticated;

create or replace function public.save_question_set(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); sid uuid; q jsonb; i integer := 0; choice_count integer;
begin
  if uid is null or not exists(select 1 from public.profiles p where p.id=uid and p.role in ('teacher','admin')) then raise exception 'Teacher access is required.'; end if;
  if jsonb_typeof(payload) <> 'object' or length(trim(coalesce(payload->>'title',''))) not between 1 and 120
    or payload->>'language' not in ('en','km','dual') or payload->>'category' not in ('phonics','reading','math','vocabulary','khmer','other')
    or payload->>'difficulty' not in ('beginner','easy','medium','hard') or payload->>'compatible_games' not in ('multiple_choice','picture_guessing','both')
    or jsonb_typeof(payload->'questions') <> 'array'
    or jsonb_array_length(payload->'questions') > 100 then raise exception 'Complete the title and learning details, then check the question list.'; end if;
  sid := nullif(payload->>'id','')::uuid;
  if sid is null then
    insert into public.question_sets(owner_id,title,description,language,category,difficulty,compatible_games)
    values(uid,trim(payload->>'title'),coalesce(payload->>'description',''),payload->>'language',payload->>'category',payload->>'difficulty',
      case payload->>'compatible_games' when 'picture_guessing' then array['picture_guessing'] when 'both' then array['multiple_choice','picture_guessing'] else array['multiple_choice'] end) returning id into sid;
  else
    update public.question_sets set title=trim(payload->>'title'), description=coalesce(payload->>'description',''), language=payload->>'language',
      category=payload->>'category', difficulty=payload->>'difficulty',
      compatible_games=case payload->>'compatible_games' when 'picture_guessing' then array['picture_guessing'] when 'both' then array['multiple_choice','picture_guessing'] else array['multiple_choice'] end,
      status='draft', published_at=null, updated_at=now()
      where id=sid and (owner_id=uid or (select role from public.profiles where id=uid)='admin');
    if not found then raise exception 'This question set is unavailable or belongs to another teacher.'; end if;
    delete from public.question_set_questions where set_id=sid;
  end if;
  for q in select value from jsonb_array_elements(payload->'questions') loop
    i := i+1;
    if length(trim(coalesce(q->>'prompt',''))) > 500 or jsonb_typeof(q->'choices') <> 'array' or jsonb_array_length(q->'choices') > 6 then raise exception 'Question % has too much content.', i; end if;
    choice_count := jsonb_array_length(q->'choices');
    if choice_count > 0 and ((select count(*) from jsonb_array_elements(q->'choices') c where length(trim(coalesce(c->>'id','')))=0)>0
       or (select count(distinct c->>'id') from jsonb_array_elements(q->'choices') c)<>choice_count
       or (coalesce(q->>'correct_choice_id','') <> '' and (select count(*) from jsonb_array_elements(q->'choices') c where c->>'id'=q->>'correct_choice_id')<>1)) then raise exception 'Question % has invalid choices.', i; end if;
    if (nullif(q->>'image_path','') is not null and (q->>'image_path' not like (uid::text || '/' || sid::text || '/%') and q->>'image_path' not like (uid::text || '/library/%')
        or not exists(select 1 from storage.objects o where o.bucket_id='question-set-media' and o.name=q->>'image_path')))
      or (nullif(q->>'audio_path','') is not null and (q->>'audio_path' not like (uid::text || '/' || sid::text || '/%') and q->>'audio_path' not like (uid::text || '/library/%')
        or not exists(select 1 from storage.objects o where o.bucket_id='question-set-media' and o.name=q->>'audio_path'))) then raise exception 'Media must belong to this teacher and exist in private storage.'; end if;
    insert into public.question_set_questions(set_id,position,prompt,instructions,image_path,image_alt,audio_path,choices,correct_choice_id,explanation)
    values(sid,i,coalesce(trim(q->>'prompt'),''),coalesce(q->>'instructions',''),nullif(q->>'image_path',''),coalesce(q->>'image_alt',''),nullif(q->>'audio_path',''),coalesce(q->'choices','[]'::jsonb),coalesce(q->>'correct_choice_id',''),coalesce(q->>'explanation',''));
  end loop;
  return sid;
end $$;

create or replace function public.publish_question_set(target_set uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); s public.question_sets%rowtype; qcount integer;
begin
  select * into s from public.question_sets where id=target_set and (owner_id=uid or (select coalesce((select role from public.profiles where id=uid),'')='admin')) for update;
  if not found or uid is null or not exists(select 1 from public.profiles where id=uid and role in ('teacher','admin')) then raise exception 'This question set is unavailable or belongs to another teacher.'; end if;
  select count(*) into qcount from public.question_set_questions where set_id=target_set;
  if qcount=0 then raise exception 'Add at least one question before publishing.'; end if;
  if exists(select 1 from public.question_set_questions q where q.set_id=target_set and (
      length(trim(q.prompt))=0 or jsonb_array_length(q.choices) not between 2 and 6
      or (select count(*) from jsonb_array_elements(q.choices) c where length(trim(coalesce(c->>'text','')))>0)<>jsonb_array_length(q.choices)
      or (select count(distinct c->>'id') from jsonb_array_elements(q.choices) c)<>jsonb_array_length(q.choices)
      or (select count(*) from jsonb_array_elements(q.choices) c where c->>'id'=q.correct_choice_id)<>1)) then raise exception 'Complete each question with 2–6 choices and exactly one correct answer.'; end if;
  if exists(select 1 from public.question_set_questions q where q.set_id=target_set and
      ((q.image_path is not null and not exists(select 1 from storage.objects o where o.bucket_id='question-set-media' and o.name=q.image_path))
       or (q.audio_path is not null and not exists(select 1 from storage.objects o where o.bucket_id='question-set-media' and o.name=q.audio_path)))) then
    raise exception 'A question references missing media. Re-upload it before publishing.';
  end if;
  if 'picture_guessing'=any(s.compatible_games) and (qcount<10 or exists(select 1 from public.question_set_questions where set_id=target_set and (image_path is null or jsonb_array_length(choices)<>3))) then
    raise exception 'Picture guessing needs at least 10 questions, each with an image and exactly 3 choices.';
  end if;
  update public.activities a set published=false from public.question_set_activities qa
    where qa.question_set_id=target_set and qa.activity_id=a.id and not (qa.engine_type=any(s.compatible_games));
  perform private.refresh_question_set_games(target_set);
  update public.question_sets set status='published', published_at=now(), updated_at=now() where id=target_set;
  return jsonb_build_object('id',target_set,'status','published','questions',qcount);
end $$;

create or replace function public.create_game_from_question_set(target_set uuid, target_engine text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); s public.question_sets%rowtype; activity_id uuid; q record; n integer:=0; choices jsonb; content jsonb; key jsonb;
begin
  select * into s from public.question_sets where id=target_set and (owner_id=uid or (select coalesce((select role from public.profiles where id=uid),'')='admin')) for update;
  if not found or uid is null or not exists(select 1 from public.profiles where id=uid and role in ('teacher','admin')) then raise exception 'This question set is unavailable or belongs to another teacher.'; end if;
  if s.status <> 'published' then raise exception 'Publish the question set before adding it to a game.'; end if;
  if target_engine not in ('multiple_choice','picture_guessing') or not target_engine=any(s.compatible_games) then raise exception 'This question set is not compatible with that game type.'; end if;
  select qa.activity_id into activity_id from public.question_set_activities qa where qa.question_set_id=target_set and qa.engine_type=target_engine;
  if activity_id is not null then return activity_id; end if;
  if target_engine='picture_guessing' and (select count(*) from public.question_set_questions where set_id=target_set)<10 then raise exception 'Picture guessing requires at least 10 questions.'; end if;
  if exists(select 1 from public.question_set_questions x where x.set_id=target_set and (target_engine='picture_guessing' and (x.image_path is null or jsonb_array_length(x.choices)<>3))) then raise exception 'Picture guessing questions need an image and exactly 3 choices.'; end if;
  insert into public.activities(slug,title,short_description,category,language,difficulty,route,active,published,visibility,game_type,engine_type)
  values('teacher-set-'||replace(gen_random_uuid()::text,'-',''),s.title,s.description,s.category,s.language,
    case s.difficulty when 'hard' then 'advanced' else s.difficulty end,'/game-player.html',true,true,'assigned','solo',target_engine)
  returning id into activity_id;
  insert into public.question_set_activities(question_set_id,owner_id,activity_id,engine_type) values(target_set,uid,activity_id,target_engine);
  for q in select * from public.question_set_questions where set_id=target_set order by position loop
    n:=n+1; choices:=q.choices;
    content:=jsonb_build_object('prompt',q.prompt,'instructions',q.instructions,'choices',choices,'explanation',q.explanation);
    if q.image_path is not null then content:=content||jsonb_build_object('image_url',q.image_path,'image_alt',q.image_alt); end if;
    if q.audio_path is not null then content:=content||jsonb_build_object('audio_path',q.audio_path); end if;
    key:=jsonb_build_object('choice_id',q.correct_choice_id);
    insert into public.game_questions(activity_id,engine_type,ordinal,content,answer_key,published)
    values(activity_id,target_engine,n,content,key,true);
  end loop;
  return activity_id;
end $$;
revoke all on function public.save_question_set(jsonb), public.publish_question_set(uuid), public.create_game_from_question_set(uuid,text) from public, anon;
grant execute on function public.save_question_set(jsonb), public.publish_question_set(uuid), public.create_game_from_question_set(uuid,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('question-set-media','question-set-media',false,10485760,array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/wav','audio/ogg'])
on conflict(id) do update set public=false, file_size_limit=10485760, allowed_mime_types=excluded.allowed_mime_types;
create policy question_set_media_teacher_insert on storage.objects for insert to authenticated
  with check (bucket_id='question-set-media' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin')));
create policy question_set_media_owner_read on storage.objects for select to authenticated
  using (bucket_id='question-set-media' and ((storage.foldername(name))[1]=auth.uid()::text or exists(
    select 1 from public.question_sets s join public.question_set_activities qa on qa.question_set_id=s.id
    where s.owner_id::text=(storage.foldername(name))[1] and s.id::text=(storage.foldername(name))[2]
      and s.status='published' and (select private.can_view_activity(qa.activity_id))
  )));
create policy question_set_media_owner_update on storage.objects for update to authenticated
  using (bucket_id='question-set-media' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin')))
  with check (bucket_id='question-set-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy question_set_media_owner_delete on storage.objects for delete to authenticated
  using (bucket_id='question-set-media' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin')));
