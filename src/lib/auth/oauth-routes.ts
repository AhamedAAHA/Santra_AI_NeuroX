import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

export function oauthFailureRedirect(origin: string, next: string, reason: string) {
  const target = new URL("/sign-in", origin);
  target.searchParams.set("error", reason);
  if (next !== "/dashboard") target.searchParams.set("next", next);
  return NextResponse.redirect(target);
}

export function oauthSuccessRedirect(origin: string, next: string) {
  return NextResponse.redirect(`${origin}${safeRedirectPath(next)}`);
}

export function readOAuthNext(request: Request) {
  const { searchParams } = new URL(request.url);
  return safeRedirectPath(searchParams.get("next"));
}
