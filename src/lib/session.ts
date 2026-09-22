import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  ORGANIZATION_ACCESS_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createOrganizationAccessToken,
  createSessionToken,
  verifyOrganizationAccessToken,
  verifySessionToken,
  type OrganizationAccessPayload,
  type SessionPayload,
} from "@/lib/auth";
import { AuthenticationError } from "@/lib/errors";

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE_NAME);
}

/** The owner opens the restaurant once; staff logins may change during that shift. */
export async function setOrganizationAccessCookie(organizationId: string): Promise<void> {
  const token = await createOrganizationAccessToken(organizationId);
  cookies().set(ORGANIZATION_ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearOrganizationAccessCookie(): void {
  cookies().delete(ORGANIZATION_ACCESS_COOKIE_NAME);
}

export async function getOrganizationAccess(): Promise<OrganizationAccessPayload | null> {
  const token = cookies().get(ORGANIZATION_ACCESS_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyOrganizationAccessToken(token);
}

export async function requireOrganizationAccess(): Promise<OrganizationAccessPayload> {
  const access = await getOrganizationAccess();
  if (!access) throw new AuthenticationError("The restaurant needs to be opened by its owner first.");
  return access;
}

/** Returns the session, or null if the visitor is unauthenticated. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Same as getSession(), but throws for code paths that require a user. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthenticationError();
  return session;
}
