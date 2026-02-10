import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string | null;
  ip: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

type AuditLogWithEmail = AuditLogRow & { edu_email: string | null; description: string | null };
type AttachEduEmailsResult = { data: AuditLogWithEmail[] } | { error: Error };

function extractDescription(meta: Record<string, unknown> | null): string | null {
  if (!meta) return null;
  const candidates = [meta.description, meta.message, meta.detail];
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return null;
}

async function attachEduEmails(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  rows: AuditLogRow[]
): Promise<AttachEduEmailsResult> {
  const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean))) as string[];
  if (userIds.length === 0) {
    return { data: rows.map((row) => ({ ...row, edu_email: null, description: extractDescription(row.meta) })) };
  }

  const { data, error } = await supabase
    .from("edu_accounts")
    .select("user_id, edu_email")
    .in("user_id", userIds);
  if (error) return { error: new Error(error.message) };

  const eduMap = new Map((data ?? []).map((row) => [row.user_id, row.edu_email]));
  return {
    data: rows.map((row) => ({
      ...row,
      edu_email: row.user_id ? eduMap.get(row.user_id) ?? null : null,
      description: extractDescription(row.meta)
    }))
  };
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  const escapedQuery = query.replace(/[%_]/g, "\\$&");
  const supabase = createServerSupabaseClient();
  if (!query) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, user_id, action, ip, meta, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return jsonError(error.message, 500);
    const enriched = await attachEduEmails(supabase, (data ?? []) as AuditLogRow[]);
    if ("error" in enriched) return jsonError(enriched.error.message, 500);
    return jsonSuccess({ ok: true, data: enriched.data ?? [] });
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, action, ip, meta, created_at")
    .or(`action.ilike.%${escapedQuery}%,ip.ilike.%${escapedQuery}%,user_id::text.ilike.%${escapedQuery}%`)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return jsonError(error.message, 500);
  const enriched = await attachEduEmails(supabase, (data ?? []) as AuditLogRow[]);
  if ("error" in enriched) return jsonError(enriched.error.message, 500);
  return jsonSuccess({ ok: true, data: enriched.data ?? [] });
}
