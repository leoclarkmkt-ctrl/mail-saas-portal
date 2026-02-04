import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { setMailboxActive } from "@/lib/mailcow";

export const runtime = "nodejs";

type FailureEntry = {
  email: string;
  reason: string;
};

const runExpireJob = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: "Missing CRON_SECRET" }, { status: 500 });
  }

  if (!token || token !== cronSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("edu_accounts")
    .select("id, edu_email, expires_at, status")
    .lt("expires_at", nowIso)
    .neq("status", "expired");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  const rows = data ?? [];
  let disabled = 0;
  const failures: FailureEntry[] = [];

  for (const row of rows) {
    const email = row.edu_email;
    const mailcowResult = await setMailboxActive(email, false);
    if (!mailcowResult.ok) {
      failures.push({
        email,
        reason: String(mailcowResult.detail ?? mailcowResult.error ?? "Mailcow error")
      });
      continue;
    }

    const { error: updateError } = await supabase
      .from("edu_accounts")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (updateError) {
      failures.push({ email, reason: updateError.message });
      continue;
    }
    disabled += 1;
  }

  return NextResponse.json({
    ok: true,
    scanned: rows.length,
    disabled,
    failed: failures.length,
    failures: failures.length > 0 ? failures : undefined
  });
};

export async function GET(request: NextRequest) {
  return runExpireJob(request);
}

export async function POST(request: NextRequest) {
  return runExpireJob(request);
}
