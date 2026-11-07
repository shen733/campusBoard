-- Run this in the Supabase SQL Editor after creating the first account you want
-- to use as an administrator. See the project README for the bootstrap steps.

alter table public.profiles
  add column if not exists role text not null default 'student',
  add column if not exists interests text[] not null default '{}',
  add column if not exists is_discoverable boolean not null default true;

alter table public.profiles
  drop constraint if exists profiles_role_check,
  add constraint profiles_role_check check (role in ('student', 'admin')),
  drop constraint if exists profiles_interests_check,
  add constraint profiles_interests_check check (
    cardinality(interests) <= 20
    and interests <@ array[
      'Academic', 'Arts', 'Career', 'Community service', 'Design',
      'Entrepreneurship', 'Fitness', 'Gaming', 'Music', 'Science & technology',
      'Sports', 'Volunteering', 'Writing'
    ]::text[]
  );

create table if not exists public.student_invites (
  email text primary key check (email = lower(trim(email))),
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint connection_requests_not_self check (sender_id <> recipient_id),
  member_low uuid generated always as (least(sender_id, recipient_id)) stored,
  member_high uuid generated always as (greatest(sender_id, recipient_id)) stored
);

create unique index if not exists connection_requests_one_open_pair
  on public.connection_requests (member_low, member_high)
  where status in ('pending', 'accepted');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

create or replace function public.get_my_profile()
returns table (
  id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  role text,
  interests text[],
  is_discoverable boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.email, p.created_at, p.role, p.interests, p.is_discoverable
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function public.guard_student_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or not exists (
    select 1
    from public.student_invites i
    where i.email = lower(trim(new.email))
      and i.consumed_at is null
  ) then
    raise exception 'This university email has not been approved for CampusBoard. Ask an administrator to approve it.';
  end if;
  return new;
end;
$$;

create or replace function public.consume_student_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.student_invites
  set consumed_at = now()
  where email = lower(trim(new.email))
    and consumed_at is null;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    lower(trim(new.email)),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Student'),
    'student'
  )
  on conflict (id) do update
    set email = excluded.email,
        role = case when public.profiles.role = 'admin' then 'admin' else 'student' end;
  return new;
end;
$$;

drop trigger if exists campusboard_guard_student_signup on auth.users;
create trigger campusboard_guard_student_signup
before insert on auth.users
for each row execute function public.guard_student_signup();

drop trigger if exists campusboard_consume_student_invite on auth.users;
create trigger campusboard_consume_student_invite
after insert on auth.users
for each row execute function public.consume_student_invite();

create or replace function public.update_my_interests(
  p_interests text[],
  p_is_discoverable boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in.';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'student'
  ) then
    raise exception 'Only student accounts can update connection preferences.';
  end if;
  if cardinality(coalesce(p_interests, '{}')) > 20
    or not (coalesce(p_interests, '{}') <@ array[
      'Academic', 'Arts', 'Career', 'Community service', 'Design',
      'Entrepreneurship', 'Fitness', 'Gaming', 'Music', 'Science & technology',
      'Sports', 'Volunteering', 'Writing'
    ]::text[])
  then
    raise exception 'Choose interests from the available list.';
  end if;
  update public.profiles
  set interests = coalesce(p_interests, '{}'),
      is_discoverable = p_is_discoverable
  where id = (select auth.uid());
end;
$$;

create or replace function public.discover_students()
returns table (id uuid, full_name text, shared_interests text[])
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, array(
    select item.interest
    from unnest(p.interests) as item(interest)
    where item.interest = any(me.interests)
    order by item.interest
  )
  from public.profiles me
  join public.profiles p on p.id <> me.id
  where me.id = (select auth.uid())
    and me.role = 'student'
    and p.role = 'student'
    and p.is_discoverable
    and p.interests && me.interests
    and not exists (
      select 1
      from public.connection_requests r
      where r.member_low = least(me.id, p.id)
        and r.member_high = greatest(me.id, p.id)
        and r.status in ('pending', 'accepted')
    )
  order by p.full_name;
$$;

create or replace function public.list_my_connections()
returns table (
  request_id uuid,
  other_user_id uuid,
  other_name text,
  shared_interests text[],
  status text,
  direction text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
    other_profile.id,
    other_profile.full_name,
    array(
      select item.interest
      from unnest(me.interests) as item(interest)
      where item.interest = any(other_profile.interests)
      order by item.interest
    ),
    r.status,
    case when r.sender_id = me.id then 'outgoing' else 'incoming' end,
    r.created_at
  from public.connection_requests r
  join public.profiles me on me.id = (select auth.uid())
  join public.profiles other_profile
    on other_profile.id = case when r.sender_id = me.id then r.recipient_id else r.sender_id end
  where me.role = 'student'
    and (r.sender_id = me.id or r.recipient_id = me.id)
  order by r.created_at desc;
$$;

create or replace function public.send_connection_request(p_recipient_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id uuid;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'student'
  ) then
    raise exception 'Only signed-in students can send connection requests.';
  end if;
  if not exists (
    select 1
    from public.profiles me
    join public.profiles other on other.id = p_recipient_id
    where me.id = (select auth.uid())
      and other.role = 'student'
      and other.is_discoverable
      and me.interests && other.interests
  ) then
    raise exception 'This student is unavailable or you do not have a shared interest.';
  end if;

  insert into public.connection_requests (sender_id, recipient_id)
  values ((select auth.uid()), p_recipient_id)
  returning id into request_id;
  return request_id;
exception
  when unique_violation then
    raise exception 'A connection request is already pending or you are already connected.';
end;
$$;

create or replace function public.respond_to_connection_request(
  p_request_id uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_action not in ('accept', 'decline', 'cancel') then
    raise exception 'Invalid connection request action.';
  end if;
  update public.connection_requests
  set status = case p_action
    when 'accept' then 'accepted'
    when 'decline' then 'declined'
    else 'cancelled'
  end
  where id = p_request_id
    and status = 'pending'
    and (
      (p_action in ('accept', 'decline') and recipient_id = (select auth.uid()))
      or (p_action = 'cancel' and sender_id = (select auth.uid()))
    );
  if not found then
    raise exception 'Request not found or you are not allowed to perform this action.';
  end if;
end;
$$;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'notices', 'student_invites', 'connection_requests')
  loop
    execute format('drop policy %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.notices enable row level security;
alter table public.student_invites enable row level security;
alter table public.connection_requests enable row level security;

revoke all on public.profiles from public, anon, authenticated;
grant select (id, full_name, created_at) on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
revoke all on public.notices from public, anon, authenticated;
grant select, insert, update, delete on public.notices to authenticated;
revoke all on public.student_invites from public, anon, authenticated;
grant select, insert, delete on public.student_invites to authenticated;
revoke all on public.connection_requests from public, anon, authenticated;
grant select on public.connection_requests to authenticated;

create policy "profiles read self admins and notice authors"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select public.is_admin())
  or exists (select 1 from public.notices n where n.user_id = profiles.id)
);
create policy "profiles update own display name"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "notices readable by signed in users"
on public.notices for select to authenticated
using (true);
create policy "notices create as self"
on public.notices for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "notice owner or admin update"
on public.notices for update to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "notice owner or admin delete"
on public.notices for delete to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "admins manage student invites"
on public.student_invites for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()) and invited_by = (select auth.uid()));
create policy "participants read their connection requests"
on public.connection_requests for select to authenticated
using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));

revoke all on function public.is_admin() from public, anon;
revoke all on function public.get_my_profile() from public, anon;
revoke all on function public.update_my_interests(text[], boolean) from public, anon;
revoke all on function public.discover_students() from public, anon;
revoke all on function public.list_my_connections() from public, anon;
revoke all on function public.send_connection_request(uuid) from public, anon;
revoke all on function public.respond_to_connection_request(uuid, text) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.update_my_interests(text[], boolean) to authenticated;
grant execute on function public.discover_students() to authenticated;
grant execute on function public.list_my_connections() to authenticated;
grant execute on function public.send_connection_request(uuid) to authenticated;
grant execute on function public.respond_to_connection_request(uuid, text) to authenticated;

notify pgrst, 'reload schema';
