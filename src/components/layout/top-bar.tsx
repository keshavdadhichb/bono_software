"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
  ChevronRight,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useTheme } from "@/lib/theme-provider"
import { SpotlightTrigger } from "@/components/search/spotlight"

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
  const { theme, toggleTheme } = useTheme()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-white px-4">
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
      <nav className="hidden items-center gap-1 text-[13px] md:flex">
        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.href}>
            {crumb.href !== breadcrumbs[0]?.href && (
              <ChevronRight className="size-3 text-muted-foreground/50" />
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
      <span className="text-[13px] font-medium md:hidden">
        {breadcrumbs[breadcrumbs.length - 1]?.label ?? "Dashboard"}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Spotlight search trigger */}
      <SpotlightTrigger />

      {/* Notification Bell */}
      <NotificationBell />

      {/* Dark mode toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="size-[18px]" />
        ) : (
          <Moon className="size-[18px]" />
        )}
      </button>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent focus:outline-none"
            />
          }
        >
          <Avatar size="sm">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-medium">
              {getInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-[13px] font-medium lg:inline">
            {session?.user?.name ?? "User"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {session?.user?.email ?? "My Account"}
          </DropdownMenuLabel>
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
