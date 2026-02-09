import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireUserSession } from "@/lib/auth/user-session";

export const runtime = "nodejs";

const RAW_LIMIT = 1_000_000;

const jsonError = (code: string, message: string, status = 400) =>
  NextResponse.json({ ok: false, error: { code, message } }, { status });

export async function GET(request: NextRequest) {
  const session = await requireUserSession();
  if (!session || session.mode !== "edu") {
    return jsonError("unauthorized", "Unauthorized", 401);
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return jsonError("missing_id", "Missing message id", 400);
  }

  const includeRaw = request.nextUrl.searchParams.get("includeRaw") === "1";
  const supabase = createServerSupabaseClient();
  const { data: message, error } = includeRaw
    ? await supabase
        .from("email_messages")
        .select("id, subject, mail_from, received_at, text_plain, html_body, raw_rfc822")
        .eq("owner_user_id", session.userId)
        .eq("id", id)
        .maybeSingle()
    : await supabase
        .from("email_messages")
        .select("id, subject, mail_from, received_at, text_plain, html_body")
        .eq("owner_user_id", session.userId)
        .eq("id", id)
        .maybeSingle();

  if (error) {
    return jsonError("message_lookup_failed", error.message, 500);
  }
  if (!message) {
    return jsonError("not_found", "Message not found", 404);
  }

  let raw = includeRaw ? (message as { raw_rfc822?: string | null }).raw_rfc822 ?? null : null;
  let truncated = false;
  if (raw && raw.length > RAW_LIMIT) {
    raw = raw.slice(0, RAW_LIMIT);
    truncated = true;
  }

  const responseMessage = {
    id: message.id,
    subject: message.subject ?? null,
    mail_from: message.mail_from ?? null,
    received_at: message.received_at ?? null,
    text_plain: message.text_plain ?? null,
    html_body: message.html_body ?? null,
    ...(includeRaw ? { raw_rfc822: raw, raw_rfc822_truncated: truncated } : {})
  };

  return NextResponse.json({ ok: true, message: responseMessage });
}
