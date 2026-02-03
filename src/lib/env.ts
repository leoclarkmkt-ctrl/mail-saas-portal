const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
] as const;

const REQUIRED_SERVER = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_BASE_URL",
  "SESSION_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD_HASH"
] as const;

const REQUIRED_MAILCOW = [
  "MAILCOW_API_BASE_URL",
  "MAILCOW_API_KEY"
] as const;

function getMissing(keys: readonly string[]) {
  return keys.filter((key) => !process.env[key]);
}

export function getPublicEnv() {
  const missing = getMissing(REQUIRED_PUBLIC);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  };
}

export function getServerEnv() {
  const missing = getMissing([...REQUIRED_PUBLIC, ...REQUIRED_SERVER]);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  return {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    APP_BASE_URL: process.env.APP_BASE_URL as string,
    SESSION_SECRET: process.env.SESSION_SECRET as string,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL as string,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH as string,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  };
}

export function getEnvStatus() {
  const missing = getMissing([...REQUIRED_PUBLIC, ...REQUIRED_SERVER]);
  return {
    ok: missing.length === 0,
    missing
  };
}

export function getMailcowEnv() {
  const missing = getMissing(REQUIRED_MAILCOW);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  return {
    MAILCOW_API_BASE_URL: process.env.MAILCOW_API_BASE_URL as string,
    MAILCOW_API_KEY: process.env.MAILCOW_API_KEY as string
  };
}

export function getMailcowEnvStatus() {
  const missing = getMissing(REQUIRED_MAILCOW);
  return {
    ok: missing.length === 0,
    missing
  };
}
