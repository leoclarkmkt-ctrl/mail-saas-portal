import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserSession } from "@/lib/auth/user-session";

export const runtime = "nodejs";

const jsonError = (code: string, message: string, status = 400) =>
  NextResponse.json({ ok: false, error: { code, message } }, { status });

export async function GET(request: NextRequest) {
  const session = await getUserSession();
  if (!session || session.mode !== "edu") {
    return jsonError("unauthorized", "Unauthorized", 401);
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "5");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 5;

  const supabase = createServerSupabaseClient();

  const { data: mailbox, error: mailboxError } = await supabase
    .from("user_mailboxes")
    .select("edu_email")
    .eq("owner_user_id", session.userId)
    .maybeSingle();

  if (mailboxError) {
    return jsonError("mailbox_lookup_failed", mailboxError.message, 500);
  }

  const { data: eduAccount, error: eduError } = await supabase
    .from("edu_accounts")
    .select("expires_at")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (eduError) {
    return jsonError("edu_account_lookup_failed", eduError.message, 500);
  }

  const { data: messages, error } = await supabase
    .from("email_messages")
    .select("id, subject, mail_from, received_at")
    .eq("owner_user_id", session.userId)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) {
    return jsonError("messages_lookup_failed", error.message, 500);
  }

  return NextResponse.json({
    ok: true,
    edu_email: mailbox?.edu_email ?? null,
    expires_at: eduAccount?.expires_at ?? null,
    messages: messages ?? []
  });
}
