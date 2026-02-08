import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data: dbInfo, error: dbError } = await supabase.rpc("sql", {
    query: "select current_database(), current_schema(), version();"
  });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const { data: rpcInfo, error: rpcError } = await supabase.rpc("sql", {
    query:
      "select exists( select 1 from information_schema.routines where routine_schema='public' and routine_name='redeem_activation_code');"
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  return NextResponse.json([dbInfo, rpcInfo]);
}
