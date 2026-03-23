import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/api-auth"
import { PERMISSION_KEYS } from "@/lib/permissions"

// GET /api/users — List all users with their permissions
export async function GET() {
  const check = await requirePermission("canManageUsers")
  if (check) return check

  const users = await db.user.findMany({
    include: { permissions: true },
    orderBy: { createdAt: "desc" },
  })

  // Strip password hashes
  const safeUsers = users.map(({ passwordHash, ...user }) => user)

  return NextResponse.json(safeUsers)
}

// POST /api/users — Create a new user with permissions
export async function POST(req: NextRequest) {
  const check = await requirePermission("canManageUsers")
  if (check) return check

  try {
    const body = await req.json()
    const { username, fullName, email, password, role, permissions } = body

    if (!username || !fullName || !password) {
      return NextResponse.json(
        { error: "Username, full name, and password are required" },
        { status: 400 }
      )
    }

    // Check for existing username
    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    // Check for existing email if provided
    if (email) {
      const existingEmail = await db.user.findUnique({ where: { email } })
      if (existingEmail) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        )
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        username,
        fullName,
        email: email || null,
        passwordHash,
        role: role || "DATA_ENTRY",
        permissions: {
          create: buildPermissionsData(permissions),
        },
      },
      include: { permissions: true },
    })

    const { passwordHash: _, ...safeUser } = user
    return NextResponse.json(safeUser, { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    )
  }
}

function buildPermissionsData(
  permissions?: Record<string, boolean>
): Record<string, boolean> {
  const data: Record<string, boolean> = {}
  for (const key of PERMISSION_KEYS) {
    data[key] = permissions?.[key] === true
  }
  return data
}
