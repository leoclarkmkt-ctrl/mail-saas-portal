import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getUserWithEdu(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, personal_email, is_suspended, suspended_reason, created_at, edu_accounts(id, edu_email, edu_username, expires_at, status, quota_mb)"
    )
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}
