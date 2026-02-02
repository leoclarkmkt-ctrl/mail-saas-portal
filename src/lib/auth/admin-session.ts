import { cookies } from "next/headers";
import { clearCookie, setCookie, signSession, verifySession } from "@/lib/auth/session";

const COOKIE_NAME = "nsuk_admin_session";
const TTL_SECONDS = 60 * 60 * 6;

export type AdminSession = {
  email: string;
};

export async function createAdminSession(session: AdminSession) {
  const token = await signSession(session, TTL_SECONDS);
  setCookie(COOKIE_NAME, token, TTL_SECONDS);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = await verifySession(token);
    return { email: payload.email as string };
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  clearCookie(COOKIE_NAME);
}
