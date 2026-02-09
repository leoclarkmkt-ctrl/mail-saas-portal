create table if not exists announcement_views (
  id bigint generated always as identity primary key,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_announcement_views_announcement_time on announcement_views (announcement_id, created_at desc);
create index if not exists idx_announcement_views_time on announcement_views (created_at desc);
create index if not exists idx_announcement_views_announcement_user on announcement_views (announcement_id, user_id);

alter table announcement_views enable row level security;

create policy announcement_views_insert
on announcement_views
for insert
to anon, authenticated
with check (true);
