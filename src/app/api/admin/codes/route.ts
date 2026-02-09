import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminGenerateCodesSchema, adminRevokeCodeSchema } from "@/lib/validation/schemas";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { randomString } from "@/lib/security/random";
import { getClientIp } from "@/lib/security/client-ip";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(length: number) {
  return randomString(length, CHARS);
}

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const status = request.nextUrl.searchParams.get("status") ?? "all";
  const queryValue = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const escapedQuery = queryValue.replace(/[%_]/g, "\\$&");
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("activation_codes")
    .select("code,status,created_at,note,used_at,used_by_user_id", { count: "exact" })
    .order("created_at", { ascending: false });
  if (["unused", "used", "revoked"].includes(status)) {
    query = query.eq("status", status);
  }
  if (queryValue) {
    query = query.or(
      `code.ilike.%${escapedQuery}%,note.ilike.%${escapedQuery}%,code.ilike.${escapedQuery}%`
    );
  }
  const { data, count, error } = await query.limit(200);
  if (error) return jsonError(error.message, 500);
  return jsonSuccess({ ok: true, data: data ?? [], total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const body = await request.json();
  const parsed = adminGenerateCodesSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const { quantity, prefix, length, note } = parsed.data;
  const codes = Array.from({ length: quantity }, () => `${prefix ?? ""}${generateCode(length)}`);
  const supabase = createServerSupabaseClient();
  const clientIp = getClientIp(request);
  const { error } = await supabase
    .from("activation_codes")
    .insert(codes.map((code) => ({ code, note: note ?? null })));
  if (error) return jsonError(error.message, 400);
  await supabase
    .from("audit_logs")
    .insert({ action: "admin_generate_codes", meta: { quantity, note }, ip: clientIp });
  const { data } = await supabase.from("activation_codes").select("code,status,created_at,note").in("code", codes);
  return jsonSuccess({ codes: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const body = await request.json();
  const parsed = adminRevokeCodeSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const supabase = createServerSupabaseClient();
  const clientIp = getClientIp(request);
  const { data } = await supabase.from("activation_codes").select("status").eq("code", parsed.data.code).single();
  if (!data || data.status !== "unused") {
    return jsonError("Code cannot be revoked", 400);
  }
  await supabase
    .from("activation_codes")
    .update({ status: "revoked" })
    .eq("code", parsed.data.code);
  await supabase
    .from("audit_logs")
    .insert({ action: "admin_revoke_code", meta: { code: parsed.data.code }, ip: clientIp });
  return jsonSuccess({ ok: true });
}
