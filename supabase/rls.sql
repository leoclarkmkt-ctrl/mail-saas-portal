alter table activation_codes enable row level security;
alter table profiles enable row level security;
alter table edu_accounts enable row level security;
-- password_reset_tokens removed (Supabase Auth handles recovery)
alter table audit_logs enable row level security;
alter table user_presence enable row level security;

-- No public policies. Service Role bypasses RLS.
