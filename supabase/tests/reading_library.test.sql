begin;
select plan(8);

select ok((select relrowsecurity from pg_class where oid='public.digital_books'::regclass),'book metadata is protected by row-level security');
select ok((select relrowsecurity from pg_class where oid='public.book_pages'::regclass),'book page text is protected by row-level security');
select ok((select relrowsecurity from pg_class where oid='public.worksheets'::regclass),'worksheet metadata is protected by row-level security');
select ok((select relrowsecurity from pg_class where oid='public.reading_progress'::regclass),'reading positions are protected by row-level security');
select ok(not has_table_privilege('authenticated','public.digital_books','INSERT') and not has_table_privilege('authenticated','public.worksheets','INSERT'),'browser accounts cannot create or publish library content directly');
select ok(has_function_privilege('authenticated','public.save_reading_progress(uuid,integer)','EXECUTE'),'authenticated readers can save an authorized page position');
select ok(not has_function_privilege('anon','public.save_reading_progress(uuid,integer)','EXECUTE'),'anonymous visitors cannot write reading positions');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000899',true);
select throws_ok($$select public.save_reading_progress('00000000-0000-0000-0000-000000000898',1)$$,
  'P0001','Sign in with a learner or parent account to save reading progress.','unknown accounts cannot write reading positions');
select * from finish();
rollback;
