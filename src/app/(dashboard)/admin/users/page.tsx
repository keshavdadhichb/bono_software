"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Shield,
  Search,
  UserCog,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePermissions } from "@/lib/use-permissions"
import type { Permissions } from "@/lib/permissions"

// --------------- Types ---------------

interface UserData {
  id: string
  username: string
  fullName: string
  email: string | null
  role: string
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  permissions: Permissions | null
}

interface UserFormData {
  username: string
  fullName: string
  email: string
  password: string
  role: string
  permissions: Permissions
}

// --------------- Permission groups config ---------------

const PERMISSION_GROUPS = [
  {
    label: "Yarn",
    permissions: [
      { key: "canViewYarn" as const, label: "View" },
      { key: "canEditYarn" as const, label: "Create / Edit" },
      { key: "canDeleteYarn" as const, label: "Delete" },
    ],
  },
  {
    label: "Fabric",
    permissions: [
      { key: "canViewFabric" as const, label: "View" },
      { key: "canEditFabric" as const, label: "Create / Edit" },
      { key: "canDeleteFabric" as const, label: "Delete" },
    ],
  },
  {
    label: "Garment",
    permissions: [
      { key: "canViewGarment" as const, label: "View" },
      { key: "canEditGarment" as const, label: "Create / Edit" },
      { key: "canDeleteGarment" as const, label: "Delete" },
    ],
  },
  {
    label: "Accessory",
    permissions: [
      { key: "canViewAccessory" as const, label: "View" },
      { key: "canEditAccessory" as const, label: "Create / Edit" },
      { key: "canDeleteAccessory" as const, label: "Delete" },
    ],
  },
  {
    label: "Master Data",
    permissions: [
      { key: "canViewMaster" as const, label: "View" },
      { key: "canEditMaster" as const, label: "Create / Edit" },
      { key: "canDeleteMaster" as const, label: "Delete" },
    ],
  },
  {
    label: "Reports",
    permissions: [{ key: "canViewReports" as const, label: "View" }],
  },
  {
    label: "Special",
    permissions: [
      { key: "canExport" as const, label: "Export" },
      { key: "canPrint" as const, label: "Print" },
      { key: "canManageUsers" as const, label: "Manage Users" },
      { key: "canUseAI" as const, label: "Use AI" },
    ],
  },
]

const ALL_PERM_KEYS = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
)

const EMPTY_PERMISSIONS: Permissions = {
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

const FULL_PERMISSIONS: Permissions = Object.fromEntries(
  ALL_PERM_KEYS.map((k) => [k, true])
) as Permissions

const ROLES = ["ADMIN", "MANAGER", "DATA_ENTRY", "VIEWER"] as const

function roleBadgeVariant(role: string) {
  switch (role) {
    case "ADMIN":
      return "default" as const
    case "MANAGER":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

function formatDate(d: string | null) {
  if (!d) return "Never"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// --------------- Main Page ---------------

export default function UsersPage() {
  const { data: session } = useSession()
  const permissions = usePermissions()
  const [users, setUsers] = React.useState<UserData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">(
    "create"
  )
  const [editingUser, setEditingUser] = React.useState<UserData | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingUser, setDeletingUser] = React.useState<UserData | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  // Form state
  const [form, setForm] = React.useState<UserFormData>({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "DATA_ENTRY",
    permissions: { ...EMPTY_PERMISSIONS },
  })

  // --------------- Data fetching ---------------

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      setUsers(data)
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // --------------- Permission check ---------------

  if (!permissions.canManageUsers) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Shield className="size-12 text-muted-foreground" />
            <p className="text-[13px] text-muted-foreground text-center">
              You do not have permission to manage users.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --------------- Handlers ---------------

  const openCreateDialog = () => {
    setDialogMode("create")
    setEditingUser(null)
    setForm({
      username: "",
      fullName: "",
      email: "",
      password: "",
      role: "DATA_ENTRY",
      permissions: { ...EMPTY_PERMISSIONS },
    })
    setDialogOpen(true)
  }

  const openEditDialog = (user: UserData) => {
    setDialogMode("edit")
    setEditingUser(user)
    setForm({
      username: user.username,
      fullName: user.fullName,
      email: user.email ?? "",
      password: "",
      role: user.role,
      permissions: user.permissions
        ? { ...user.permissions }
        : { ...EMPTY_PERMISSIONS },
    })
    setDialogOpen(true)
  }

  const openDeleteDialog = (user: UserData) => {
    setDeletingUser(user)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.username.trim() || !form.fullName.trim()) {
      toast.error("Username and full name are required")
      return
    }
    if (dialogMode === "create" && !form.password) {
      toast.error("Password is required for new users")
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        username: form.username,
        fullName: form.fullName,
        email: form.email || undefined,
        role: form.role,
        permissions: form.permissions,
      }
      if (form.password) body.password = form.password

      const url =
        dialogMode === "create"
          ? "/api/users"
          : `/api/users/${editingUser!.id}`
      const method = dialogMode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save user")
      }

      toast.success(
        dialogMode === "create"
          ? "User created successfully"
          : "User updated successfully"
      )
      setDialogOpen(false)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete user")
      }
      toast.success("User deleted successfully")
      setDeleteDialogOpen(false)
      setDeletingUser(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (user: UserData) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(
        user.isActive ? "User deactivated" : "User activated"
      )
      fetchUsers()
    } catch {
      toast.error("Failed to update user status")
    }
  }

  const togglePermission = (key: keyof Permissions) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }))
  }

  const allChecked = ALL_PERM_KEYS.every((k) => form.permissions[k])

  const toggleAll = () => {
    setForm((prev) => ({
      ...prev,
      permissions: allChecked
        ? { ...EMPTY_PERMISSIONS }
        : { ...FULL_PERMISSIONS },
    }))
  }

  const handleRoleChange = (role: string) => {
    setForm((prev) => ({
      ...prev,
      role,
      permissions:
        role === "ADMIN" ? { ...FULL_PERMISSIONS } : prev.permissions,
    }))
  }

  // Filter
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  )

  // --------------- Render ---------------

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <UserCog className="size-5 text-primary" />
            User Management
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="size-4 mr-1" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] font-medium flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            {filteredUsers.length} User{filteredUsers.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="size-10 mb-3 opacity-40" />
              <p className="text-[13px]">
                {search ? "No users match your search" : "No users found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    Username
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    Full Name
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    Role
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium hidden md:table-cell">
                    Last Login
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-[13px] font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      <div>
                        <p>{user.fullName}</p>
                        {user.email && (
                          <p className="text-[11px] text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => handleToggleActive(user)}
                          size="sm"
                        />
                        <span
                          className={`text-[11px] font-medium ${
                            user.isActive
                              ? "text-emerald-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground hidden md:table-cell">
                      {formatDate(user.lastLogin)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openDeleteDialog(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Add User" : "Edit User"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Create a new user account with specific permissions."
                : `Editing ${editingUser?.fullName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Username</Label>
                <Input
                  value={form.username}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="e.g. john_doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Full Name</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">
                  {dialogMode === "create"
                    ? "Password"
                    : "New Password (leave blank to keep current)"}
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder={
                    dialogMode === "create" ? "Enter password" : "Leave blank to keep"
                  }
                />
              </div>
            </div>

            {/* Role selector */}
            <div className="space-y-1.5">
              <Label className="text-[13px]">Role</Label>
              <Select value={form.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.role === "ADMIN" && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Admin users always have full access regardless of permission
                  settings.
                </p>
              )}
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-medium">Permissions</Label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-[12px] text-muted-foreground">
                    Select All
                  </span>
                </label>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border">
                {PERMISSION_GROUPS.map((group) => (
                  <div
                    key={group.label}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3"
                  >
                    <span className="text-[12px] font-medium text-foreground min-w-[100px]">
                      {group.label}
                    </span>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.key}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <Checkbox
                            checked={form.permissions[perm.key]}
                            onCheckedChange={() => togglePermission(perm.key)}
                            disabled={form.role === "ADMIN"}
                          />
                          <span className="text-[12px] text-muted-foreground">
                            {perm.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-1 animate-spin" />}
              {dialogMode === "create" ? "Create User" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingUser?.fullName}</strong> ({deletingUser?.username}
              )? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="size-4 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
