import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  const publicPaths = ["/login", "/api/auth", "/api/users/seed", "/_next", "/favicon.ico"]
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check JWT token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

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
    "/api/reports/:path*",
    "/api/ai/:path*",
  ],
}
