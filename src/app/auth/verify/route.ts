import { NextRequest, NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/env";

const allowedTypes = new Set(["recovery", "signup", "magiclink", "invite"]);

// Default: keep language when users copy/paste the URL
const defaultRedirectTo = "/reset?lang=zh";

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Normalize redirect_to:
 * - Supports URL-encoded values (decodeURIComponent)
 * - Supports relative paths (resolved against current request origin)
 * - Only allows http/https
 * - Returns absolute URL string or null
 */
function normalizeRedirect(request: NextRequest, redirectToRaw: string | null) {
  const raw = (redirectToRaw ?? defaultRedirectTo).trim();
  const decoded = safeDecodeURIComponent(raw);
  const base = request.nextUrl.origin;

  try {
    const parsed = new URL(decoded, base); // allows relative
    if (!/^https?:$/.test(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const type = request.nextUrl.searchParams.get("type")?.trim();
  const redirectTo = normalizeRedirect(
    request,
    request.nextUrl.searchParams.get("redirect_to")
  );

  if (!token || !type || !allowedTypes.has(type) || !redirectTo) {
    return NextResponse.json(
      { ok: false, error: "Invalid verify parameters." },
      { status: 400 }
    );
  }

  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");

  const verifyUrl = new URL(`${supabaseUrl}/auth/v1/verify`);
  verifyUrl.searchParams.set("token", token);
  verifyUrl.searchParams.set("type", type);
  verifyUrl.searchParams.set("redirect_to", redirectTo);

  return NextResponse.redirect(verifyUrl, { status: 302 });
}
