import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/utils/api";

export const runtime = "nodejs";

const EXPORT_LIMIT = 10000;

const escapeCsv = (value: string | null | undefined) => {
  const safe = value ?? "";
  if (/[",\n]/.test(safe)) {
    return `"${safe.replace(/"/g, "\"\"")}"`;
  }
  return safe;
};

const toCsv = (rows: Record<string, string | null>[], header: string[]) => {
  const lines = [
    header.join(","),
    ...rows.map((row) => header.map((key) => escapeCsv(row[key] ?? "")).join(","))
  ];
  return lines.join("\n");
};

const buildFilename = (label: string) => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return `activation_codes-${label}-${stamp}.csv`;
};

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);

  const status = request.nextUrl.searchParams.get("status") ?? "all";
  const queryValue = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const escapedQuery = queryValue.replace(/[%_]/g, "\\$&");
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("activation_codes")
    .select("code,status,created_at,note,used_at,used_by_user_id")
    .order("created_at", { ascending: false });
  if (["unused", "used", "revoked"].includes(status)) {
    query = query.eq("status", status);
  }
  if (queryValue) {
    query = query.or(
      `code.ilike.%${escapedQuery}%,note.ilike.%${escapedQuery}%,code.ilike.${escapedQuery}%`
    );
  }

  const { data, error } = await query.limit(EXPORT_LIMIT);
  if (error) return jsonError(error.message, 500);

  const rows = (data ?? []).map((row) => ({
    code: row.code,
    status: row.status,
    created_at: row.created_at,
    note: row.note,
    used_at: row.used_at,
    used_by_user_id: row.used_by_user_id
  }));
  const header = ["code", "status", "created_at", "note", "used_at", "used_by_user_id"];
  const csv = toCsv(rows, header);
  const filename = buildFilename(status);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`
    }
  });
}

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
    .select("code,status,created_at,note,used_at,used_by_user_id")
    .in("code", codes)
    .limit(EXPORT_LIMIT);
  if (error) return jsonError(error.message, 500);

  const rows = (data ?? []).map((row) => ({
    code: row.code,
    status: row.status,
    created_at: row.created_at,
    note: row.note,
    used_at: row.used_at,
    used_by_user_id: row.used_by_user_id
  }));
  const header = ["code", "status", "created_at", "note", "used_at", "used_by_user_id"];
  const csv = toCsv(rows, header);
  const filename = buildFilename(`selected-${codes.length}`);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`
    }
  });
}
