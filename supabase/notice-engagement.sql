-- Apply after setup.sql to enable notice reactions and comments.

create table if not exists public.notice_reactions (
  notice_id uuid not null references public.notices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'love', 'care', 'sad', 'angry')),
  created_at timestamptz not null default now(),
  primary key (notice_id, user_id)
);

create index if not exists notice_reactions_notice_id_idx
  on public.notice_reactions (notice_id);

create table if not exists public.notice_comments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists notice_comments_notice_created_idx
  on public.notice_comments (notice_id, created_at);

alter table public.notice_reactions enable row level security;
alter table public.notice_comments enable row level security;

revoke all on public.notice_reactions from public, anon, authenticated;
grant select, insert, update, delete on public.notice_reactions to authenticated;
revoke all on public.notice_comments from public, anon, authenticated;
grant insert, delete on public.notice_comments to authenticated;

drop policy if exists "users read own notice reactions" on public.notice_reactions;
create policy "users read own notice reactions"
on public.notice_reactions for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "users create own notice reactions" on public.notice_reactions;
create policy "users create own notice reactions"
on public.notice_reactions for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.notices n where n.id = notice_id)
);

drop policy if exists "users update own notice reactions" on public.notice_reactions;
create policy "users update own notice reactions"
on public.notice_reactions for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.notices n where n.id = notice_id)
);

drop policy if exists "users delete own notice reactions" on public.notice_reactions;
create policy "users delete own notice reactions"
on public.notice_reactions for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "users create notice comments" on public.notice_comments;
create policy "users create notice comments"
on public.notice_comments for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.notices n where n.id = notice_id)
);

drop policy if exists "authors or admins delete notice comments" on public.notice_comments;
create policy "authors or admins delete notice comments"
on public.notice_comments for delete to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.get_notice_comments(p_notice_id uuid)
returns table (
  id uuid,
  user_id uuid,
  author_name text,
  body text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view comments.';
  end if;
  if not exists (select 1 from public.notices n where n.id = p_notice_id) then
    raise exception 'Notice not found.';
  end if;

  return query
    select c.id, c.user_id, coalesce(p.full_name, 'Student'), c.body, c.created_at
    from public.notice_comments c
    left join public.profiles p on p.id = c.user_id
    where c.notice_id = p_notice_id
    order by c.created_at;
end;
$$;

create or replace function public.get_notice_reaction_summary(p_notice_id uuid)
returns table (
  reaction text,
  reaction_count bigint,
  reacted_by_me boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view reactions.';
  end if;
  if not exists (select 1 from public.notices n where n.id = p_notice_id) then
    raise exception 'Notice not found.';
  end if;

  return query
    select r.reaction, count(*), coalesce(bool_or(r.user_id = (select auth.uid())), false)
    from public.notice_reactions r
    where r.notice_id = p_notice_id
    group by r.reaction;
end;
$$;

revoke all on function public.get_notice_comments(uuid) from public, anon;
revoke all on function public.get_notice_reaction_summary(uuid) from public, anon;
grant execute on function public.get_notice_comments(uuid) to authenticated;
grant execute on function public.get_notice_reaction_summary(uuid) to authenticated;

notify pgrst, 'reload schema';
