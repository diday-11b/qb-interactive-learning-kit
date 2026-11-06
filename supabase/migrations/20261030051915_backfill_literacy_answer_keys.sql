-- Backfill answer keys omitted by the original data-modifying CTE.
with seeded(slug, position, correct_choice_id) as (values
  ('qb-en-letter-friends',1,'a'),('qb-en-letter-friends',2,'m'),('qb-en-letter-friends',3,'s'),('qb-en-letter-friends',4,'t'),('qb-en-letter-friends',5,'z'),
  ('qb-en-first-sounds',1,'c'),('qb-en-first-sounds',2,'a'),('qb-en-first-sounds',3,'d'),('qb-en-first-sounds',4,'s'),('qb-en-first-sounds',5,'f'),
  ('qb-en-sight-words',1,'the'),('qb-en-sight-words',2,'i'),('qb-en-sight-words',3,'see'),('qb-en-sight-words',4,'can'),('qb-en-sight-words',5,'we'),
  ('qb-en-word-building',1,'cat'),('qb-en-word-building',2,'dog'),('qb-en-word-building',3,'sun'),('qb-en-word-building',4,'pig'),('qb-en-word-building',5,'bus'),
  ('qb-en-spelling',1,'cat'),('qb-en-spelling',2,'dog'),('qb-en-spelling',3,'sun'),('qb-en-spelling',4,'fish'),('qb-en-spelling',5,'bus'),
  ('qb-en-first-reading',1,'hen'),('qb-en-first-reading',2,'blue'),('qb-en-first-reading',3,'leaf'),('qb-en-first-reading',4,'two'),('qb-en-first-reading',5,'sun'),
  ('qb-km-consonant-garden',1,'ka'),('qb-km-consonant-garden',2,'ma'),('qb-km-consonant-garden',3,'sa'),('qb-km-consonant-garden',4,'pa'),('qb-km-consonant-garden',5,'no'),
  ('qb-km-picture-words',1,'cat'),('qb-km-picture-words',2,'apple'),('qb-km-picture-words',3,'water'),('qb-km-picture-words',4,'home'),('qb-km-picture-words',5,'book'),
  ('qb-km-first-reading',1,'book'),('qb-km-first-reading',2,'flower'),('qb-km-first-reading',3,'water'),('qb-km-first-reading',4,'ball'),('qb-km-first-reading',5,'morning')
)
insert into public.literacy_answer_keys(question_id, correct_choice_id)
select q.id, s.correct_choice_id
from seeded s
join public.literacy_activities a on a.slug=s.slug
join public.literacy_questions q on q.activity_id=a.id and q.position=s.position
on conflict (question_id) do nothing;