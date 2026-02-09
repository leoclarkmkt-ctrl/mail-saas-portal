import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);

  let body: { codes?: string[] } = {};
  try {
    body = (await request.json()) as { codes?: string[] };
  } catch {
    return jsonError("Invalid input", 400);
  }
  const codes = Array.isArray(body.codes) ? body.codes.filter(Boolean) : [];
  if (codes.length === 0) return jsonError("Invalid input", 400);

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("activation_codes")
    .select("code,status")
    .in("code", codes);
  if (error) return jsonError(error.message, 500);

  const unusedCodes = (data ?? []).filter((row) => row.status === "unused").map((row) => row.code);
  if (unusedCodes.length > 0) {
    const { error: updateError } = await supabase
      .from("activation_codes")
      .update({ status: "revoked" })
      .in("code", unusedCodes);
    if (updateError) return jsonError(updateError.message, 500);
  }

  await supabase.from("audit_logs").insert({
    action: "admin_revoke_code_batch",
    meta: { codes: unusedCodes, requested: codes.length }
  });

  const updated = unusedCodes.length;
  const skipped = codes.length - updated;
  return jsonSuccess({ ok: true, updated, skipped });
}
