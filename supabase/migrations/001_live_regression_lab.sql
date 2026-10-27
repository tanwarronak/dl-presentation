create extension if not exists pgcrypto;
create table if not exists public.classroom_sessions (
  id uuid primary key default gen_random_uuid(), room_code text unique not null check (char_length(room_code) between 8 and 16), title text not null,
  status text not null default 'waiting' check (status in ('waiting','active','paused','ended')), allow_corrections boolean not null default false,
  owner_id uuid references auth.users(id) on delete cascade, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.student_submissions (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.classroom_sessions(id) on delete cascade,
  student_label text, study_hours numeric(5,2) not null check (study_hours >= 0 and study_hours <= 12), exam_marks numeric(6,2) not null check (exam_marks >= 0 and exam_marks <= 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists submissions_session_idx on public.student_submissions(session_id, created_at);

alter table public.classroom_sessions enable row level security;
alter table public.student_submissions enable row level security;

drop policy if exists "owners read their sessions" on public.classroom_sessions;
drop policy if exists "owners manage their sessions" on public.classroom_sessions;
drop policy if exists "owners read submissions" on public.student_submissions;
drop policy if exists "owners delete submissions" on public.student_submissions;
create policy "owners read their sessions" on public.classroom_sessions for select to authenticated using (auth.uid() = owner_id);
create policy "owners manage their sessions" on public.classroom_sessions for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners read submissions" on public.student_submissions for select to authenticated using (exists (select 1 from public.classroom_sessions s where s.id = session_id and s.owner_id = auth.uid()));
create policy "owners delete submissions" on public.student_submissions for delete to authenticated using (exists (select 1 from public.classroom_sessions s where s.id = session_id and s.owner_id = auth.uid()));

create or replace function public.join_session(code text)
returns table(id uuid, title text, status text, allow_corrections boolean) language sql security definer set search_path = public as $$
  select id,title,status,allow_corrections from public.classroom_sessions where room_code = upper(trim(code)) limit 1;
$$;

create or replace function public.submit_submission(code text, label text, x numeric, y numeric)
returns public.student_submissions language plpgsql security definer set search_path = public as $$
declare s public.classroom_sessions; r public.student_submissions;
begin
  select * into s from public.classroom_sessions where room_code = upper(trim(code));
  if s.id is null then raise exception 'Classroom session not found'; end if;
  if s.status <> 'active' then raise exception 'This classroom is not accepting submissions'; end if;
  if x < 0 or x > 12 or y < 0 or y > 100 then raise exception 'Values are outside allowed limits'; end if;
  insert into public.student_submissions(session_id,student_label,study_hours,exam_marks)
  values(s.id,nullif(trim(label),''),x,y) returning * into r;
  return r;
end;$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.classroom_sessions to authenticated;
grant select, insert, update, delete on public.student_submissions to authenticated;
grant execute on function public.join_session(text) to anon, authenticated;
grant execute on function public.submit_submission(text,text,numeric,numeric) to anon, authenticated;

alter table public.classroom_sessions replica identity full;
alter table public.student_submissions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'classroom_sessions'
  ) then
    alter publication supabase_realtime add table public.classroom_sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'student_submissions'
  ) then
    alter publication supabase_realtime add table public.student_submissions;
  end if;
end;
$$;

notify pgrst, 'reload schema';
