-- Connect the two existing public catalog activities to the server-scored player.
-- Each activity receives one distinct 10-question multiple-choice round.
begin;

do $$
begin
  if (select count(*) from public.activities where slug in ('alien-spelling', 'ship-battle')) <> 2 then
    raise exception 'Expected both seeded public activities before adding starter rounds.';
  end if;
  if exists (
    select 1 from public.game_questions q
    join public.activities a on a.id = q.activity_id
    where a.slug in ('alien-spelling', 'ship-battle')
  ) then
    raise exception 'A starter game already has questions; refusing to replace existing game content.';
  end if;
end;
$$;

update public.activities
set engine_type = 'multiple_choice',
    route = '/game-player.html',
    language = 'en',
    category = 'spelling',
    short_description = 'Build compound words by joining familiar words in a ship-themed round.'
where slug = 'ship-battle';

update public.activities
set engine_type = 'multiple_choice',
    route = '/game-player.html'
where slug = 'alien-spelling';

with question_seed(slug, ordinal, content, answer_key) as (
  values
    ('ship-battle', 1, $json${"prompt":"Which two smaller words make sunlight?","choices":[{"id":"sunlight","text":"sun + light"},{"id":"sun-lane","text":"sun + lane"},{"id":"sun-book","text":"sun + book"}]}$json$::jsonb, $json${"choice_id":"sunlight"}$json$::jsonb),
    ('ship-battle', 2, $json${"prompt":"Which two smaller words make toothbrush?","choices":[{"id":"toothbrush","text":"tooth + brush"},{"id":"toothbath","text":"tooth + bath"},{"id":"chairbrush","text":"chair + brush"}]}$json$::jsonb, $json${"choice_id":"toothbrush"}$json$::jsonb),
    ('ship-battle', 3, $json${"prompt":"Which two smaller words make rainbow?","choices":[{"id":"rainbow","text":"rain + bow"},{"id":"raincoat","text":"rain + coat"},{"id":"poolbow","text":"pool + bow"}]}$json$::jsonb, $json${"choice_id":"rainbow"}$json$::jsonb),
    ('ship-battle', 4, $json${"prompt":"Which two smaller words make cupcake?","choices":[{"id":"cupcake","text":"cup + cake"},{"id":"cupmilk","text":"cup + milk"},{"id":"platecake","text":"plate + cake"}]}$json$::jsonb, $json${"choice_id":"cupcake"}$json$::jsonb),
    ('ship-battle', 5, $json${"prompt":"Which two smaller words make backpack?","choices":[{"id":"backpack","text":"back + pack"},{"id":"backlunch","text":"back + lunch"},{"id":"packbag","text":"pack + bag"}]}$json$::jsonb, $json${"choice_id":"backpack"}$json$::jsonb),
    ('ship-battle', 6, $json${"prompt":"Which two smaller words make playground?","choices":[{"id":"playground","text":"play + ground"},{"id":"playhouse","text":"play + house"},{"id":"groundwork","text":"ground + work"}]}$json$::jsonb, $json${"choice_id":"playground"}$json$::jsonb),
    ('ship-battle', 7, $json${"prompt":"Which two smaller words make sunflower?","choices":[{"id":"sunflower","text":"sun + flower"},{"id":"sunshine","text":"sun + shine"},{"id":"flowerpot","text":"flower + pot"}]}$json$::jsonb, $json${"choice_id":"sunflower"}$json$::jsonb),
    ('ship-battle', 8, $json${"prompt":"Which two smaller words make bedroom?","choices":[{"id":"bedroom","text":"bed + room"},{"id":"bedtime","text":"bed + time"},{"id":"roommate","text":"room + mate"}]}$json$::jsonb, $json${"choice_id":"bedroom"}$json$::jsonb),
    ('ship-battle', 9, $json${"prompt":"Which two smaller words make football?","choices":[{"id":"football","text":"foot + ball"},{"id":"shoeball","text":"shoe + ball"},{"id":"footwear","text":"foot + wear"}]}$json$::jsonb, $json${"choice_id":"football"}$json$::jsonb),
    ('ship-battle', 10, $json${"prompt":"Which two smaller words make mailbox?","choices":[{"id":"mailbox","text":"mail + box"},{"id":"mailbag","text":"mail + bag"},{"id":"boxcar","text":"box + car"}]}$json$::jsonb, $json${"choice_id":"mailbox"}$json$::jsonb),
    ('alien-spelling', 1, $json${"prompt":"Which spelling names a pet that says meow?","choices":[{"id":"cat","text":"cat"},{"id":"kat","text":"kat"},{"id":"cut","text":"cut"}]}$json$::jsonb, $json${"choice_id":"cat"}$json$::jsonb),
    ('alien-spelling', 2, $json${"prompt":"Which spelling names the bright star we see in the daytime sky?","choices":[{"id":"sun","text":"sun"},{"id":"son","text":"son"},{"id":"sin","text":"sin"}]}$json$::jsonb, $json${"choice_id":"sun"}$json$::jsonb),
    ('alien-spelling', 3, $json${"prompt":"Which spelling names a green animal that hops?","choices":[{"id":"frog","text":"frog"},{"id":"frawg","text":"frawg"},{"id":"frag","text":"frag"}]}$json$::jsonb, $json${"choice_id":"frog"}$json$::jsonb),
    ('alien-spelling', 4, $json${"prompt":"Which spelling names an animal with fins that swims?","choices":[{"id":"fish","text":"fish"},{"id":"fesh","text":"fesh"},{"id":"fush","text":"fush"}]}$json$::jsonb, $json${"choice_id":"fish"}$json$::jsonb),
    ('alien-spelling', 5, $json${"prompt":"Which spelling names something that shines in the night sky?","choices":[{"id":"star","text":"star"},{"id":"stair","text":"stair"},{"id":"store","text":"store"}]}$json$::jsonb, $json${"choice_id":"star"}$json$::jsonb),
    ('alien-spelling', 6, $json${"prompt":"Which spelling names a boat that travels on water?","choices":[{"id":"ship","text":"ship"},{"id":"shep","text":"shep"},{"id":"shipp","text":"shipp"}]}$json$::jsonb, $json${"choice_id":"ship"}$json$::jsonb),
    ('alien-spelling', 7, $json${"prompt":"Which spelling names a bird that quacks?","choices":[{"id":"duck","text":"duck"},{"id":"duk","text":"duk"},{"id":"dock","text":"dock"}]}$json$::jsonb, $json${"choice_id":"duck"}$json$::jsonb),
    ('alien-spelling', 8, $json${"prompt":"Which spelling names the round object we can see in the night sky?","choices":[{"id":"moon","text":"moon"},{"id":"moun","text":"moun"},{"id":"moan","text":"moan"}]}$json$::jsonb, $json${"choice_id":"moon"}$json$::jsonb),
    ('alien-spelling', 9, $json${"prompt":"Which spelling names a tall plant with a trunk, branches, and leaves?","choices":[{"id":"tree","text":"tree"},{"id":"trei","text":"trei"},{"id":"tre","text":"tre"}]}$json$::jsonb, $json${"choice_id":"tree"}$json$::jsonb),
    ('alien-spelling', 10, $json${"prompt":"Which spelling names a plant that can bloom?","choices":[{"id":"flower","text":"flower"},{"id":"flowr","text":"flowr"},{"id":"flour","text":"flour"}]}$json$::jsonb, $json${"choice_id":"flower"}$json$::jsonb)
)
insert into public.game_questions (activity_id, engine_type, ordinal, content, answer_key, published)
select a.id, 'multiple_choice', q.ordinal, q.content, q.answer_key, true
from question_seed q
join public.activities a on a.slug = q.slug;

commit;
