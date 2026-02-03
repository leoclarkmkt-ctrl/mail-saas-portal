-- Rename users table to profiles and remove password hash dependency.
alter table if exists users rename to profiles;

alter table if exists profiles
  drop column if exists password_hash;

alter table if exists profiles
  add column if not exists personal_email text unique;

alter table if exists profiles
  alter column personal_email set not null;

-- Update foreign key to auth.users
alter table if exists edu_accounts drop constraint if exists edu_accounts_user_id_fkey;

alter table if exists edu_accounts
  add constraint edu_accounts_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- Remove legacy password reset tokens
 drop table if exists password_reset_tokens;

-- Adjust indexes
create index if not exists idx_profiles_email on profiles (personal_email);
