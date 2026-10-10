create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.session_members (
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  is_admin boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index session_members_user_id_idx on public.session_members (user_id);

create function public.is_session_member(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.session_members as member
    where member.session_id = p_session_id
      and member.user_id = (select auth.uid())
  );
$$;

create function public.create_session(p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_session_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication is required to create a session.';
  end if;

  if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 40 then
    raise exception 'Display name must be between 1 and 40 characters.';
  end if;

  insert into public.sessions (created_by)
  values (current_user_id)
  returning id into new_session_id;

  insert into public.session_members (session_id, user_id, display_name, is_admin)
  values (new_session_id, current_user_id, trim(p_display_name), true);

  return new_session_id;
end;
$$;

create function public.join_session(p_session_id uuid, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication is required to join a session.';
  end if;

  if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 40 then
    raise exception 'Display name must be between 1 and 40 characters.';
  end if;

  if not exists (select 1 from public.sessions where id = p_session_id) then
    raise exception 'Session not found.';
  end if;

  insert into public.session_members (session_id, user_id, display_name)
  values (p_session_id, current_user_id, trim(p_display_name))
  on conflict (session_id, user_id)
  do update set display_name = excluded.display_name;

  return p_session_id;
end;
$$;

alter table public.sessions enable row level security;
alter table public.session_members enable row level security;

grant select on public.sessions, public.session_members to authenticated;

create policy "Members can read their sessions"
on public.sessions
for select
to authenticated
using (public.is_session_member(id));

create policy "Members can read their session roster"
on public.session_members
for select
to authenticated
using (public.is_session_member(session_id));

revoke all on function public.is_session_member(uuid) from public;
revoke all on function public.create_session(text) from public;
revoke all on function public.join_session(uuid, text) from public;
grant execute on function public.is_session_member(uuid) to authenticated;
grant execute on function public.create_session(text) to authenticated;
grant execute on function public.join_session(uuid, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'sessions'
    ) then
      alter publication supabase_realtime add table public.sessions;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'session_members'
    ) then
      alter publication supabase_realtime add table public.session_members;
    end if;
  end if;
end;
$$;