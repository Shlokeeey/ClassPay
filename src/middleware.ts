import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple shared-passcode gate — appropriate for a single-admin family app,
// not meant as enterprise security. Anyone with the cookie gets full access,
// same as before, just no longer to anyone who merely has the URL.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow the login page itself and its API, or nothing would ever load.
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/logout")
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("classpay_auth")?.value;
  const expected = process.env.APP_PASSCODE;

  if (!expected || cookie !== expected) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
