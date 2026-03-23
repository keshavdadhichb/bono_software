import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicPaths = [
  "/login",
  "/api/auth",
  "/api/users/seed",
  "/_next",
  "/favicon.ico",
]

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/master/:path*",
    "/yarn/:path*",
    "/fabric/:path*",
    "/garment/:path*",
    "/accessory/:path*",
    "/reports/:path*",
    "/admin/:path*",
    "/api/users/:path*",
    "/api/yarn/:path*",
    "/api/fabric/:path*",
    "/api/garment/:path*",
    "/api/accessory/:path*",
    "/api/master/:path*",
    "/api/reports/:path*",
  ],
}
