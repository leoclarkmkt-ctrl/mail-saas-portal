import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export const runtime = "nodejs";

type ProbeResult = {
  ok: boolean;
  error?: string;
  column_missing?: boolean;
  exists?: boolean;
};

const sanitizeError = (error: unknown) => {
  if (!error) return undefined;
  if (error instanceof Error) {
    const message = error.message;
    if (!message) return "Unknown error";
    return message.length > 300 ? `${message.slice(0, 300)}...` : message;
  }
  if (typeof error === "string") {
    return error.length > 300 ? `${error.slice(0, 300)}...` : error;
  }
  const message =
    typeof (error as { message?: unknown })?.message === "string"
      ? (error as { message?: string }).message
      : "Unknown error";
  if (!message) return "Unknown error";
  return message.length > 300 ? `${message.slice(0, 300)}...` : message;
};

const isColumnMissingError = (message?: string) => {
  if (!message) return false;
  return /column/i.test(message) && /does not exist/i.test(message);
};

const rpcMissing = (message?: string) => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    (normalized.includes("could not find the function") ||
      normalized.includes("schema cache")) &&
    normalized.includes("redeem_activation_code")
  );
};

export async function GET() {
  let supabase;
  let connectionError: string | undefined;

  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    connectionError = sanitizeError(error as Error);
  }

  const probes: Record<string, ProbeResult> = {
    profiles_user_id_select: { ok: false },
    rpc_redeem_activation_code: { ok: false, exists: false },
    activation_codes_select: { ok: false },
    user_mailboxes_select: { ok: false },
    email_messages_select: { ok: false }
  };

  if (!supabase) {
    if (connectionError) {
      Object.values(probes).forEach((probe) => {
        probe.error = connectionError;
      });
    }
    return NextResponse.json({ ok: false, probes }, { status: 500 });
  }

  const profilesResult = await supabase.from("profiles").select("user_id").limit(1);
  const profilesError = sanitizeError(profilesResult.error);
  probes.profiles_user_id_select = {
    ok: !profilesResult.error,
    error: profilesError,
    column_missing: isColumnMissingError(profilesError)
  };

  const rpcResult = await supabase.rpc("redeem_activation_code", {
    p_code: "__probe__",
    p_user_id: "00000000-0000-0000-0000-000000000000",
    p_personal_email: "probe@example.com",
    p_edu_username: "probeuser"
  });
  const rpcError = sanitizeError(rpcResult.error);
  probes.rpc_redeem_activation_code = {
    ok: !rpcResult.error,
    error: rpcError,
    exists: rpcError ? !rpcMissing(rpcError) : true
  };

  const activationCodesResult = await supabase
    .from("activation_codes")
    .select("code,status")
    .limit(1);
  probes.activation_codes_select = {
    ok: !activationCodesResult.error,
    error: sanitizeError(activationCodesResult.error)
  };

  const userMailboxesResult = await supabase
    .from("user_mailboxes")
    .select("edu_email,owner_user_id")
    .limit(1);
  probes.user_mailboxes_select = {
    ok: !userMailboxesResult.error,
    error: sanitizeError(userMailboxesResult.error)
  };

  const emailMessagesResult = await supabase
    .from("email_messages")
    .select("id,owner_user_id,received_at")
    .limit(1);
  probes.email_messages_select = {
    ok: !emailMessagesResult.error,
    error: sanitizeError(emailMessagesResult.error)
  };

  const ok = Object.values(probes).every((probe) => probe.ok);

  return NextResponse.json({ ok, probes });
}
