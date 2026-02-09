import { cookies } from "next/headers";
import { clearCookie, setCookie, signSession, verifySession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

export async function requireUserSession(): Promise<UserSession | null> {
  const session = await getUserSession();
  if (!session) return null;
  await touchUserPresence(session.userId);
  return session;
}

async function touchUserPresence(userId: string) {
  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("user_presence").upsert(
      {
        user_id: userId,
        last_seen_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );
  } catch {
    // Best-effort touch only.
  }
}

export function clearUserSession() {
  clearCookie(COOKIE_NAME);
}
