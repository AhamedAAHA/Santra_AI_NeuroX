import { type NextRequest, NextResponse } from "next/server";
import { parseLocalSessionCookie, LOCAL_SESSION_COOKIE } from "@/lib/local-auth/session-cookie";

const workspacePrefixes = ["/dashboard", "/chat", "/alerts", "/reports", "/analyst", "/settings", "/workspace"];
const protectedPrefixes = [...workspacePrefixes, "/onboarding"];
const authPaths = ["/sign-in", "/sign-up"];

function isAuthPath(pathname: string) {
  return authPaths.some((path) => pathname === path);
}

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function hasLocalSession(request: NextRequest) {
  return Boolean(parseLocalSessionCookie(request.cookies.get(LOCAL_SESSION_COOKIE)?.value));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = hasLocalSession(request);

  if (isProtectedPath(pathname) && !signedIn) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath(pathname) && signedIn) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/chat",
    "/chat/:path*",
    "/alerts",
    "/alerts/:path*",
    "/reports",
    "/reports/:path*",
    "/analyst",
    "/analyst/:path*",
    "/settings",
    "/settings/:path*",
    "/workspace",
    "/workspace/:path*",
    "/onboarding",
    "/sign-in",
    "/sign-up",
  ],
};
