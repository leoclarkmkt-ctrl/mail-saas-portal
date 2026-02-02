import { clearAdminSession } from "@/lib/auth/admin-session";
import { jsonSuccess } from "@/lib/utils/api";

export async function POST() {
  clearAdminSession();
  return jsonSuccess({ ok: true });
}
