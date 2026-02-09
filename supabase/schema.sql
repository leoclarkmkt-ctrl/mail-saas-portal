create extension if not exists "pgcrypto";

create type activation_code_status as enum ('unused','used','revoked');
create type edu_status as enum ('active','expired');

create table if not exists activation_codes (
  code text primary key,
  status activation_code_status not null default 'unused',
  used_at timestamptz,
  used_by_user_id uuid,
  created_at timestamptz not null default now(),
  note text
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  personal_email text unique not null,
  is_suspended boolean not null default false,
  suspended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists edu_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  edu_email text unique not null,
  edu_username text unique not null,
  quota_mb int not null default 5,
  expires_at timestamptz not null,
  status edu_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_mailboxes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid unique references auth.users(id) on delete cascade,
  edu_email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists email_messages (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  edu_email text not null,
  subject text,
  mail_from text,
  received_at timestamptz not null,
  text_plain text,
  html_body text,
  raw_rfc822 text,
  created_at timestamptz not null default now()
);

-- password_reset_tokens removed (Supabase Auth handles recovery)

create table if not exists audit_logs (
  id bigserial primary key,
  user_id uuid,
  action text not null,
  ip text,
  ua text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  content_json jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  published_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists announcement_views (
  id bigint generated always as identity primary key,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on profiles (personal_email);
create index if not exists idx_edu_email on edu_accounts (edu_email);
create index if not exists idx_edu_username on edu_accounts (edu_username);
create index if not exists idx_mailboxes_owner on user_mailboxes (owner_user_id);
create index if not exists idx_email_messages_owner on email_messages (owner_user_id);
create index if not exists idx_email_messages_received on email_messages (received_at desc);
create index if not exists idx_audit_action on audit_logs (action);
create index if not exists idx_audit_user on audit_logs (user_id);
create unique index if not exists idx_user_presence_user_id on user_presence (user_id);
create index if not exists idx_user_presence_last_seen on user_presence (last_seen_at desc);
create index if not exists idx_announcements_published_at on announcements (is_published, published_at desc);
create index if not exists idx_announcements_sort on announcements (sort_order desc, published_at desc, created_at desc);
create index if not exists idx_announcement_views_announcement_time on announcement_views (announcement_id, created_at desc);
create index if not exists idx_announcement_views_time on announcement_views (created_at desc);
create index if not exists idx_announcement_views_announcement_user on announcement_views (announcement_id, user_id);

alter table announcements enable row level security;
alter table announcement_views enable row level security;

create policy announcements_select_published
on announcements
for select
to anon, authenticated
using (is_published = true);

create policy announcement_views_insert
on announcement_views
for insert
to anon, authenticated
with check (true);

create or replace function redeem_activation_code(
  p_code text,
  p_user_id uuid,
  p_personal_email text,
  p_edu_username text
)
returns table (user_id uuid, personal_email text, edu_email text, expires_at timestamptz)
language plpgsql
as $$
declare
  v_code activation_codes%rowtype;
  v_user profiles%rowtype;
  v_edu edu_accounts%rowtype;
  v_now timestamptz := now();
  v_expires timestamptz;
  v_username text := lower(p_edu_username);
  v_personal text := lower(p_personal_email);
  v_edu_email text := lower(p_edu_username) || '@nsuk.edu.kg';
begin
  select * into v_code from activation_codes where code = p_code for update;
  if not found or v_code.status <> 'unused' then
    raise exception 'Activation code invalid';
  end if;

  select * into v_user from profiles where id = p_user_id;
  if not found then
    insert into profiles (id, personal_email) values (p_user_id, v_personal) returning * into v_user;
  end if;

  -- 🆕 新增检查：用户是否已拥有教育邮箱
  select * into v_edu from edu_accounts where user_id = v_user.id;
  if found then
    raise exception 'User already has education account';
  end if;

  -- 创建新的教育账户
  if exists(select 1 from edu_accounts where edu_username = v_username) then
    raise exception 'Edu username exists';
  end if;
  v_expires := v_now + interval '1 year';
  insert into edu_accounts (user_id, edu_email, edu_username, expires_at, status)
  values (v_user.id, v_edu_email, v_username, v_expires, 'active')
  returning * into v_edu;

  insert into user_mailboxes (owner_user_id, edu_email)
  values (v_user.id, v_edu_email)
  on conflict (owner_user_id) do update set edu_email = excluded.edu_email;

  update activation_codes
  set status = 'used', used_at = v_now, used_by_user_id = v_user.id
  where code = p_code;

  insert into audit_logs (user_id, action, meta)
  values (v_user.id, 'user_redeem', jsonb_build_object('code', p_code));

  return query select v_user.id, v_user.personal_email, v_edu.edu_email, v_edu.expires_at;
end;
$$;

create or replace function renew_with_code(p_user_id uuid, p_code text)
returns table (expires_at timestamptz)
language plpgsql
as $$
declare
  v_code activation_codes%rowtype;
  v_edu edu_accounts%rowtype;
  v_now timestamptz := now();
  v_expires timestamptz;
begin
  select * into v_code from activation_codes where code = p_code for update;
  if not found or v_code.status <> 'unused' then
    raise exception 'Activation code invalid';
  end if;
  select * into v_edu from edu_accounts where user_id = p_user_id;
  if not found then
    raise exception 'Edu account missing';
  end if;

  v_expires := (case when v_edu.expires_at > v_now then v_edu.expires_at else v_now end) + interval '1 year';
  update edu_accounts set expires_at = v_expires, status = 'active', updated_at = v_now where id = v_edu.id;
  update activation_codes set status = 'used', used_at = v_now, used_by_user_id = p_user_id where code = p_code;
  return query select v_expires;
end;
$$;

create or replace function admin_renew_user(p_user_id uuid, p_years int)
returns void
language plpgsql
as $$
declare
  v_edu edu_accounts%rowtype;
  v_now timestamptz := now();
  v_expires timestamptz;
begin
  select * into v_edu from edu_accounts where user_id = p_user_id;
  if not found then
    raise exception 'Edu account missing';
  end if;
  v_expires := (case when v_edu.expires_at > v_now then v_edu.expires_at else v_now end) + make_interval(years => p_years);
  update edu_accounts set expires_at = v_expires, status = 'active', updated_at = v_now where id = v_edu.id;
end;
$$;

create or replace function admin_code_counts()
returns table (unused bigint, used bigint, revoked bigint)
language sql
as $$
  select
    count(*) filter (where status = 'unused') as unused,
    count(*) filter (where status = 'used') as used,
    count(*) filter (where status = 'revoked') as revoked
  from activation_codes;
$$;

create or replace function admin_edu_counts()
returns table (active bigint, expired bigint)
language sql
as $$
  select
    count(*) filter (where expires_at > now()) as active,
    count(*) filter (where expires_at <= now()) as expired
  from edu_accounts;
$$;

create or replace function admin_activity_counts()
returns table (redeems bigint, logins bigint)
language sql
as $$
  select
    count(*) filter (where action = 'user_redeem' and created_at > now() - interval '24 hours') as redeems,
    count(*) filter (where action like 'user_login_%' and created_at > now() - interval '24 hours') as logins
  from audit_logs;
$$;
