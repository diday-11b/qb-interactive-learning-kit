-- Enforce media-library type and language association when library assets are
-- attached to teacher question sets. Direct set uploads remain supported.
create or replace function private.validate_question_set_media_library_refs()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  set_owner uuid;
  set_language text;
  asset public.media_assets%rowtype;
begin
  select owner_id, language into set_owner, set_language
    from public.question_sets where id=new.set_id;

  if new.image_path like '%/library/%' then
    select * into asset from public.media_assets where storage_path=new.image_path;
    if not found or asset.owner_id is distinct from set_owner or asset.media_kind <> 'image' then
      raise exception 'Choose an image from your own media library.';
    end if;
  end if;

  if new.audio_path like '%/library/%' then
    select * into asset from public.media_assets where storage_path=new.audio_path;
    if not found or asset.owner_id is distinct from set_owner or asset.media_kind <> 'audio' then
      raise exception 'Choose an audio recording from your own media library.';
    end if;
    if asset.purpose in ('letter_sound','pronunciation') and set_language in ('en','km')
       and asset.language not in (set_language,'dual') then
      raise exception 'The pronunciation recording language must match the question set language.';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.validate_question_set_media_library_refs() from public, anon, authenticated;

drop trigger if exists question_set_media_library_refs on public.question_set_questions;
create trigger question_set_media_library_refs
  before insert or update of set_id,image_path,audio_path on public.question_set_questions
  for each row execute function private.validate_question_set_media_library_refs();
