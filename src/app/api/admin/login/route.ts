import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { adminLoginSchema } from "@/lib/validation/schemas";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { createAdminSession } from "@/lib/auth/admin-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
  }
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !hash) {
    return jsonError("Admin not configured", 500);
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
