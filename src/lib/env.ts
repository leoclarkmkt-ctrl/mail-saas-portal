const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
] as const;

const REQUIRED_SUPABASE_SERVICE = [
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

const REQUIRED_SESSION = [
  "SESSION_SECRET"
] as const;

const REQUIRED_APP_BASE = [
  "APP_BASE_URL"
] as const;

const REQUIRED_ADMIN = [
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD_HASH"
] as const;

const REQUIRED_RATE_LIMIT = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN"
] as const;

const REQUIRED_SERVER = [
  ...REQUIRED_SUPABASE_SERVICE,
  ...REQUIRED_SESSION,
  ...REQUIRED_ADMIN,
  ...REQUIRED_RATE_LIMIT
];

const REQUIRED_CRON = [
  "CRON_SECRET"
] as const;

const REQUIRED_MAILCOW = [
  "MAILCOW_API_BASE_URL",
  "MAILCOW_API_KEY"
] as const;

const REQUIRED_APP = [
  ...REQUIRED_PUBLIC,
  ...REQUIRED_SUPABASE_SERVICE,
  ...REQUIRED_SESSION,
  ...REQUIRED_APP_BASE
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

export function getSupabaseServiceEnv() {
  const missing = getMissing([...REQUIRED_PUBLIC, ...REQUIRED_SUPABASE_SERVICE]);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  return {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string
  };
}

export function getSessionEnv() {
  const missing = getMissing(REQUIRED_SESSION);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  return {
    SESSION_SECRET: process.env.SESSION_SECRET as string
  };
}

export function getAppBaseUrl() {
  const missing = getMissing(REQUIRED_APP_BASE);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  return {
    APP_BASE_URL: process.env.APP_BASE_URL as string
  };
}

export function getAdminEnv() {
  const missing = getMissing(REQUIRED_ADMIN);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  return {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL as string,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH as string
  };
}

export function getEnvStatus() {
  const missing = getMissing(REQUIRED_APP);
  return {
    ok: missing.length === 0,
    missing
  };
}

export function getRateLimitEnv() {
  const missing = getMissing(REQUIRED_RATE_LIMIT);
  if (missing.length > 0) {
    return null;
  }
  return {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL as string,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN as string
  };
}

export function getMailcowEnv() {
  const missing = getMissing(REQUIRED_MAILCOW);
  if (missing.length > 0) {
    return null;
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

export function getCronEnv() {
  const missing = getMissing(REQUIRED_CRON);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  return {
    CRON_SECRET: process.env.CRON_SECRET as string
  };
}
