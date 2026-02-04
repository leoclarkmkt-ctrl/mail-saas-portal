import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { adminLoginSchema } from "@/lib/validation/schemas";
import { getAdminEnv } from "@/lib/env";
import { jsonError, jsonFieldError, jsonSuccess } from "@/lib/utils/api";
import { createAdminSession } from "@/lib/auth/admin-session";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  /**
   * Error keys:
   * - admin_email_invalid
   * - admin_password_invalid
   */
  const rateLimitResponse = await enforceRateLimit(request, "admin-login", {
    requests: 5,
    windowSeconds: 60
  });
  if (rateLimitResponse) return rateLimitResponse;
  const body = await request.json();
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonFieldError("email", "admin_email_invalid", 400);
  }
  let email: string;
  let hash: string;
  try {
    const env = getAdminEnv();
    email = env.ADMIN_EMAIL.toLowerCase();
    hash = env.ADMIN_PASSWORD_HASH;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Admin not configured", 500);
  }
  if (parsed.data.email !== email) {
    return jsonFieldError("email", "admin_email_invalid", 401);
  }
  const ok = await bcrypt.compare(parsed.data.password, hash);
  if (!ok) {
    return jsonFieldError("password", "admin_password_invalid", 401);
  }
  await createAdminSession({ email });
  return jsonSuccess({ ok: true });
}
