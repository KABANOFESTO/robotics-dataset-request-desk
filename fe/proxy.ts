import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Presence-only navigation guard; API authorization remains enforced by Django. */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("dataset_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/requests/:path*", "/admin/:path*"],
};
