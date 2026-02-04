import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getRateLimitEnv } from "@/lib/env";

type RateLimitConfig = {
  requests: number;
  windowSeconds: number;
};

type RateLimitEnv = {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
};

type RateLimitResult = {
  retryAfterSeconds: number;
  limit: number;
  remaining: number;
  resetMs: number;
};

let redisClient: Redis | null = null;
const limiterCache = new Map<string, Ratelimit>();

const getRedis = (env: RateLimitEnv) => {
  if (redisClient) return redisClient;
  redisClient = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN
  });
  return redisClient;
};

const getLimiter = (keyPrefix: string, config: RateLimitConfig, env: RateLimitEnv) => {
  const cacheKey = `${keyPrefix}:${config.requests}:${config.windowSeconds}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;
  const limiter = new Ratelimit({
    redis: getRedis(env),
    limiter: Ratelimit.fixedWindow(config.requests, `${config.windowSeconds} s`),
    analytics: true,
    prefix: `ratelimit:${keyPrefix}`
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
};

const extractClientIp = (request: NextRequest) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  return request.ip ?? "unknown";
};

const buildRateLimitResult = (result: Awaited<ReturnType<Ratelimit["limit"]>>): RateLimitResult => {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return {
    retryAfterSeconds,
    limit: result.limit,
    remaining: result.remaining,
    resetMs: result.reset
  };
};

export async function enforceRateLimit(
  request: NextRequest,
  keyPrefix: string,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  try {
    const env = getRateLimitEnv();
    if (!env) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Rate limit disabled: missing UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN.");
      }
      return null;
    }
    const ip = extractClientIp(request);
    const limiter = getLimiter(keyPrefix, config, env);
    const result = await limiter.limit(`${keyPrefix}:${ip}`);
    if (result.success) return null;

    const rateLimit = buildRateLimitResult(result);
    return NextResponse.json(
      {
        ok: false,
        error: "Too many requests",
        retry_after: rateLimit.retryAfterSeconds
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetMs)
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rate limit unavailable";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
