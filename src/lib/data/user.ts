import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getUserWithEdu(userId: string) {
  const supabase = createServerSupabaseClient();

  // 1) Load profile by user_id (DB is user_id–keyed)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "user_id, personal_email, is_suspended, suspended_reason, created_at"
    )
    .eq("user_id", userId)
    .single();

  if (profileError) throw profileError;

  // 2) Load edu accounts by user_id
  const { data: eduAccounts, error: eduError } = await supabase
    .from("edu_accounts")
    .select("id, edu_email, edu_username, expires_at, status, quota_mb")
    .eq("user_id", profile.user_id);

  if (eduError) throw eduError;

  // 3) Return app-layer shape (expose `id` as alias of user_id for compatibility)
  return {
    id: profile.user_id,
    user_id: profile.user_id,
    personal_email: profile.personal_email,
    is_suspended: profile.is_suspended,
    suspended_reason: profile.suspended_reason,
    created_at: profile.created_at,
    edu_accounts: eduAccounts ?? []
  };
}
