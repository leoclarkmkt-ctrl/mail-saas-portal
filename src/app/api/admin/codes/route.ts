import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminGenerateCodesSchema, adminRevokeCodeSchema } from "@/lib/validation/schemas";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { randomString } from "@/lib/security/random";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(length: number) {
  return randomString(length, CHARS);
}

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const status = request.nextUrl.searchParams.get("status");
  const exportCsv = request.nextUrl.searchParams.get("export") === "csv";
  const supabase = createServerSupabaseClient();
  let query = supabase.from("activation_codes").select("code,status,created_at,note").order("created_at", { ascending: false });
  if (status && ["unused", "used", "revoked"].includes(status)) {
    query = query.eq("status", status);
  }
  const { data } = await query.limit(200);
  const codes = data ?? [];

  if (exportCsv) {
    const header = "code,created_at,note";
    const lines = codes
      .filter((c) => c.status === "unused")
      .map((c) => `${c.code},${c.created_at},${(c.note ?? "").replace(/\n|\r|,/g, " ")}`);
    const csv = [header, ...lines].join("\n");
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=activation-codes.csv"
      }
    });
  }

  return jsonSuccess({ codes });
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
  const { error } = await supabase
    .from("activation_codes")
    .insert(codes.map((code) => ({ code, note: note ?? null })));
  if (error) return jsonError(error.message, 400);
  await supabase.from("audit_logs").insert({ action: "admin_generate_codes", meta: { quantity, note } });
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
