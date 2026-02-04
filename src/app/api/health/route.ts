import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { envStatus } from "@/lib/env";

export const runtime = "nodejs";

const REQUIRED_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "APP_BASE_URL",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD_HASH",
  "MAILCOW_API_BASE_URL",
  "MAILCOW_API_KEY",
  "CRON_SECRET"
] as const;

const OPTIONAL_ENV_KEYS = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN"
] as const;

const ALL_ENV_KEYS = [...REQUIRED_ENV_KEYS, ...OPTIONAL_ENV_KEYS] as const;

type EnvKey = (typeof ALL_ENV_KEYS)[number];
type EnvState = ReturnType<typeof envStatus>;

export async function GET() {
  const env = Object.fromEntries(
    ALL_ENV_KEYS.map((name) => [name, envStatus(name)])
  ) as Record<EnvKey, EnvState>;
  const requiredMissing = REQUIRED_ENV_KEYS.filter((name) => env[name] === "missing");
  const optionalMissing = OPTIONAL_ENV_KEYS.filter((name) => env[name] === "missing");
  const supabaseConfigured =
    env.NEXT_PUBLIC_SUPABASE_URL === "present" &&
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "present" &&
    env.SUPABASE_SERVICE_ROLE_KEY === "present";
  const mailcowConfigured =
    env.MAILCOW_API_BASE_URL === "present" && env.MAILCOW_API_KEY === "present";
  const upstashConfigured =
    env.UPSTASH_REDIS_REST_URL === "present" &&
    env.UPSTASH_REDIS_REST_TOKEN === "present";

  const responseHeaders = { "Cache-Control": "no-store" };

  let authOk = false;
  let dbOk = false;
  if (supabaseConfigured) {
    const supabase = createServerSupabaseClient();
    try {
      const randomId = crypto.randomUUID();
      const authResult = await supabase.auth.admin.getUserById(randomId);
      authOk = !authResult.error;
    } catch {
      authOk = false;
    }

    try {
      const profilesQuery = await supabase.from("profiles").select("id").limit(1);
      const codesQuery = await supabase.from("activation_codes").select("code").limit(1);
      dbOk = !(profilesQuery.error || codesQuery.error);
    } catch {
      dbOk = false;
    }
  }

  const ok = requiredMissing.length === 0 && authOk && dbOk;
  return NextResponse.json(
    {
      ok,
      env,
      requiredMissing,
      optionalMissing,
      missing_env: requiredMissing,
      checks: {
        supabase: {
          ok: authOk,
          dbOk
        },
        mailcow: {
          configured: mailcowConfigured
        },
        upstash: {
          configured: upstashConfigured
        }
      },
      supabase: {
        ok: authOk,
        dbOk
      },
      time: new Date().toISOString()
    },
    { headers: responseHeaders }
  );
}
