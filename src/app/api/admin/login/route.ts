import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { adminLoginSchema } from "@/lib/validation/schemas";
import { getAdminEnv } from "@/lib/env";
import { jsonError, jsonFieldError, jsonSuccess } from "@/lib/utils/api";
import { createAdminSession } from "@/lib/auth/admin-session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeTrimLower } from "@/lib/safe-trim";

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
  console.log("========== ADMIN LOGIN DEBUG ==========");
  console.log("Raw body.email:", JSON.stringify(body.email));
  console.log("Body email length:", body.email?.length);
  console.log("Parsed success:", parsed.success);
  if (parsed.success) {
    console.log("Parsed email:", JSON.stringify(parsed.data.email));
    console.log("Parsed email length:", parsed.data.email.length);
  } else {
    console.log("Parse errors:", JSON.stringify(parsed.error.issues));
  }
  if (!parsed.success) {
    return jsonFieldError("email", "admin_email_invalid", 400);
  }
  let email: string;
  let hash: string;
  try {
    const env = getAdminEnv();
    email = safeTrimLower(env.ADMIN_EMAIL);
    hash = env.ADMIN_PASSWORD_HASH;
    console.log("Env ADMIN_EMAIL (raw):", JSON.stringify(process.env.ADMIN_EMAIL));
    console.log("Env ADMIN_EMAIL length:", process.env.ADMIN_EMAIL?.length);
    console.log("Normalized env email:", JSON.stringify(email));
    console.log("Normalized env email length:", email.length);
  } catch (error) {
    console.log("getAdminEnv error:", error);
    return jsonError(error instanceof Error ? error.message : "Admin not configured", 500);
  }
  const inputEmail = safeTrimLower(parsed.data.email);
  console.log("Input email (normalized):", JSON.stringify(inputEmail));
  console.log("Input email length:", inputEmail.length);
  console.log("Emails match:", inputEmail === email);
  console.log("Char-by-char comparison:");
  for (let i = 0; i < Math.max(inputEmail.length, email.length); i += 1) {
    console.log(
      `  [${i}] input: "${inputEmail[i]}" (${inputEmail.charCodeAt(i)}) vs env: "${email[i]}" (${email.charCodeAt(i)})`
    );
  }
  console.log("=======================================");
  if (inputEmail !== email) {
    return jsonFieldError("email", "admin_email_invalid", 401);
  }
  const ok = await bcrypt.compare(parsed.data.password, hash);
  if (!ok) {
    return jsonFieldError("password", "admin_password_invalid", 401);
  }
  await createAdminSession({ email });
  return jsonSuccess({ ok: true });
}
