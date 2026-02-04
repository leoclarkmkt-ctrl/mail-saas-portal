import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { adminLoginSchema } from "@/lib/validation/schemas";
import { getAdminEnv } from "@/lib/env";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { createAdminSession } from "@/lib/auth/admin-session";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await enforceRateLimit(request, "admin-login", {
    requests: 5,
    windowSeconds: 60
  });
  if (rateLimitResponse) return rateLimitResponse;
  const body = await request.json();
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
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
    return jsonError("Invalid credentials", 401);
  }
  const ok = await bcrypt.compare(parsed.data.password, hash);
  if (!ok) {
    return jsonError("Invalid credentials", 401);
  }
  await createAdminSession({ email });
  return jsonSuccess({ ok: true });
}
