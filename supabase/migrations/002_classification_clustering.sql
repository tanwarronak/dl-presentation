alter table public.classroom_sessions add column if not exists module text not null default 'regression' check (module in ('regression','classification','clustering'));

drop function if exists public.join_session(text);
create or replace function public.join_session(code text)
returns table(id uuid,title text,status text,allow_corrections boolean,module text) language sql security definer set search_path=public as $$
  select s.id,s.title,s.status,s.allow_corrections,s.module from public.classroom_sessions s where s.room_code=upper(trim(code)) limit 1;
$$;
grant execute on function public.join_session(text) to anon,authenticated;

create table if not exists public.classification_submissions (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.classroom_sessions(id) on delete cascade,
  student_label text, study_hours numeric(5,2) not null check (study_hours >= 0 and study_hours <= 12),
  attendance numeric(5,2) not null check (attendance >= 0 and attendance <= 100),
  outcome text not null check (outcome in ('pass','fail')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.clustering_submissions (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.classroom_sessions(id) on delete cascade,
  student_label text, study_hours numeric(5,2) not null check (study_hours >= 0 and study_hours <= 12),
  attendance numeric(5,2) not null check (attendance >= 0 and attendance <= 100), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists classification_session_idx on public.classification_submissions(session_id, created_at);
create index if not exists clustering_session_idx on public.clustering_submissions(session_id, created_at);

alter table public.classification_submissions enable row level security;
alter table public.clustering_submissions enable row level security;

drop policy if exists "owners read classification" on public.classification_submissions;
drop policy if exists "owners manage classification" on public.classification_submissions;
create policy "owners read classification" on public.classification_submissions for select to authenticated using (exists (select 1 from public.classroom_sessions s where s.id=session_id and s.owner_id=auth.uid()));
create policy "owners manage classification" on public.classification_submissions for all to authenticated using (exists (select 1 from public.classroom_sessions s where s.id=session_id and s.owner_id=auth.uid())) with check (exists (select 1 from public.classroom_sessions s where s.id=session_id and s.owner_id=auth.uid()));
drop policy if exists "owners read clustering" on public.clustering_submissions;
drop policy if exists "owners manage clustering" on public.clustering_submissions;
create policy "owners read clustering" on public.clustering_submissions for select to authenticated using (exists (select 1 from public.classroom_sessions s where s.id=session_id and s.owner_id=auth.uid()));
create policy "owners manage clustering" on public.clustering_submissions for all to authenticated using (exists (select 1 from public.classroom_sessions s where s.id=session_id and s.owner_id=auth.uid())) with check (exists (select 1 from public.classroom_sessions s where s.id=session_id and s.owner_id=auth.uid()));

create or replace function public.submit_classification(code text,label text,hours numeric,attendance numeric,outcome text)
returns public.classification_submissions language plpgsql security definer set search_path=public as $$
declare s public.classroom_sessions;r public.classification_submissions;
begin
  select * into s from public.classroom_sessions where room_code=upper(trim(code)) and module='classification';
  if s.id is null then raise exception 'Classification classroom not found'; end if;
  if s.status <> 'active' then raise exception 'This classroom is not accepting submissions'; end if;
  if hours < 0 or hours > 12 or attendance < 0 or attendance > 100 or outcome not in ('pass','fail') then raise exception 'Values are invalid'; end if;
  insert into public.classification_submissions(session_id,student_label,study_hours,attendance,outcome) values(s.id,nullif(trim(label),''),hours,attendance,outcome) returning * into r;
  return r;
end;$$;

create or replace function public.submit_clustering(code text,label text,hours numeric,attendance numeric)
returns public.clustering_submissions language plpgsql security definer set search_path=public as $$
declare s public.classroom_sessions;r public.clustering_submissions;
begin
  select * into s from public.classroom_sessions where room_code=upper(trim(code)) and module='clustering';
  if s.id is null then raise exception 'Clustering classroom not found'; end if;
  if s.status <> 'active' then raise exception 'This classroom is not accepting submissions'; end if;
  if hours < 0 or hours > 12 or attendance < 0 or attendance > 100 then raise exception 'Values are invalid'; end if;
  insert into public.clustering_submissions(session_id,student_label,study_hours,attendance) values(s.id,nullif(trim(label),''),hours,attendance) returning * into r;
  return r;
end;$$;

grant select,insert,update,delete on public.classification_submissions to authenticated;
grant select,insert,update,delete on public.clustering_submissions to authenticated;
grant execute on function public.submit_classification(text,text,numeric,numeric,text) to anon,authenticated;
grant execute on function public.submit_clustering(text,text,numeric,numeric) to anon,authenticated;

alter table public.classification_submissions replica identity full;
alter table public.clustering_submissions replica identity full;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='classification_submissions') then alter publication supabase_realtime add table public.classification_submissions; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='clustering_submissions') then alter publication supabase_realtime add table public.clustering_submissions; end if;
end $$;
notify pgrst,'reload schema';
