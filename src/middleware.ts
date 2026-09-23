import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifyPlatformSessionToken, PLATFORM_SESSION_COOKIE_NAME } from "@/lib/platform-auth";

const PUBLIC_PATHS = ["/", "/login", "/register", "/choose-workspace", "/api/health", "/super-admin/login"];
// Customer-facing displays are intentionally public — see section 47:
// "independently launchable" on any TV/tablet without staff login.
const PUBLIC_PREFIXES = ["/display/", "/api/display/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Super-admin routes are checked against the separate platform session —
  // a tenant session cookie must never grant access here, and vice versa.
  if (pathname.startsWith("/super-admin")) {
    const platformToken = request.cookies.get(PLATFORM_SESSION_COOKIE_NAME)?.value;
    const platformSession = platformToken ? await verifyPlatformSessionToken(platformToken) : null;
    if (!platformSession) {
      return NextResponse.redirect(new URL("/super-admin/login", request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
