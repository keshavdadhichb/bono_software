import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/api-auth"
import { PERMISSION_KEYS } from "@/lib/permissions"

// GET /api/users/[id] — Get a single user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requirePermission("canManageUsers")
  if (check) return check

  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    include: { permissions: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { passwordHash, ...safeUser } = user
  return NextResponse.json(safeUser)
}

// PUT /api/users/[id] — Update user and permissions
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requirePermission("canManageUsers")
  if (check) return check

  const { id } = await params

  try {
    const body = await req.json()
    const { username, fullName, email, password, role, isActive, permissions } =
      body

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check for username conflict
    if (username && username !== existing.username) {
      const conflict = await db.user.findUnique({ where: { username } })
      if (conflict) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        )
      }
    }

    // Check for email conflict
    if (email && email !== existing.email) {
      const conflict = await db.user.findUnique({ where: { email } })
      if (conflict) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (username !== undefined) updateData.username = username
    if (fullName !== undefined) updateData.fullName = fullName
    if (email !== undefined) updateData.email = email || null
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: { permissions: true },
    })

    // Update permissions if provided
    if (permissions) {
      const permData: Record<string, boolean> = {}
      for (const key of PERMISSION_KEYS) {
        permData[key] = permissions[key] === true
      }

      await db.userPermission.upsert({
        where: { userId: id },
        create: { userId: id, ...permData },
        update: permData,
      })
    }

    // Re-fetch with updated permissions
    const updated = await db.user.findUnique({
      where: { id },
      include: { permissions: true },
    })

    const { passwordHash, ...safeUser } = updated!
    return NextResponse.json(safeUser)
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] — Delete a user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requirePermission("canManageUsers")
  if (check) return check

  const { id } = await params

  const existing = await db.user.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  await db.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
