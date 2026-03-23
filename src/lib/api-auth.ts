import { NextResponse } from "next/server"
import { auth } from "./auth"
import { checkPermission } from "./permissions"

/**
 * Returns null if authorized, or a NextResponse (401/403) if not.
 *
 * Usage in API routes:
 *   const check = await requirePermission("canEditYarn")
 *   if (check) return check
 */
export async function requirePermission(
  permission: string
): Promise<NextResponse | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }

  const hasPermission = await checkPermission(session.user.id, permission)

  if (!hasPermission) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    )
  }

  return null
}

/**
 * Returns the session or a 401 response.
 * Use when you only need authentication, not a specific permission.
 */
export async function requireAuth() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}
