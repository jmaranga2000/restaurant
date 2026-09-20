import "server-only";
import { SignJWT, jwtVerify } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set. Copy .env.example to .env.local and fill it in.");
}
// Distinct derived key (different subject string) from the tenant session
// key in src/lib/auth.ts, so a token signed for one can never verify
// against the other even though they share the same root secret.
const platformSecretKey = new TextEncoder().encode(`platform:${AUTH_SECRET}`);

const PLATFORM_SESSION_TTL_SECONDS = 60 * 60 * 8; // shorter-lived than tenant sessions
export const PLATFORM_SESSION_COOKIE_NAME = "restaurant_os_platform_session";

export interface PlatformSessionPayload {
  platformAdminId: string;
  [key: string]: unknown;
}

export async function createPlatformSessionToken(payload: PlatformSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PLATFORM_SESSION_TTL_SECONDS}s`)
    .sign(platformSecretKey);
}

export async function verifyPlatformSessionToken(token: string): Promise<PlatformSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, platformSecretKey);
    if (typeof payload.platformAdminId !== "string") return null;
    return payload as PlatformSessionPayload;
  } catch {
    return null;
  }
}

export const PLATFORM_SESSION_MAX_AGE_SECONDS = PLATFORM_SESSION_TTL_SECONDS;
