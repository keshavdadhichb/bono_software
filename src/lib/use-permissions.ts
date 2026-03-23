"use client"

import { useSession } from "next-auth/react"
import type { Permissions } from "./permissions"

const NO_PERMISSIONS: Permissions = {
  canViewYarn: false,
  canViewFabric: false,
  canViewGarment: false,
  canViewAccessory: false,
  canViewMaster: false,
  canViewReports: false,
  canEditYarn: false,
  canEditFabric: false,
  canEditGarment: false,
  canEditAccessory: false,
  canEditMaster: false,
  canDeleteYarn: false,
  canDeleteFabric: false,
  canDeleteGarment: false,
  canDeleteAccessory: false,
  canDeleteMaster: false,
  canExport: false,
  canPrint: false,
  canManageUsers: false,
  canUseAI: false,
}

export function usePermissions(): Permissions {
  const { data: session } = useSession()
  return (session?.user as any)?.permissions ?? NO_PERMISSIONS
}

export function useHasPermission(permission: keyof Permissions): boolean {
  const permissions = usePermissions()
  return permissions[permission] === true
}
