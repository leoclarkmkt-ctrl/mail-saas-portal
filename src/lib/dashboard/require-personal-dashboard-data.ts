import { redirect } from "next/navigation";

import { getUserSession } from "@/lib/auth/user-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requirePersonalDashboardData(): Promise<{
  personalEmail: string;
  eduEmail: string;
  expiresAtIso: string | null;
  statusKey: string;
  suspended: boolean;
  expired: boolean;
}> {
  const session = await getUserSession();
  if (!session || session.mode !== "personal") {
    redirect("/login");
  }

  const supabase = createServerSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("personal_email, is_suspended")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (profileError || !profile) {
    redirect("/login");
  }

  const { data: eduAccount, error: eduError } = await supabase
    .from("edu_accounts")
    .select("edu_email, expires_at, status")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (eduError || !eduAccount) {
    redirect("/login");
  }

  const expiresAtMs = eduAccount.expires_at
    ? Date.parse(eduAccount.expires_at)
    : NaN;

  const expired = Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now();
  const suspended = profile.is_suspended ?? eduAccount.status === "suspended";

  return {
    personalEmail: profile.personal_email,
    eduEmail: eduAccount.edu_email,
    expiresAtIso: eduAccount.expires_at ?? null,
    statusKey: eduAccount.status,
    suspended,
    expired,
  };
}
