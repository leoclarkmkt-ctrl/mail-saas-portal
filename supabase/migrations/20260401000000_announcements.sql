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

create index if not exists idx_announcements_published_at on announcements (is_published, published_at desc);
create index if not exists idx_announcements_sort on announcements (sort_order desc, published_at desc, created_at desc);

alter table announcements enable row level security;

create policy announcements_select_published
on announcements
for select
to anon, authenticated
using (is_published = true);
