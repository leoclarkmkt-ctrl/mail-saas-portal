import { clearUserSession } from "@/lib/auth/user-session";
import { clearAdminSession } from "@/lib/auth/admin-session";
import { jsonSuccess } from "@/lib/utils/api";

export async function POST() {
  clearUserSession();
  clearAdminSession();
  return jsonSuccess({ ok: true });
}
