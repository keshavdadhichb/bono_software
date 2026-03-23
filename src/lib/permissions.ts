import { db } from "./db"

export interface Permissions {
  canViewYarn: boolean
  canViewFabric: boolean
  canViewGarment: boolean
  canViewAccessory: boolean
  canViewMaster: boolean
  canViewReports: boolean
  canEditYarn: boolean
  canEditFabric: boolean
  canEditGarment: boolean
  canEditAccessory: boolean
  canEditMaster: boolean
  canDeleteYarn: boolean
  canDeleteFabric: boolean
  canDeleteGarment: boolean
  canDeleteAccessory: boolean
  canDeleteMaster: boolean
  canExport: boolean
  canPrint: boolean
  canManageUsers: boolean
  canUseAI: boolean
}

export const PERMISSION_KEYS: (keyof Permissions)[] = [
  "canViewYarn",
  "canViewFabric",
  "canViewGarment",
  "canViewAccessory",
  "canViewMaster",
  "canViewReports",
  "canEditYarn",
  "canEditFabric",
  "canEditGarment",
  "canEditAccessory",
  "canEditMaster",
  "canDeleteYarn",
  "canDeleteFabric",
  "canDeleteGarment",
  "canDeleteAccessory",
  "canDeleteMaster",
  "canExport",
  "canPrint",
  "canManageUsers",
  "canUseAI",
]

export const FULL_ACCESS: Permissions = Object.fromEntries(
  PERMISSION_KEYS.map((k) => [k, true])
) as Permissions

export const NO_ACCESS: Permissions = Object.fromEntries(
  PERMISSION_KEYS.map((k) => [k, false])
) as Permissions

export async function getUserPermissions(
  userId: string
): Promise<Permissions> {
  // Check user role first — admins always get full access
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user) return NO_ACCESS
  if (user.role === "ADMIN") return FULL_ACCESS

  const perms = await db.userPermission.findUnique({
    where: { userId },
  })

  if (!perms) return NO_ACCESS

  const result: Record<string, boolean> = {}
  for (const key of PERMISSION_KEYS) {
    result[key] = (perms as Record<string, unknown>)[key] === true
  }
  return result as Permissions
}

export async function checkPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user) return false
  if (user.role === "ADMIN") return true

  const perms = await db.userPermission.findUnique({
    where: { userId },
  })

  if (!perms) return false
  return (perms as Record<string, unknown>)[permission] === true
}
