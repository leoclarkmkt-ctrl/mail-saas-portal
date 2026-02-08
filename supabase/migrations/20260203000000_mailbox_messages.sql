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

create index if not exists idx_mailboxes_owner on user_mailboxes (owner_user_id);
create index if not exists idx_email_messages_owner on email_messages (owner_user_id);
create index if not exists idx_email_messages_received on email_messages (received_at desc);

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

  select * into v_edu from edu_accounts where user_id = v_user.id;
  if found then
    raise exception 'User already has education account';
  end if;

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
