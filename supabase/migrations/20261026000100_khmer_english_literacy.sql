-- Structured, language-specific literacy activities with server-checked answers.
create table if not exists public.literacy_activities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  language text not null check (language in ('en','km')),
  learning_area text not null check (learning_area in ('alphabet','phonics','sight_words','vocabulary','word_formation','spelling','listening','reading')),
  learning_objective text not null,
  instructions text not null,
  illustration text not null default '🌟',
  min_age smallint not null default 4 check (min_age between 3 and 18),
  max_age smallint not null default 7 check (max_age between min_age and 18),
  estimated_minutes smallint check (estimated_minutes between 1 and 60),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.literacy_questions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.literacy_activities(id) on delete cascade,
  position smallint not null check (position between 1 and 30),
  prompt text not null,
  choices jsonb not null check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) between 2 and 4),
  illustration text not null default '✨',
  audio_path text,
  unique(activity_id, position)
);

create table if not exists public.literacy_answer_keys (
  question_id uuid primary key references public.literacy_questions(id) on delete cascade,
  correct_choice_id text not null,
  correct_feedback text not null default 'That’s right!'
);

create table if not exists public.literacy_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.literacy_activities(id) on delete restrict,
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  total_questions smallint not null check (total_questions > 0),
  score smallint check (score is null or score between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((status = 'completed') = (completed_at is not null))
);
create index if not exists literacy_attempts_student_idx on public.literacy_attempts(student_id, started_at desc);

create table if not exists public.literacy_answers (
  attempt_id uuid not null references public.literacy_attempts(id) on delete cascade,
  question_id uuid not null references public.literacy_questions(id) on delete restrict,
  choice_id text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key(attempt_id, question_id)
);

alter table public.literacy_activities enable row level security;
alter table public.literacy_questions enable row level security;
alter table public.literacy_answer_keys enable row level security;
alter table public.literacy_attempts enable row level security;
alter table public.literacy_answers enable row level security;
revoke all on public.literacy_activities, public.literacy_questions, public.literacy_answer_keys,
  public.literacy_attempts, public.literacy_answers from public, anon, authenticated;
grant select on public.literacy_activities, public.literacy_questions,
  public.literacy_attempts, public.literacy_answers to authenticated;

create policy literacy_published_catalog_read on public.literacy_activities for select to authenticated
  using (published and (select private.current_role()) = 'student');
create policy literacy_published_questions_read on public.literacy_questions for select to authenticated
  using (exists(select 1 from public.literacy_activities a where a.id=activity_id and a.published)
    and (select private.current_role()) = 'student');
create policy literacy_attempt_own_read on public.literacy_attempts for select to authenticated
  using (student_id = (select auth.uid()));
create policy literacy_answer_own_read on public.literacy_answers for select to authenticated
  using (exists(select 1 from public.literacy_attempts a where a.id=attempt_id and a.student_id=(select auth.uid())));

-- Let signed playback URLs resolve for recordings explicitly attached to a
-- published literacy question, using the existing private media permissions.
create or replace function private.can_access_learning_media(target_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.game_questions q
    where (q.content->>'image_url'=target_path or q.content->>'audio_path'=target_path)
      and (select private.can_view_activity(q.activity_id))
  ) or exists(
    select 1 from public.literacy_questions q
    join public.literacy_activities a on a.id=q.activity_id
    where q.audio_path=target_path and a.published
      and (select private.current_role())='student'
  )
$$;

-- Answer keys are never readable by browser roles.
revoke all on public.literacy_answer_keys from public, anon, authenticated;
grant all on public.literacy_answer_keys to service_role;

create or replace function public.start_literacy_attempt(target_activity uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); attempt_id uuid; total smallint;
begin
  if uid is null or not exists(select 1 from public.profiles p where p.id=uid and p.role='student') then
    raise exception 'Sign in with a student account to start a literacy activity.';
  end if;
  select count(*)::smallint into total from public.literacy_questions q
    join public.literacy_activities a on a.id=q.activity_id
    where a.id=target_activity and a.published;
  if total=0 then raise exception 'This activity is not available yet.'; end if;
  insert into public.literacy_attempts(student_id,activity_id,total_questions)
    values(uid,target_activity,total) returning id into attempt_id;
  return attempt_id;
end $$;

create or replace function public.submit_literacy_answer(target_attempt uuid, target_question uuid, submitted_choice text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); attempt public.literacy_attempts%rowtype; answer_correct boolean; feedback text; answered integer;
begin
  select * into attempt from public.literacy_attempts a where a.id=target_attempt for update;
  if not found or attempt.student_id is distinct from uid or attempt.status <> 'in_progress' then
    raise exception 'This learning round is no longer available.';
  end if;
  if exists(select 1 from public.literacy_answers a where a.attempt_id=target_attempt and a.question_id=target_question) then
    raise exception 'This question has already been answered.';
  end if;
  if not exists(select 1 from public.literacy_questions q where q.id=target_question and q.activity_id=attempt.activity_id
    and exists(select 1 from jsonb_array_elements(q.choices) c where c->>'id'=submitted_choice)) then
    raise exception 'Choose one of the answers shown on this question.';
  end if;
  select submitted_choice=k.correct_choice_id,k.correct_feedback into answer_correct,feedback
    from public.literacy_answer_keys k where k.question_id=target_question;
  if answer_correct is null then raise exception 'This question is missing its answer key.'; end if;
  insert into public.literacy_answers(attempt_id,question_id,choice_id,is_correct)
    values(target_attempt,target_question,submitted_choice,answer_correct);
  select count(*) into answered from public.literacy_answers a where a.attempt_id=target_attempt;
  if answered=attempt.total_questions then
    update public.literacy_attempts set status='completed',completed_at=now(),
      score=round(100.0*(select count(*) from public.literacy_answers a where a.attempt_id=target_attempt and a.is_correct)/attempt.total_questions)::smallint
      where id=target_attempt;
  end if;
  return jsonb_build_object('correct',answer_correct,'feedback',case when answer_correct then feedback else 'Good try! Let’s learn from that answer.' end,
    'answered',answered,'total',attempt.total_questions,'completed',answered=attempt.total_questions);
end $$;
revoke all on function public.start_literacy_attempt(uuid) from public, anon;
revoke all on function public.submit_literacy_answer(uuid,uuid,text) from public, anon;
grant execute on function public.start_literacy_attempt(uuid), public.submit_literacy_answer(uuid,uuid,text) to authenticated;

-- Original starter content. Audio remains optional and is only shown when a teacher
-- supplies a real recorded file through the existing private media library.
insert into public.literacy_activities(slug,title,language,learning_area,learning_objective,instructions,illustration,estimated_minutes,published) values
('qb-en-letter-friends','English Letter Friends','en','alphabet','Recognize familiar English letters and match each one to its letter name.','Look at the big letter. Pick the same letter from the choices.','🔤',4,true),
('qb-en-first-sounds','English First Sounds','en','phonics','Notice the first sound in a familiar English word.','Say the picture word slowly. Choose the letter you hear at the beginning.','🐻',5,true),
('qb-en-sight-words','English Word Spotters','en','sight_words','Recognize a few useful early reading words by sight.','Read the word in the question and find the same word.','👀',4,true),
('qb-en-word-building','Build a Little Word','en','word_formation','Connect letter order to make a short, familiar English word.','Look at the letters and choose the word they make.','🧱',5,true),
('qb-en-spelling','Little Word Spelling','en','spelling','Recognize the correct spelling of a short, familiar English word.','Look at the picture and choose the word spelled correctly.','✏️',5,true),
('qb-en-first-reading','Tiny Story Reading','en','reading','Understand a short sentence and find a detail from it.','Read the little sentence, then answer the question.','📖',5,true),
('qb-km-consonant-garden','Khmer Consonant Garden','km','alphabet','Recognize common Khmer consonant symbols by sight.','Look carefully at the Khmer letter. Choose the matching letter.','🌼',5,true),
('qb-km-picture-words','ពាក្យខ្មែរជាមួយរូបភាព','km','vocabulary','Match familiar Khmer picture words to their written forms.','មើលរូបភាព រួចជ្រើសរើសពាក្យដែលត្រូវ។','🖼️',5,true),
('qb-km-first-reading','អានប្រយោគខ្លីៗ','km','reading','Read a short Khmer sentence and find a detail from it.','អានប្រយោគខ្លី រួចឆ្លើយសំណួរ។','📖',5,true)
on conflict(slug) do nothing;

with seeded(slug,position,prompt,choices,correct_choice_id,illustration) as (values
('qb-en-letter-friends',1,'Which one is the letter A?',jsonb_build_array(jsonb_build_object('id','a','text','A'),jsonb_build_object('id','b','text','B'),jsonb_build_object('id','c','text','C')),'a','🍎'),
('qb-en-letter-friends',2,'Find the letter M.',jsonb_build_array(jsonb_build_object('id','l','text','L'),jsonb_build_object('id','m','text','M'),jsonb_build_object('id','n','text','N')),'m','🌙'),
('qb-en-letter-friends',3,'Which letter comes first in “sun”?',jsonb_build_array(jsonb_build_object('id','s','text','S'),jsonb_build_object('id','u','text','U'),jsonb_build_object('id','n','text','N')),'s','☀️'),
('qb-en-letter-friends',4,'Find the letter T.',jsonb_build_array(jsonb_build_object('id','f','text','F'),jsonb_build_object('id','t','text','T'),jsonb_build_object('id','v','text','V')),'t','🌳'),
('qb-en-letter-friends',5,'Which one is the letter Z?',jsonb_build_array(jsonb_build_object('id','x','text','X'),jsonb_build_object('id','y','text','Y'),jsonb_build_object('id','z','text','Z')),'z','🦓'),
('qb-en-first-sounds',1,'🐱 Cat begins with which letter?',jsonb_build_array(jsonb_build_object('id','c','text','C'),jsonb_build_object('id','b','text','B'),jsonb_build_object('id','m','text','M')),'c','🐱'),
('qb-en-first-sounds',2,'🍎 Apple begins with which letter?',jsonb_build_array(jsonb_build_object('id','a','text','A'),jsonb_build_object('id','p','text','P'),jsonb_build_object('id','s','text','S')),'a','🍎'),
('qb-en-first-sounds',3,'🐶 Dog begins with which letter?',jsonb_build_array(jsonb_build_object('id','d','text','D'),jsonb_build_object('id','g','text','G'),jsonb_build_object('id','b','text','B')),'d','🐶'),
('qb-en-first-sounds',4,'☀️ Sun begins with which letter?',jsonb_build_array(jsonb_build_object('id','s','text','S'),jsonb_build_object('id','t','text','T'),jsonb_build_object('id','f','text','F')),'s','☀️'),
('qb-en-first-sounds',5,'🐟 Fish begins with which letter?',jsonb_build_array(jsonb_build_object('id','f','text','F'),jsonb_build_object('id','v','text','V'),jsonb_build_object('id','h','text','H')),'f','🐟'),
('qb-en-sight-words',1,'Find the word “the”.',jsonb_build_array(jsonb_build_object('id','the','text','the'),jsonb_build_object('id','and','text','and'),jsonb_build_object('id','see','text','see')),'the','👀'),
('qb-en-sight-words',2,'Find the word “I”.',jsonb_build_array(jsonb_build_object('id','we','text','we'),jsonb_build_object('id','i','text','I'),jsonb_build_object('id','my','text','my')),'i','🧒'),
('qb-en-sight-words',3,'Find the word “see”.',jsonb_build_array(jsonb_build_object('id','see','text','see'),jsonb_build_object('id','say','text','say'),jsonb_build_object('id','go','text','go')),'see','👁️'),
('qb-en-sight-words',4,'Find the word “can”.',jsonb_build_array(jsonb_build_object('id','can','text','can'),jsonb_build_object('id','cat','text','cat'),jsonb_build_object('id','car','text','car')),'can','💪'),
('qb-en-sight-words',5,'Find the word “we”.',jsonb_build_array(jsonb_build_object('id','me','text','me'),jsonb_build_object('id','we','text','we'),jsonb_build_object('id','he','text','he')),'we','👫'),
('qb-en-word-building',1,'Put c-a-t together. Which word do the letters make?',jsonb_build_array(jsonb_build_object('id','cat','text','cat'),jsonb_build_object('id','cap','text','cap'),jsonb_build_object('id','can','text','can')),'cat','🐱'),
('qb-en-word-building',2,'Put d-o-g together. Which word do the letters make?',jsonb_build_array(jsonb_build_object('id','dig','text','dig'),jsonb_build_object('id','dog','text','dog'),jsonb_build_object('id','dot','text','dot')),'dog','🐶'),
('qb-en-word-building',3,'Put s-u-n together. Which word do the letters make?',jsonb_build_array(jsonb_build_object('id','sun','text','sun'),jsonb_build_object('id','run','text','run'),jsonb_build_object('id','fun','text','fun')),'sun','☀️'),
('qb-en-word-building',4,'Put p-i-g together. Which word do the letters make?',jsonb_build_array(jsonb_build_object('id','pin','text','pin'),jsonb_build_object('id','pig','text','pig'),jsonb_build_object('id','pit','text','pit')),'pig','🐷'),
('qb-en-word-building',5,'Put b-u-s together. Which word do the letters make?',jsonb_build_array(jsonb_build_object('id','bug','text','bug'),jsonb_build_object('id','bus','text','bus'),jsonb_build_object('id','bun','text','bun')),'bus','🚌'),
('qb-en-spelling',1,'🐱 Which word is spelled correctly?',jsonb_build_array(jsonb_build_object('id','cat','text','cat'),jsonb_build_object('id','kat','text','kat'),jsonb_build_object('id','caat','text','caat')),'cat','🐱'),
('qb-en-spelling',2,'🐶 Which word is spelled correctly?',jsonb_build_array(jsonb_build_object('id','dog','text','dog'),jsonb_build_object('id','dawg','text','dawg'),jsonb_build_object('id','dogg','text','dogg')),'dog','🐶'),
('qb-en-spelling',3,'☀️ Which word is spelled correctly?',jsonb_build_array(jsonb_build_object('id','sun','text','sun'),jsonb_build_object('id','sunn','text','sunn'),jsonb_build_object('id','son','text','son')),'sun','☀️'),
('qb-en-spelling',4,'🐟 Which word is spelled correctly?',jsonb_build_array(jsonb_build_object('id','fish','text','fish'),jsonb_build_object('id','fishe','text','fishe'),jsonb_build_object('id','fich','text','fich')),'fish','🐟'),
('qb-en-spelling',5,'🚌 Which word is spelled correctly?',jsonb_build_array(jsonb_build_object('id','bus','text','bus'),jsonb_build_object('id','buss','text','buss'),jsonb_build_object('id','buz','text','buz')),'bus','🚌'),
('qb-en-first-reading',1,'“The red hen sits.” Which animal sits?',jsonb_build_array(jsonb_build_object('id','hen','text','The hen'),jsonb_build_object('id','dog','text','The dog'),jsonb_build_object('id','cat','text','The cat')),'hen','🐔'),
('qb-en-first-reading',2,'“Sam has a blue hat.” What color is the hat?',jsonb_build_array(jsonb_build_object('id','blue','text','Blue'),jsonb_build_object('id','red','text','Red'),jsonb_build_object('id','green','text','Green')),'blue','🧢'),
('qb-en-first-reading',3,'“A bug is on the leaf.” Where is the bug?',jsonb_build_array(jsonb_build_object('id','leaf','text','On the leaf'),jsonb_build_object('id','bed','text','On the bed'),jsonb_build_object('id','box','text','In a box')),'leaf','🐞'),
('qb-en-first-reading',4,'“Mia sees two ducks.” How many ducks?',jsonb_build_array(jsonb_build_object('id','one','text','One'),jsonb_build_object('id','two','text','Two'),jsonb_build_object('id','three','text','Three')),'two','🦆'),
('qb-en-first-reading',5,'“The sun is hot.” What is hot?',jsonb_build_array(jsonb_build_object('id','sun','text','The sun'),jsonb_build_object('id','moon','text','The moon'),jsonb_build_object('id','snow','text','The snow')),'sun','☀️'),
('qb-km-consonant-garden',1,'តើមួយណាជាអក្សរ ក?',jsonb_build_array(jsonb_build_object('id','ka','text','ក'),jsonb_build_object('id','kha','text','ខ'),jsonb_build_object('id','ko','text','គ')),'ka','🐓'),
('qb-km-consonant-garden',2,'រកអក្សរ ម។',jsonb_build_array(jsonb_build_object('id','ma','text','ម'),jsonb_build_object('id','na','text','ន'),jsonb_build_object('id','ba','text','ប')),'ma','🐒'),
('qb-km-consonant-garden',3,'តើមួយណាជាអក្សរ ស?',jsonb_build_array(jsonb_build_object('id','sa','text','ស'),jsonb_build_object('id','ha','text','ហ'),jsonb_build_object('id','la','text','ល')),'sa','🐍'),
('qb-km-consonant-garden',4,'រកអក្សរ ប។',jsonb_build_array(jsonb_build_object('id','pa','text','ប'),jsonb_build_object('id','pha','text','ផ'),jsonb_build_object('id','ba2','text','ព')),'pa','🍌'),
('qb-km-consonant-garden',5,'តើមួយណាជាអក្សរ ន?',jsonb_build_array(jsonb_build_object('id','no','text','ន'),jsonb_build_object('id','mo','text','ម'),jsonb_build_object('id','ro','text','រ')),'no','🐟'),
('qb-km-picture-words',1,'តើពាក្យណាមានន័យថា «ឆ្មា»?',jsonb_build_array(jsonb_build_object('id','cat','text','ឆ្មា'),jsonb_build_object('id','dog','text','ឆ្កែ'),jsonb_build_object('id','fish','text','ត្រី')),'cat','🐱'),
('qb-km-picture-words',2,'តើពាក្យណាមានន័យថា «ផ្លែប៉ោម»?',jsonb_build_array(jsonb_build_object('id','banana','text','ចេក'),jsonb_build_object('id','apple','text','ផ្លែប៉ោម'),jsonb_build_object('id','mango','text','ស្វាយ')),'apple','🍎'),
('qb-km-picture-words',3,'តើពាក្យណាមានន័យថា «ទឹក»?',jsonb_build_array(jsonb_build_object('id','rice','text','បាយ'),jsonb_build_object('id','water','text','ទឹក'),jsonb_build_object('id','milk','text','ទឹកដោះគោ')),'water','💧'),
('qb-km-picture-words',4,'តើពាក្យណាមានន័យថា «ផ្ទះ»?',jsonb_build_array(jsonb_build_object('id','home','text','ផ្ទះ'),jsonb_build_object('id','tree','text','ដើមឈើ'),jsonb_build_object('id','book','text','សៀវភៅ')),'home','🏠'),
('qb-km-picture-words',5,'តើពាក្យណាមានន័យថា «សៀវភៅ»?',jsonb_build_array(jsonb_build_object('id','book','text','សៀវភៅ'),jsonb_build_object('id','sun','text','ព្រះអាទិត្យ'),jsonb_build_object('id','flower','text','ផ្កា')),'book','📚')
 ,('qb-km-first-reading',1,'សុខាមានសៀវភៅមួយក្បាល។ តើសុខាមានអ្វី?',jsonb_build_array(jsonb_build_object('id','book','text','សៀវភៅ'),jsonb_build_object('id','ball','text','បាល់'),jsonb_build_object('id','hat','text','មួក')),'book','📚'),
('qb-km-first-reading',2,'ដារ៉ាដាំផ្កា។ តើដារ៉ាដាំអ្វី?',jsonb_build_array(jsonb_build_object('id','flower','text','ផ្កា'),jsonb_build_object('id','tree','text','ដើមឈើ'),jsonb_build_object('id','rice','text','បាយ')),'flower','🌼'),
('qb-km-first-reading',3,'មាន់ផឹកទឹក។ តើមាន់ផឹកអ្វី?',jsonb_build_array(jsonb_build_object('id','water','text','ទឹក'),jsonb_build_object('id','milk','text','ទឹកដោះគោ'),jsonb_build_object('id','juice','text','ទឹកផ្លែឈើ')),'water','🐔'),
('qb-km-first-reading',4,'កូនក្មេងលេងបាល់។ តើកូនក្មេងលេងអ្វី?',jsonb_build_array(jsonb_build_object('id','ball','text','បាល់'),jsonb_build_object('id','book','text','សៀវភៅ'),jsonb_build_object('id','cup','text','ពែង')),'ball','⚽'),
('qb-km-first-reading',5,'ព្រះអាទិត្យរះពេលព្រឹក។ ពេលណាព្រះអាទិត្យរះ?',jsonb_build_array(jsonb_build_object('id','morning','text','ពេលព្រឹក'),jsonb_build_object('id','night','text','ពេលយប់'),jsonb_build_object('id','evening','text','ពេលល្ងាច')),'morning','🌅')
), added as (
  insert into public.literacy_questions(activity_id,position,prompt,choices,illustration)
  select a.id,s.position,s.prompt,s.choices,s.illustration from seeded s join public.literacy_activities a on a.slug=s.slug
  on conflict(activity_id,position) do nothing returning id,activity_id,position
)
insert into public.literacy_answer_keys(question_id,correct_choice_id)
select q.id,s.correct_choice_id from seeded s join public.literacy_activities a on a.slug=s.slug
join public.literacy_questions q on q.activity_id=a.id and q.position=s.position
on conflict(question_id) do nothing;
