-- Reading library content, resumable reading positions, and authorized worksheet files.
alter table public.media_assets drop constraint if exists media_assets_media_kind_check;
alter table public.media_assets add constraint media_assets_media_kind_check
  check (media_kind in ('image','audio','document'));
alter table public.media_assets drop constraint if exists media_assets_purpose_check;
alter table public.media_assets add constraint media_assets_purpose_check
  check (purpose in ('question','learning_card','mascot','activity_illustration','letter_sound','pronunciation',
    'reading_narration','sound_effect','book_cover','book_illustration','worksheet_preview','worksheet_file'));
update storage.buckets set allowed_mime_types=array_append(allowed_mime_types,'application/pdf')
where id='question-set-media' and not ('application/pdf'=any(allowed_mime_types));

-- Keep the existing authenticated teacher upload flow and add validated PDFs.
create or replace function public.register_media_asset(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); asset_id uuid; mime text; bytes integer; storage_path text; stored_mime text; stored_bytes integer; expected_kind text;
begin
  if uid is null or not exists(select 1 from public.profiles where id=uid and role in ('teacher','admin')) then raise exception 'Teacher access is required to manage media.'; end if;
  asset_id:=(payload->>'id')::uuid; storage_path:=payload->>'storage_path'; mime:=split_part(lower(coalesce(payload->>'mime_type','')), ';', 1); bytes:=(payload->>'byte_size')::integer;
  if storage_path is null or storage_path not like (uid::text || '/library/' || asset_id::text || '.%') then raise exception 'Media must be uploaded to your private library path.'; end if;
  select lower(split_part(o.metadata->>'mimetype',';',1)),nullif(o.metadata->>'size','')::integer into stored_mime,stored_bytes
    from storage.objects o where o.bucket_id='question-set-media' and o.name=storage_path;
  if not found then raise exception 'The uploaded file is missing. Retry the upload before saving it.'; end if;
  if bytes not between 1 and 10485760 then raise exception 'Files must be smaller than 10 MB.'; end if;
  if mime not in ('image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm','application/pdf') then raise exception 'This media format is not supported.'; end if;
  expected_kind:=case when mime like 'image/%' then 'image' when mime like 'audio/%' then 'audio' else 'document' end;
  if payload->>'media_kind' is distinct from expected_kind then raise exception 'Media type does not match the uploaded file.'; end if;
  if expected_kind='document' and (mime<>'application/pdf' or payload->>'purpose'<>'worksheet_file') then raise exception 'PDF files can only be saved as worksheet files.'; end if;
  if stored_mime is distinct from mime or stored_bytes is distinct from bytes then raise exception 'Uploaded file metadata does not match the stored file.'; end if;
  insert into public.media_assets(id,owner_id,storage_path,title,media_kind,purpose,language,mime_type,byte_size,alt_text)
  values(asset_id,uid,storage_path,left(trim(coalesce(payload->>'title','')),120),expected_kind,payload->>'purpose',payload->>'language',mime,bytes,left(coalesce(payload->>'alt_text',''),300))
  on conflict(id) do update set title=excluded.title,purpose=excluded.purpose,language=excluded.language,alt_text=excluded.alt_text
    where public.media_assets.owner_id=uid;
  if not found then raise exception 'This media record belongs to another teacher.'; end if;
  return asset_id;
end $$;

create table if not exists public.digital_books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '' check (char_length(description)<=1200),
  language text not null check (language in ('en','km','dual')),
  reading_level text not null check (char_length(reading_level) between 1 and 60),
  category text not null check (char_length(category) between 1 and 80),
  min_age smallint check (min_age is null or min_age between 3 and 18),
  max_age smallint check (max_age is null or max_age between 3 and 18),
  cover_path text not null references public.media_assets(storage_path) on delete restrict,
  cover_alt text not null default '' check (char_length(cover_alt)<=300),
  visibility text not null default 'private' check (visibility in ('public','private')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  check (min_age is null or max_age is null or min_age<=max_age)
);
create index if not exists digital_books_catalog_idx on public.digital_books(language,category,reading_level) where published;

create table if not exists public.book_pages (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.digital_books(id) on delete cascade,
  page_number integer not null check (page_number between 1 and 500),
  body text not null check (char_length(body) between 1 and 8000),
  illustration_path text references public.media_assets(storage_path) on delete restrict,
  illustration_alt text not null default '' check (char_length(illustration_alt)<=300),
  narration_path text references public.media_assets(storage_path) on delete restrict,
  unique(book_id,page_number)
);

create table if not exists public.worksheets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '' check (char_length(description)<=1200),
  language text not null check (language in ('en','km','dual')),
  category text not null check (char_length(category) between 1 and 80),
  min_age smallint check (min_age is null or min_age between 3 and 18),
  max_age smallint check (max_age is null or max_age between 3 and 18),
  difficulty text check (difficulty is null or char_length(difficulty)<=40),
  preview_path text not null references public.media_assets(storage_path) on delete restrict,
  file_path text not null references public.media_assets(storage_path) on delete restrict,
  visibility text not null default 'private' check (visibility in ('public','private')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  check (min_age is null or max_age is null or min_age<=max_age)
);
create index if not exists worksheets_catalog_idx on public.worksheets(language,category) where published;

create or replace function private.validate_book_cover_asset()
returns trigger language plpgsql security definer set search_path = '' as $$
declare asset public.media_assets%rowtype;
begin
  select * into asset from public.media_assets where storage_path=new.cover_path;
  if not found or asset.owner_id<>new.owner_id or asset.media_kind<>'image' or asset.purpose<>'book_cover' then
    raise exception 'A book cover must be an image in the same owner’s media library.';
  end if;
  return new;
end $$;
create trigger validate_book_cover_asset before insert or update of owner_id,cover_path on public.digital_books
for each row execute function private.validate_book_cover_asset();

create or replace function private.validate_book_page_assets()
returns trigger language plpgsql security definer set search_path = '' as $$
declare book_owner uuid; asset public.media_assets%rowtype;
begin
  select owner_id into book_owner from public.digital_books where id=new.book_id;
  if new.illustration_path is not null then
    select * into asset from public.media_assets where storage_path=new.illustration_path;
    if not found or asset.owner_id<>book_owner or asset.media_kind<>'image' or asset.purpose not in ('book_illustration','activity_illustration') then
      raise exception 'Book illustrations must be images from the same owner’s media library.';
    end if;
  end if;
  if new.narration_path is not null then
    select * into asset from public.media_assets where storage_path=new.narration_path;
    if not found or asset.owner_id<>book_owner or asset.media_kind<>'audio' or asset.purpose<>'reading_narration' then
      raise exception 'Narration must be a recording from the same owner’s media library.';
    end if;
  end if;
  return new;
end $$;
create trigger validate_book_page_assets before insert or update of book_id,illustration_path,narration_path on public.book_pages
for each row execute function private.validate_book_page_assets();

create or replace function private.validate_worksheet_assets()
returns trigger language plpgsql security definer set search_path = '' as $$
declare preview_asset public.media_assets%rowtype; file_asset public.media_assets%rowtype;
begin
  select * into preview_asset from public.media_assets where storage_path=new.preview_path;
  select * into file_asset from public.media_assets where storage_path=new.file_path;
  if preview_asset.owner_id is distinct from new.owner_id or preview_asset.media_kind<>'image' or preview_asset.purpose<>'worksheet_preview' then
    raise exception 'Worksheet previews must be images from the same owner’s media library.';
  end if;
  if file_asset.owner_id is distinct from new.owner_id or file_asset.media_kind<>'document' or file_asset.purpose<>'worksheet_file' or file_asset.mime_type<>'application/pdf' then
    raise exception 'Worksheet downloads must be PDF files from the same owner’s media library.';
  end if;
  return new;
end $$;
create trigger validate_worksheet_assets before insert or update of owner_id,preview_path,file_path on public.worksheets
for each row execute function private.validate_worksheet_assets();

create or replace function private.can_view_digital_book(target_book uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.digital_books b where b.id=target_book and (
    b.owner_id=(select auth.uid()) or (select private.current_role())='admin'
    or (b.published and b.visibility='public' and (select private.current_role()) in ('student','parent','teacher'))
  ))
$$;
create or replace function private.can_view_worksheet(target_worksheet uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.worksheets w where w.id=target_worksheet and (
    w.owner_id=(select auth.uid()) or (select private.current_role())='admin'
    or (w.published and w.visibility='public' and (select private.current_role()) in ('student','parent','teacher'))
  ))
$$;
revoke all on function private.can_view_digital_book(uuid),private.can_view_worksheet(uuid) from public,anon;
grant execute on function private.can_view_digital_book(uuid),private.can_view_worksheet(uuid) to authenticated;

alter table public.digital_books enable row level security;
alter table public.book_pages enable row level security;
alter table public.worksheets enable row level security;
revoke all on public.digital_books,public.book_pages,public.worksheets from public,anon,authenticated;
grant select on public.digital_books,public.book_pages,public.worksheets to authenticated;
create policy digital_books_visible_read on public.digital_books for select to authenticated using ((select private.can_view_digital_book(id)));
create policy book_pages_visible_read on public.book_pages for select to authenticated using ((select private.can_view_digital_book(book_id)));
create policy worksheets_visible_read on public.worksheets for select to authenticated using ((select private.can_view_worksheet(id)));

create table if not exists public.reading_progress (
  reader_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.digital_books(id) on delete cascade,
  last_page_number integer not null check (last_page_number between 1 and 500),
  updated_at timestamptz not null default now(),
  primary key(reader_id,book_id)
);
alter table public.reading_progress enable row level security;
revoke all on public.reading_progress from public,anon,authenticated;
grant select on public.reading_progress to authenticated;
create policy read_own_reading_progress on public.reading_progress for select to authenticated
  using (reader_id=(select auth.uid()) and (select private.can_view_digital_book(book_id)));

create or replace function public.save_reading_progress(target_book uuid,target_page integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); page_count integer;
begin
  if uid is null or not exists(select 1 from public.profiles p where p.id=uid and p.role in ('student','parent')) then
    raise exception 'Sign in with a learner or parent account to save reading progress.';
  end if;
  if not private.can_view_digital_book(target_book) then raise exception 'This book is not available to your account.'; end if;
  select count(*) into page_count from public.book_pages p where p.book_id=target_book;
  if target_page<1 or target_page>page_count or not exists(select 1 from public.book_pages p where p.book_id=target_book and p.page_number=target_page) then
    raise exception 'Choose a page that belongs to this book.';
  end if;
  insert into public.reading_progress(reader_id,book_id,last_page_number,updated_at)
    values(uid,target_book,target_page,now())
    on conflict(reader_id,book_id) do update set last_page_number=excluded.last_page_number,updated_at=excluded.updated_at;
  return jsonb_build_object('book_id',target_book,'last_page_number',target_page,'updated_at',now());
end $$;
revoke all on function public.save_reading_progress(uuid,integer) from public,anon;
grant execute on function public.save_reading_progress(uuid,integer) to authenticated;

-- Update the existing private bucket policy to allow only paths linked to
-- content the current account can read.
create or replace function private.can_access_learning_media(target_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.game_questions q
      where (q.content->>'image_url'=target_path or q.content->>'audio_path'=target_path)
        and (select private.can_view_activity(q.activity_id)))
    or exists(select 1 from public.literacy_questions q join public.literacy_activities a on a.id=q.activity_id
      where q.audio_path=target_path and a.published and (select private.current_role())='student')
    or exists(select 1 from public.digital_books b where b.cover_path=target_path and (select private.can_view_digital_book(b.id)))
    or exists(select 1 from public.book_pages p where (p.illustration_path=target_path or p.narration_path=target_path)
      and (select private.can_view_digital_book(p.book_id)))
    or exists(select 1 from public.worksheets w where (w.preview_path=target_path or w.file_path=target_path)
      and (select private.can_view_worksheet(w.id)))
$$;
