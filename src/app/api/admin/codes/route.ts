import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminGenerateCodesSchema, adminRevokeCodeSchema } from "@/lib/validation/schemas";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(length: number) {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("activation_codes").select("code,status,created_at").order("created_at", { ascending: false }).limit(100);
  return jsonSuccess({ codes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const body = await request.json();
  const parsed = adminGenerateCodesSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const { quantity, prefix, length } = parsed.data;
  const codes = Array.from({ length: quantity }, () => `${prefix ?? ""}${generateCode(length)}`);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("activation_codes").insert(codes.map((code) => ({ code })));
  if (error) return jsonError(error.message, 400);
  await supabase.from("audit_logs").insert({ action: "admin_generate_codes", meta: { quantity } });
  const { data } = await supabase.from("activation_codes").select("code,status,created_at").in("code", codes);
  return jsonSuccess({ codes: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const body = await request.json();
  const parsed = adminRevokeCodeSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("activation_codes").select("status").eq("code", parsed.data.code).single();
  if (!data || data.status !== "unused") {
    return jsonError("Code cannot be revoked", 400);
  }
  await supabase
    .from("activation_codes")
    .update({ status: "revoked" })
    .eq("code", parsed.data.code);
  await supabase.from("audit_logs").insert({ action: "admin_revoke_code", meta: { code: parsed.data.code } });
  return jsonSuccess({ ok: true });
}
