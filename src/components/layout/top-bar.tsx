"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  User,
  Settings,
  LogOut,
} from "lucide-react"

// ---------- Breadcrumb helpers ----------

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  master: "Master",
  parties: "Parties",
  stores: "Stores",
  colors: "Colors",
  "yarn-types": "Yarn Types",
  "yarn-counts": "Yarn Counts",
  "style-numbers": "Style Numbers",
  "fabric-masters": "Fabric Masters",
  "gst-slabs": "GST Tax Slabs",
  concerns: "Concerns",
  yarn: "Yarn",
  "purchase-orders": "Purchase Orders",
  purchases: "Purchases",
  "process-outward": "Process Outward",
  "process-inward": "Process Inward",
  sales: "Sales",
  stock: "Stock",
  fabric: "Fabric",
  garment: "Garment",
  "price-list": "Price List",
  accessory: "Accessory",
  masters: "Masters",
  reports: "Reports",
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  return segments.map((seg, idx) => ({
    label: labelMap[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, idx + 1).join("/"),
    isLast: idx === segments.length - 1,
  }))
}

function getInitials(name?: string | null): string {
  if (!name) return "U"
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ---------- TopBar ----------

interface TopBarProps {
  onMobileMenuToggle: () => void
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      {/* Mobile menu trigger */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onMobileMenuToggle}
      >
        <Menu className="size-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Breadcrumbs */}
      <nav className="hidden items-center gap-1 text-sm md:flex">
        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.href}>
            {crumb.href !== breadcrumbs[0]?.href && (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            )}
            {crumb.isLast ? (
              <span className="font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Mobile: page title */}
      <span className="text-sm font-medium md:hidden">
        {breadcrumbs[breadcrumbs.length - 1]?.label ?? "Dashboard"}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden w-64 lg:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="h-8 pl-8 pr-12 text-sm"
          readOnly
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon-sm" className="relative">
        <Bell className="size-4" />
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          3
        </span>
        <span className="sr-only">Notifications</span>
      </Button>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-muted focus:outline-none"
            />
          }
        >
          <Avatar size="sm">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback>
              {getInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium lg:inline">
            {session?.user?.name ?? "User"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link href="/profile" />}
          >
            <User className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href="/settings" />}
          >
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
