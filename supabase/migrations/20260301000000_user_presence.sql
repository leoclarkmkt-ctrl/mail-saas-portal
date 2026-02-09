create table if not exists user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null
);

create unique index if not exists idx_user_presence_user_id on user_presence (user_id);
create index if not exists idx_user_presence_last_seen on user_presence (last_seen_at desc);
