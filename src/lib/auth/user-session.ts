import { cookies } from "next/headers";
import { clearCookie, setCookie, signSession, verifySession } from "@/lib/auth/session";

const COOKIE_NAME = "nsuk_user_session";
const TTL_SECONDS = 60 * 60 * 24 * 7;

export type UserSession = {
  userId: string;
  mode: "personal" | "edu";
};

export async function createUserSession(session: UserSession) {
  const token = await signSession(session, TTL_SECONDS);
  setCookie(COOKIE_NAME, token, TTL_SECONDS);
}

export async function getUserSession(): Promise<UserSession | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = await verifySession(token);
    return { userId: payload.userId as string, mode: payload.mode as "personal" | "edu" };
  } catch {
    return null;
  }
}

export function clearUserSession() {
  clearCookie(COOKIE_NAME);
}
