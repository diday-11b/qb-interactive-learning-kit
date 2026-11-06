-- Picture Guessing questions must have one usable image reference.
-- The existing question constraint calls this validator, so replacing it also
-- tightens validation for every future insert and update.
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

-- Recheck saved rows against the stricter function before the migration commits.
alter table public.game_questions validate constraint game_question_matches_engine;
