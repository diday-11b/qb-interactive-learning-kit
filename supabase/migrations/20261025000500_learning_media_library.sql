-- Reusable private media records stored in the existing question-set-media bucket.
create table if not exists public.media_assets (
  id uuid primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  media_kind text not null check (media_kind in ('image','audio')),
  purpose text not null check (purpose in ('question','learning_card','mascot','activity_illustration','letter_sound','pronunciation','reading_narration','sound_effect')),
  language text not null check (language in ('en','km','dual','none')),
  mime_type text not null,
  byte_size integer not null check (byte_size between 1 and 10485760),
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  created_at timestamptz not null default now(),
  check (storage_path like (owner_id::text || '/library/' || id::text || '.%'))
);
create index if not exists media_assets_owner_created_idx on public.media_assets(owner_id, created_at desc);
update storage.buckets set allowed_mime_types=array_append(allowed_mime_types,'audio/webm')
where id='question-set-media' and not ('audio/webm'=any(allowed_mime_types));
alter table public.media_assets enable row level security;
revoke all on public.media_assets from public, anon, authenticated;
grant select on public.media_assets to authenticated;
create policy media_assets_owner_read on public.media_assets for select to authenticated
  using (owner_id=(select auth.uid()) or (select coalesce((select role from public.profiles where id=auth.uid()),'')='admin'));

create or replace function public.register_media_asset(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); asset_id uuid; mime text; bytes integer; storage_path text; stored_mime text; stored_bytes integer;
begin
  if uid is null or not exists(select 1 from public.profiles where id=uid and role in ('teacher','admin')) then raise exception 'Teacher access is required to manage media.'; end if;
  asset_id:=(payload->>'id')::uuid; storage_path:=payload->>'storage_path'; mime:=split_part(lower(coalesce(payload->>'mime_type','')), ';', 1); bytes:=(payload->>'byte_size')::integer;
  if storage_path is null or storage_path not like (uid::text || '/library/' || asset_id::text || '.%') then raise exception 'Media must be uploaded to your private library path.'; end if;
  select lower(split_part(o.metadata->>'mimetype',';',1)),nullif(o.metadata->>'size','')::integer into stored_mime,stored_bytes
    from storage.objects o where o.bucket_id='question-set-media' and o.name=storage_path;
  if not found then raise exception 'The uploaded media file is missing. Retry the upload before saving it.'; end if;
  if bytes not between 1 and 10485760 then raise exception 'Media files must be smaller than 10 MB.'; end if;
  if mime not in ('image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm') then raise exception 'This media format is not supported.'; end if;
  if (mime like 'image/%' and payload->>'media_kind'<>'image') or (mime like 'audio/%' and payload->>'media_kind'<>'audio') then raise exception 'Media type does not match the uploaded file.'; end if;
  if stored_mime is distinct from mime or stored_bytes is distinct from bytes then raise exception 'Uploaded media metadata does not match the stored file.'; end if;
  insert into public.media_assets(id,owner_id,storage_path,title,media_kind,purpose,language,mime_type,byte_size,alt_text)
  values(asset_id,uid,storage_path,left(trim(coalesce(payload->>'title','')),120),payload->>'media_kind',payload->>'purpose',payload->>'language',mime,bytes,left(coalesce(payload->>'alt_text',''),300))
  on conflict(id) do update set title=excluded.title,purpose=excluded.purpose,language=excluded.language,alt_text=excluded.alt_text
    where public.media_assets.owner_id=uid;
  if not found then raise exception 'This media record belongs to another teacher.'; end if;
  return asset_id;
end $$;
revoke all on function public.register_media_asset(jsonb) from public, anon;
grant execute on function public.register_media_asset(jsonb) to authenticated;

create or replace function private.can_access_learning_media(target_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.game_questions q
    where (q.content->>'image_url'=target_path or q.content->>'audio_path'=target_path)
      and (select private.can_view_activity(q.activity_id))
  )
$$;
revoke all on function private.can_access_learning_media(text) from public, anon;
grant execute on function private.can_access_learning_media(text) to authenticated;

-- Keep the existing storage provider and its private ACL. Students only see files
-- directly referenced by a game they are allowed to play.
drop policy if exists question_set_media_owner_read on storage.objects;
create policy question_set_media_owner_read on storage.objects for select to authenticated
  using (bucket_id='question-set-media' and ((storage.foldername(name))[1]=auth.uid()::text
    or (select private.can_access_learning_media(name))));
create policy learning_media_teacher_insert on storage.objects for insert to authenticated
  with check (bucket_id='question-set-media' and (storage.foldername(name))[1]=auth.uid()::text
    and exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin')));
