alter table profiles add column if not exists user_id uuid;
alter table profiles add column if not exists personal_email text;
alter table profiles add column if not exists is_suspended boolean not null default false;

update profiles set user_id = id where user_id is null;

do $$
begin
  alter table profiles alter column user_id set not null;
exception
  when others then null;
end $$;

do $$
begin
  alter table profiles alter column personal_email set not null;
exception
  when others then null;
end $$;

do $$
begin
  alter table profiles add constraint profiles_personal_email_key unique (personal_email);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table profiles add constraint profiles_user_id_key unique (user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table profiles add constraint profiles_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
exception
  when duplicate_object then null;
end $$;
