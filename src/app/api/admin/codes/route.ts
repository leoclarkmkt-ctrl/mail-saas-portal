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

const PAGE_SIZE = 50;

const normalizePage = (raw: string | null) => {
  const page = Number(raw ?? "1");
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
};

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const status = request.nextUrl.searchParams.get("status") ?? "all";
  const queryValue = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const escapedQuery = queryValue.replace(/[%_]/g, "\$&");
  const page = normalizePage(request.nextUrl.searchParams.get("page"));
  const supabase = createServerSupabaseClient();

  const applyFilters = <T,>(builder: T) => {
    let next = builder as any;
    if (["unused", "used", "revoked"].includes(status)) {
      next = next.eq("status", status);
    }
    if (queryValue) {
      next = next.or(`code.ilike.%${escapedQuery}%,note.ilike.%${escapedQuery}%,code.ilike.${escapedQuery}%`);
    }
    return next;
  };

  const countQuery = applyFilters(
    supabase.from("activation_codes").select("code", { count: "exact", head: true })
  );
  const { count, error: countError } = await countQuery;
  if (countError) return jsonError(countError.message, 500);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const dataQuery = applyFilters(
    supabase
      .from("activation_codes")
      .select("code,status,created_at,note,used_at,used_by_user_id")
      .order("created_at", { ascending: false })
      .range(from, to)
  );
  const { data, error } = await dataQuery;
  if (error) return jsonError(error.message, 500);
  return jsonSuccess({ ok: true, data: data ?? [], total, page: safePage, pageSize: PAGE_SIZE, totalPages });
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
