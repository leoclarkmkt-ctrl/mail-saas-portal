import { NextRequest, NextResponse } from "next/server";
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

  if (!parsed.success) {
    return jsonFieldError("email", "admin_email_invalid", 400);
  }

  let email: string;
  let hash: string;
  try {
    const env = getAdminEnv();
    email = safeTrimLower(env.ADMIN_EMAIL);
    hash = env.ADMIN_PASSWORD_HASH;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Admin not configured", 500);
  }

  const inputEmail = safeTrimLower(parsed.data.email);

  if (inputEmail !== email) {
    const debugInfo = {
      raw_input: body.email,
      raw_input_length: body.email?.length,
      parsed_input: parsed.data.email,
      parsed_input_length: parsed.data.email.length,
      normalized_input: inputEmail,
      normalized_input_length: inputEmail.length,
      raw_env: process.env.ADMIN_EMAIL,
      raw_env_length: process.env.ADMIN_EMAIL?.length,
      normalized_env: email,
      normalized_env_length: email.length,
      match: inputEmail === email,
      char_comparison: [] as Array<{
        index: number;
        input_char: string;
        input_code: number | "N/A";
        env_char: string;
        env_code: number | "N/A";
        match: boolean;
      }>
    };

    for (let i = 0; i < Math.max(inputEmail.length, email.length); i += 1) {
      debugInfo.char_comparison.push({
        index: i,
        input_char: inputEmail[i] ?? "undefined",
        input_code: Number.isNaN(inputEmail.charCodeAt(i)) ? "N/A" : inputEmail.charCodeAt(i),
        env_char: email[i] ?? "undefined",
        env_code: Number.isNaN(email.charCodeAt(i)) ? "N/A" : email.charCodeAt(i),
        match: inputEmail[i] === email[i]
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          field: "email",
          key: "admin_email_invalid",
          message: "Admin email mismatch"
        },
        debug: debugInfo
      },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(parsed.data.password, hash);
  if (!ok) {
    return jsonFieldError("password", "admin_password_invalid", 401);
  }
  await createAdminSession({ email });
  return jsonSuccess({ ok: true });
}
