import { clearUserSession } from "@/lib/auth/user-session";
import { jsonSuccess } from "@/lib/utils/api";

export async function POST() {
  clearUserSession();
  return jsonSuccess({ ok: true });
}
