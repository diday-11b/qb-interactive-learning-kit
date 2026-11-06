-- Configurable, idempotent rewards issued only after server-verified completion.
create table if not exists public.reward_rules (
  slug text primary key,
  title text not null,
  reward_type text not null check (reward_type in ('stars','points','milestone')),
  amount integer not null default 0 check (amount >= 0),
  completed_rounds_required integer check (completed_rounds_required is null or completed_rounds_required > 0),
  achievement_slug text,
  sticker text,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  check ((reward_type = 'milestone') = (completed_rounds_required is not null))
);

insert into public.reward_rules(slug,title,reward_type,amount,completed_rounds_required,achievement_slug,sticker) values
  ('round-complete','Activity completed','stars',1,null,null,null),
  ('round-points','Activity points','points',10,null,null,null),
  ('milestone-1','First learning step','milestone',0,1,'first-step','🌱'),
  ('milestone-5','Five activities completed','milestone',0,5,'curious-explorer','🧭'),
  ('milestone-10','Ten activities completed','milestone',0,10,'steady-star','⭐'),
  ('milestone-25','Twenty-five activities completed','milestone',0,25,'learning-adventurer','🏅')
on conflict (slug) do nothing;

insert into public.achievements(slug,title,description,icon) values
  ('first-step','First learning step','You completed your first activity. Keep exploring!','🌱'),
  ('curious-explorer','Curious explorer','You completed five learning activities.','🧭'),
  ('steady-star','Steady star','You completed ten learning activities.','⭐'),
  ('learning-adventurer','Learning adventurer','You completed twenty-five learning activities.','🏅')
on conflict (slug) do nothing;

create table if not exists public.student_reward_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.game_sessions(id) on delete cascade,
  literacy_attempt_id uuid references public.literacy_attempts(id) on delete cascade,
  rule_slug text not null references public.reward_rules(slug) on delete restrict,
  reward_type text not null check (reward_type in ('stars','points','sticker')),
  amount integer not null default 0 check (amount >= 0),
  achievement_id uuid references public.achievements(id) on delete restrict,
  granted_at timestamptz not null default now(),
  check ((session_id is not null) <> (literacy_attempt_id is not null))
);
create unique index if not exists reward_game_event_once_idx on public.student_reward_events(student_id,session_id,rule_slug) where session_id is not null;
create unique index if not exists reward_literacy_event_once_idx on public.student_reward_events(student_id,literacy_attempt_id,rule_slug) where literacy_attempt_id is not null;
create index if not exists student_reward_events_history_idx on public.student_reward_events(student_id,granted_at desc);
alter table public.student_reward_events enable row level security;
revoke all on public.reward_rules,public.student_reward_events from public,anon,authenticated;
grant select on public.student_reward_events to authenticated;
grant all on public.reward_rules,public.student_reward_events to service_role;
create policy read_own_or_associated_reward_events on public.student_reward_events for select to authenticated
using (student_id=(select auth.uid()) or (select private.is_linked_parent(student_id)) or exists (
  select 1 from public.class_members m join public.classes c on c.id=m.class_id
  where m.student_id=student_reward_events.student_id and c.teacher_id=(select auth.uid())
));

create or replace function private.issue_activity_rewards(target_student uuid,target_session uuid,target_literacy_attempt uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare rule public.reward_rules%rowtype; badge_id uuid; completed_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(target_student::text,0));

  for rule in select * from public.reward_rules where active and reward_type in ('stars','points') loop
    insert into public.student_reward_events(student_id,session_id,literacy_attempt_id,rule_slug,reward_type,amount)
    values(target_student,target_session,target_literacy_attempt,rule.slug,rule.reward_type,rule.amount) on conflict do nothing;
  end loop;

  select (select count(*) from public.game_sessions where student_id=target_student and status='completed')+
    (select count(*) from public.literacy_attempts where student_id=target_student and status='completed') into completed_count;
  for rule in select * from public.reward_rules where active and reward_type='milestone' and completed_rounds_required=completed_count loop
    if rule.achievement_slug is null or rule.sticker is null then continue; end if;
    select id into badge_id from public.achievements where slug=rule.achievement_slug;
    if badge_id is null then continue; end if;
    insert into public.student_achievements(student_id,achievement_id) values(target_student,badge_id)
      on conflict(student_id,achievement_id) do nothing;
    if found then
      insert into public.student_reward_events(student_id,session_id,literacy_attempt_id,rule_slug,reward_type,amount,achievement_id)
      values(target_student,target_session,target_literacy_attempt,rule.slug,'sticker',1,badge_id) on conflict do nothing;
    end if;
  end loop;
end $$;
create or replace function private.grant_game_completion_rewards()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status='completed' or new.status<>'completed' then return new; end if;
  if new.completed_at is null or new.score is null then raise exception 'Rewards require a verified completed result.'; end if;
  perform private.issue_activity_rewards(new.student_id,new.id,null); return new;
end $$;
create or replace function private.grant_literacy_completion_rewards()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status='completed' or new.status<>'completed' then return new; end if;
  if new.completed_at is null or new.score is null then raise exception 'Rewards require a verified completed result.'; end if;
  perform private.issue_activity_rewards(new.student_id,null,new.id); return new;
end $$;
revoke all on function private.issue_activity_rewards(uuid,uuid,uuid),private.grant_game_completion_rewards(),private.grant_literacy_completion_rewards() from public,anon,authenticated;
drop trigger if exists grant_rewards_on_verified_completion on public.game_sessions;
create trigger grant_rewards_on_verified_completion after update of status on public.game_sessions
for each row execute function private.grant_game_completion_rewards();
drop trigger if exists grant_rewards_on_verified_literacy_completion on public.literacy_attempts;
create trigger grant_rewards_on_verified_literacy_completion after update of status on public.literacy_attempts
for each row execute function private.grant_literacy_completion_rewards();

create or replace function public.get_student_rewards()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid:=(select auth.uid()); role_name text:=(select private.current_role()); total_stars integer; total_points integer;
  sticker_count integer; completed_count integer; next_rule public.reward_rules%rowtype; result jsonb;
begin
  if uid is null or role_name<>'student' then raise exception 'Sign in with your learner account to view rewards.' using errcode='42501'; end if;
  select coalesce(sum(amount) filter(where reward_type='stars'),0)::integer,
    coalesce(sum(amount) filter(where reward_type='points'),0)::integer,
    count(*) filter(where reward_type='sticker')::integer
    into total_stars,total_points,sticker_count from public.student_reward_events where student_id=uid;
  select ((select count(*) from public.game_sessions where student_id=uid and status='completed')+
    (select count(*) from public.literacy_attempts where student_id=uid and status='completed'))::integer into completed_count;
  select * into next_rule from public.reward_rules r where r.active and r.reward_type='milestone'
    and r.completed_rounds_required>completed_count order by r.completed_rounds_required limit 1;
  select coalesce(jsonb_agg(jsonb_build_object('type',e.reward_type,'amount',e.amount,'grantedAt',e.granted_at,
    'title',coalesce(a.title,r.title),'description',coalesce(a.description,r.title),'icon',coalesce(a.icon,case e.reward_type when 'stars' then '⭐' when 'points' then '●' else '🎟️' end)) order by e.granted_at desc),'[]'::jsonb)
    into result from (select * from public.student_reward_events where student_id=uid order by granted_at desc limit 50) e
    join public.reward_rules r on r.slug=e.rule_slug left join public.achievements a on a.id=e.achievement_id;
  return jsonb_build_object('stars',total_stars,'points',total_points,'stickers',sticker_count,
    'completedActivities',completed_count,'nextMilestone',case when next_rule.slug is null then null else jsonb_build_object(
      'title',next_rule.title,'required',next_rule.completed_rounds_required,'remaining',next_rule.completed_rounds_required-completed_count,
      'progress',least(100,floor(completed_count::numeric*100/next_rule.completed_rounds_required)::integer)) end,
    'history',result);
end $$;
revoke all on function public.get_student_rewards() from public,anon;
grant execute on function public.get_student_rewards() to authenticated;
