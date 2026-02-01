alter table activation_codes enable row level security;
alter table users enable row level security;
alter table edu_accounts enable row level security;
alter table password_reset_tokens enable row level security;
alter table audit_logs enable row level security;

-- No public policies. Service Role bypasses RLS.
