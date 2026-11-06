create or replace function public.get_teacher_classroom(target_class uuid default null, target_student uuid default null)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  current_teacher uuid := (select auth.uid());
  result jsonb;
begin
  if current_teacher is null or (select private.current_role()) <> 'teacher' then
    raise exception 'Teacher access is required.' using errcode = '42501';
  end if;
  if target_class is not null and not exists (
    select 1 from public.classes c where c.id = target_class and c.teacher_id = current_teacher
  ) then
    raise exception 'This class is unavailable.' using errcode = '42501';
  end if;
  if target_student is not null and not exists (
    select 1 from public.class_members m join public.classes c on c.id = m.class_id
    where m.student_id = target_student and c.teacher_id = current_teacher
      and (target_class is null or c.id = target_class)
  ) then
    raise exception 'This student is not in one of your classes.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'classes', coalesce((select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'gradeLevel', c.grade_level,
      'joinCode', c.join_code, 'createdAt', c.created_at,
      'studentCount', (select count(*)::integer from public.class_members m
        join public.profiles p on p.id = m.student_id and p.role = 'student' where m.class_id = c.id)
    ) order by c.created_at, c.name) from public.classes c where c.teacher_id = current_teacher), '[]'::jsonb),
    'selectedClass', case when target_class is null then null else (
      select jsonb_build_object(
        'id', c.id, 'name', c.name, 'gradeLevel', c.grade_level, 'joinCode', c.join_code,
        'students', coalesce((select jsonb_agg(jsonb_build_object(
          'id', p.id, 'displayName', p.display_name, 'language', p.preferred_language,
          'joinedAt', m.joined_at,
          'completedCount', stats.completed_count, 'averageScore', stats.average_score,
          'lastActiveAt', stats.last_active_at, 'lastActivityTitle', stats.last_activity_title,
          'lastScore', stats.last_score
        ) order by p.display_name) from public.class_members m
          join public.profiles p on p.id = m.student_id and p.role = 'student'
          left join lateral (
            select count(*) filter (where gs.status = 'completed')::integer as completed_count,
              round(avg(gs.score) filter (where gs.status = 'completed' and gs.score is not null))::integer as average_score,
              max(gs.started_at) as last_active_at,
              (array_agg(act.title order by gs.started_at desc))[1] as last_activity_title,
              (array_agg(gs.score order by gs.completed_at desc) filter (where gs.status = 'completed'))[1] as last_score
            from public.game_sessions gs
            join public.assignments a on a.id = gs.assignment_id and a.class_id = c.id
              and a.activity_id = gs.activity_id
              and (a.student_id is null or a.student_id = p.id)
            join public.activities act on act.id = gs.activity_id
            where gs.student_id = p.id
          ) stats on true
          where m.class_id = c.id), '[]'::jsonb),
        'activity', coalesce((select jsonb_agg(jsonb_build_object(
          'studentName', p.display_name, 'activityTitle', act.title,
          'assignmentTitle', a.title, 'status', gs.status, 'score', gs.score,
          'startedAt', gs.started_at, 'completedAt', gs.completed_at
        ) order by gs.started_at desc) from (
          select gs.* from public.game_sessions gs
          join public.assignments a on a.id = gs.assignment_id and a.class_id = c.id
            and a.activity_id = gs.activity_id
            and (a.student_id is null or a.student_id = gs.student_id)
          join public.class_members m on m.class_id = c.id and m.student_id = gs.student_id
          order by gs.started_at desc limit 30
        ) gs join public.profiles p on p.id = gs.student_id
          join public.activities act on act.id = gs.activity_id
          join public.assignments a on a.id = gs.assignment_id), '[]'::jsonb)
      ) from public.classes c where c.id = target_class and c.teacher_id = current_teacher
    ) end,
    'selectedStudent', case when target_student is null then null else (
      select jsonb_build_object(
        'id', p.id, 'displayName', p.display_name, 'language', p.preferred_language,
        'createdAt', p.created_at, 'classes', coalesce((select jsonb_agg(jsonb_build_object(
          'id', c.id, 'name', c.name
        ) order by c.name) from public.class_members m join public.classes c on c.id = m.class_id
          where m.student_id = p.id and c.teacher_id = current_teacher
            and (target_class is null or c.id = target_class)), '[]'::jsonb),
        'activity', coalesce((select jsonb_agg(jsonb_build_object(
          'activityTitle', act.title, 'assignmentTitle', a.title,
          'className', c.name, 'status', gs.status, 'score', gs.score,
          'startedAt', gs.started_at, 'completedAt', gs.completed_at
        ) order by gs.started_at desc) from (
          select gs.* from public.game_sessions gs
          join public.assignments a on a.id = gs.assignment_id
          join public.classes c on c.id = a.class_id and c.teacher_id = current_teacher
          join public.class_members m on m.class_id = c.id and m.student_id = gs.student_id
          where gs.student_id = p.id and a.activity_id = gs.activity_id
            and (a.student_id is null or a.student_id = gs.student_id)
            and (target_class is null or c.id = target_class)
          order by gs.started_at desc limit 30
        ) gs join public.assignments a on a.id = gs.assignment_id
          join public.classes c on c.id = a.class_id
          join public.activities act on act.id = gs.activity_id), '[]'::jsonb)
      ) from public.profiles p where p.id = target_student and p.role = 'student'
    ) end
  ) into result;
  return result;
end;
$$;

create or replace function public.create_teacher_class(class_name text, class_grade text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  current_teacher uuid := (select auth.uid());
  clean_name text := trim(coalesce(class_name, ''));
  new_class public.classes%rowtype;
begin
  if current_teacher is null or (select private.current_role()) <> 'teacher' then
    raise exception 'Teacher access is required.' using errcode = '42501';
  end if;
  if char_length(clean_name) < 1 or char_length(clean_name) > 100 then
    raise exception 'Class name must be between 1 and 100 characters.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(class_grade, ''))) > 50 then
    raise exception 'Grade or age group must be 50 characters or fewer.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(current_teacher::text, 0));
  if exists (select 1 from public.classes c where c.teacher_id = current_teacher and lower(c.name) = lower(clean_name)) then
    raise exception 'You already have a class with that name.' using errcode = '23505';
  end if;
  insert into public.classes(name, grade_level, teacher_id, join_code)
  values(clean_name, nullif(trim(coalesce(class_grade, '')), ''), current_teacher,
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)))
  returning * into new_class;
  return jsonb_build_object('id', new_class.id, 'name', new_class.name,
    'gradeLevel', new_class.grade_level, 'joinCode', new_class.join_code,
    'studentCount', 0, 'createdAt', new_class.created_at);
end;
$$;

create or replace function public.update_teacher_class(target_class uuid, class_name text, class_grade text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  current_teacher uuid := (select auth.uid());
  clean_name text := trim(coalesce(class_name, ''));
  changed public.classes%rowtype;
begin
  if current_teacher is null or (select private.current_role()) <> 'teacher' then
    raise exception 'Teacher access is required.' using errcode = '42501';
  end if;
  if char_length(clean_name) < 1 or char_length(clean_name) > 100 then
    raise exception 'Class name must be between 1 and 100 characters.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(class_grade, ''))) > 50 then
    raise exception 'Grade or age group must be 50 characters or fewer.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(current_teacher::text, 0));
  if exists (select 1 from public.classes c where c.teacher_id = current_teacher
    and lower(c.name) = lower(clean_name) and c.id <> target_class) then
    raise exception 'You already have a class with that name.' using errcode = '23505';
  end if;
  update public.classes set name = clean_name, grade_level = nullif(trim(coalesce(class_grade, '')), '')
  where id = target_class and teacher_id = current_teacher returning * into changed;
  if not found then raise exception 'This class is unavailable.' using errcode = '42501'; end if;
  return jsonb_build_object('id', changed.id, 'name', changed.name, 'gradeLevel', changed.grade_level);
end;
$$;

revoke all on function public.get_teacher_classroom(uuid, uuid), public.create_teacher_class(text, text), public.update_teacher_class(uuid, text, text) from public, anon;
grant execute on function public.get_teacher_classroom(uuid, uuid), public.create_teacher_class(text, text), public.update_teacher_class(uuid, text, text) to authenticated;
