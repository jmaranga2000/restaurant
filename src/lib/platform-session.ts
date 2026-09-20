import "server-only";
import { cookies } from "next/headers";
import {
  PLATFORM_SESSION_COOKIE_NAME,
  PLATFORM_SESSION_MAX_AGE_SECONDS,
  createPlatformSessionToken,
  verifyPlatformSessionToken,
  type PlatformSessionPayload,
} from "@/lib/platform-auth";
import { AuthenticationError } from "@/lib/errors";

export async function setPlatformSessionCookie(payload: PlatformSessionPayload): Promise<void> {
  const token = await createPlatformSessionToken(payload);
  cookies().set(PLATFORM_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PLATFORM_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearPlatformSessionCookie(): void {
  cookies().delete(PLATFORM_SESSION_COOKIE_NAME);
}

export async function getPlatformSession(): Promise<PlatformSessionPayload | null> {
  const token = cookies().get(PLATFORM_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyPlatformSessionToken(token);
}

export async function requirePlatformSession(): Promise<PlatformSessionPayload> {
  const session = await getPlatformSession();
  if (!session) throw new AuthenticationError();
  return session;
}
