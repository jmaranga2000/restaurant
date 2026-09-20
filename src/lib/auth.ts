import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set. Copy .env.example to .env.local and fill it in.");
}
const secretKey = new TextEncoder().encode(AUTH_SECRET);

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h — a POS/kitchen shift, not a long-lived token

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * What we trust from the token: WHO the user is and which org/branch they're
 * currently scoped to. We deliberately do NOT embed permissions or role
 * names here — those are re-read from the database on every authorization
 * check (see permissions/authorize.ts) so a revoked role takes effect
 * immediately instead of waiting for token expiry.
 */
export interface SessionPayload {
  userId: string;
  organizationId: string;
  activeBranchId: string | null;
  [key: string]: unknown;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.userId !== "string" || typeof payload.organizationId !== "string") {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "restaurant_os_session";
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_SECONDS;
