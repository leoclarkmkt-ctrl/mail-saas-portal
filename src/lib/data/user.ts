import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getUserWithEdu(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "user_id, personal_email, is_suspended, suspended_reason, created_at"
    )
    .eq("user_id", userId)
    .single();
  if (profileError) throw profileError;

  const { data: eduAccounts, error: eduError } = await supabase
    .from("edu_accounts")
    .select("id, edu_email, edu_username, expires_at, status, quota_mb")
    .eq("user_id", profile.user_id);
  if (eduError) throw eduError;

  return {
    ...profile,
    edu_accounts: eduAccounts ?? []
  };
}
