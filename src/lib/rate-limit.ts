import { createHash } from "crypto";
import { Redis } from "@upstash/redis";

const AUTH_ATTEMPT_LIMIT = 3;
const AUTH_WINDOW_SECONDS = 15 * 60;

type AuthRateLimitScope = "restaurant-login" | "organization-registration" | "platform-login";
type HeaderSource = Pick<Headers, "get">;

type RateLimitEntry = {
  attempts: number;
  resetAt: number;
};

export type AuthRateLimitResult = {
  allowed: boolean;
  key: string;
  retryAfterSeconds: number;
  remainingAttempts: number;
};

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

function getLocalRateLimitStore() {
  const globalStore = globalThis as typeof globalThis & {
    restaurantOsAuthRateLimits?: Map<string, RateLimitEntry>;
  };

  globalStore.restaurantOsAuthRateLimits ??= new Map<string, RateLimitEntry>();
  return globalStore.restaurantOsAuthRateLimits;
}

function getClientIdentifier(requestHeaders: HeaderSource) {
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || requestHeaders.get("x-real-ip") || requestHeaders.get("cf-connecting-ip") || "unknown-client";
}

function createKey(scope: AuthRateLimitScope, requestHeaders: HeaderSource, email?: string) {
  const identifier = `${getClientIdentifier(requestHeaders)}:${email?.trim().toLowerCase() ?? "new-account"}`;
  const fingerprint = createHash("sha256").update(identifier).digest("hex");
  return `restaurant-os:auth:${scope}:${fingerprint}`;
}

export async function consumeAuthRateLimit({
  scope,
  requestHeaders,
  email,
}: {
  scope: AuthRateLimitScope;
  requestHeaders: HeaderSource;
  email?: string;
}): Promise<AuthRateLimitResult> {
  const key = createKey(scope, requestHeaders, email);

  if (redis) {
    const attempts = await redis.incr(key);
    if (attempts === 1) await redis.expire(key, AUTH_WINDOW_SECONDS);

    const retryAfterSeconds = attempts > AUTH_ATTEMPT_LIMIT
      ? Math.max(1, await redis.ttl(key))
      : 0;

    return {
      allowed: attempts <= AUTH_ATTEMPT_LIMIT,
      key,
      retryAfterSeconds,
      remainingAttempts: Math.max(0, AUTH_ATTEMPT_LIMIT - attempts),
    };
  }

  const store = getLocalRateLimitStore();
  const now = Date.now();
  const existing = store.get(key);
  const entry = !existing || existing.resetAt <= now
    ? { attempts: 1, resetAt: now + AUTH_WINDOW_SECONDS * 1000 }
    : { ...existing, attempts: existing.attempts + 1 };

  store.set(key, entry);
  return {
    allowed: entry.attempts <= AUTH_ATTEMPT_LIMIT,
    key,
    retryAfterSeconds: entry.attempts > AUTH_ATTEMPT_LIMIT ? Math.ceil((entry.resetAt - now) / 1000) : 0,
    remainingAttempts: Math.max(0, AUTH_ATTEMPT_LIMIT - entry.attempts),
  };
}

export async function resetAuthRateLimit(key: string): Promise<void> {
  if (redis) {
    await redis.del(key);
    return;
  }

  getLocalRateLimitStore().delete(key);
}

export function rateLimitMessage(retryAfterSeconds: number) {
  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Please try again in ${retryAfterMinutes} minute${retryAfterMinutes === 1 ? "" : "s"}.`;
}
