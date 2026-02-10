import { NextRequest, NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/env";

const allowedTypes = new Set(["recovery", "signup", "magiclink", "invite"]);
const defaultRedirectTo = "/reset?lang=zh";

function decodeRedirectValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeRedirect(request: NextRequest, redirectToRaw: string | null) {
  const decoded = decodeRedirectValue((redirectToRaw ?? defaultRedirectTo).trim());
  const base = request.nextUrl.origin;

  try {
    const parsed = new URL(decoded, base);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const type = request.nextUrl.searchParams.get("type")?.trim();
  const redirectTo = normalizeRedirect(request, request.nextUrl.searchParams.get("redirect_to"));

  if (!token || !type || !allowedTypes.has(type) || !redirectTo) {
    return NextResponse.json({ ok: false, error: "Invalid verify parameters." }, { status: 400 });
  }

  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  const verifyUrl = new URL(`${supabaseUrl}/auth/v1/verify`);
  verifyUrl.searchParams.set("token", token);
  verifyUrl.searchParams.set("type", type);
  verifyUrl.searchParams.set("redirect_to", redirectTo);

  return NextResponse.redirect(verifyUrl, { status: 302 });
}
