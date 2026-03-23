"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Database,
  CircleDot,
  Layers,
  Shirt,
  Package,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Scissors,
  Shield,
} from "lucide-react"
import { usePermissions } from "@/lib/use-permissions"

// ---------- Types ----------

interface NavLink {
  label: string
  href: string
}

interface NavGroup {
  label: string
  icon: React.ElementType
  href?: string
  children?: NavLink[]
}

// ---------- Navigation data ----------

const navigation: NavGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Master",
    icon: Database,
    children: [
      { label: "Parties", href: "/master/parties" },
      { label: "Stores", href: "/master/stores" },
      { label: "Colors", href: "/master/colors" },
      { label: "Yarn Types", href: "/master/yarn-types" },
      { label: "Yarn Counts", href: "/master/yarn-counts" },
      { label: "Style Numbers", href: "/master/style-numbers" },
      { label: "Fabric Masters", href: "/master/fabric-masters" },
      { label: "GST Tax Slabs", href: "/master/gst-slabs" },
      { label: "Concerns", href: "/master/concerns" },
    ],
  },
  {
    label: "Yarn",
    icon: CircleDot,
    children: [
      { label: "Purchase Orders", href: "/yarn/purchase-orders" },
      { label: "Purchases", href: "/yarn/purchases" },
      { label: "Process Outward", href: "/yarn/process-outward" },
      { label: "Process Inward", href: "/yarn/process-inward" },
      { label: "Sales", href: "/yarn/sales" },
      { label: "Stock", href: "/yarn/stock" },
    ],
  },
  {
    label: "Fabric",
    icon: Layers,
    children: [
      { label: "Process Outward", href: "/fabric/process-outward" },
      { label: "Process Inward", href: "/fabric/process-inward" },
      { label: "Stock", href: "/fabric/stock" },
    ],
  },
  {
    label: "Garment",
    icon: Shirt,
    children: [
      { label: "Price List", href: "/garment/price-list" },
      { label: "Process Outward", href: "/garment/process-outward" },
      { label: "Process Inward", href: "/garment/process-inward" },
      { label: "Stock", href: "/garment/stock" },
    ],
  },
  {
    label: "Accessory",
    icon: Package,
    children: [
      { label: "Masters", href: "/accessory/masters" },
      { label: "Stock", href: "/accessory/stock" },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    href: "/reports",
  },
]

// ---------- Helpers ----------

function getInitials(name?: string | null): string {
  if (!name) return "U"
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ---------- Sidebar component ----------

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const permissions = usePermissions()

  const fullNavigation = React.useMemo(() => {
    const nav = [...navigation]
    if (permissions.canManageUsers) {
      nav.push({
        label: "Admin",
        icon: Shield,
        children: [{ label: "Users", href: "/admin/users" }],
      })
    }
    return nav
  }, [permissions.canManageUsers])

  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {}
    for (const group of fullNavigation) {
      if (group.children) {
        const isActive = group.children.some((child) =>
          pathname.startsWith(child.href)
        )
        if (isActive) initial[group.label] = true
      }
    }
    return initial
  })

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isLinkActive = (href: string) => pathname === href
  const isSectionActive = (group: NavGroup) => {
    if (group.href) return pathname === group.href
    return group.children?.some((child) => pathname.startsWith(child.href)) ?? false
  }

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-r border-sidebar-border bg-white text-sidebar-foreground transition-[width] duration-200 ease-out",
        collapsed ? "w-[68px]" : "w-[256px]"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Scissors className="size-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col whitespace-nowrap">
            <span className="text-sm font-semibold tracking-tight leading-tight">
              BonoStyle
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              Creations LLP
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-0.5 px-2 py-3">
          <TooltipProvider>
            {fullNavigation.map((group) => {
              const Icon = group.icon
              const active = isSectionActive(group)
              const isOpen = openSections[group.label] ?? false

              if (group.href) {
                const linkActive = isLinkActive(group.href)
                return (
                  <Tooltip key={group.label}>
                    <TooltipTrigger
                      render={
                        <Link
                          href={group.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                            linkActive
                              ? "bg-primary/10 text-primary shadow-sm"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        />
                      }
                    >
                      <Icon className={cn("size-4 shrink-0", linkActive && "text-primary")} />
                      {!collapsed && <span>{group.label}</span>}
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" sideOffset={8}>
                        {group.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              }

              return (
                <div key={group.label} className="flex flex-col">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          onClick={() => {
                            if (collapsed) return
                            toggleSection(group.label)
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                            active
                              ? "text-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        />
                      }
                    >
                      <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{group.label}</span>
                          <ChevronDown
                            className={cn(
                              "size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
                              isOpen && "rotate-180"
                            )}
                          />
                        </>
                      )}
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" sideOffset={8}>
                        {group.label}
                      </TooltipContent>
                    )}
                  </Tooltip>

                  {!collapsed && (
                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-200 ease-out",
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-[22px] flex flex-col gap-px border-l border-border/60 pl-3 pt-0.5 pb-1">
                          {group.children!.map((child) => {
                            const childActive = isLinkActive(child.href)
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "rounded-md px-2.5 py-[6px] text-[13px] transition-all duration-150",
                                  childActive
                                    ? "bg-primary/10 font-medium text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                              >
                                {child.label}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </TooltipProvider>
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="hidden border-t border-sidebar-border p-2 md:block">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform duration-200",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* User section */}
      <div className="border-t border-sidebar-border">
        <div className="flex shrink-0 items-center gap-2.5 px-3 py-2.5">
          <Avatar size="sm">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between gap-1 overflow-hidden">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium leading-tight">
                  {session?.user?.name ?? "User"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground leading-tight">
                  {session?.user?.email ?? ""}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    />
                  }
                >
                  <LogOut className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="top">Sign out</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- Mobile sidebar wrapper ----------

interface MobileSidebarProps {
  onNavigate?: () => void
}

export function MobileSidebar({ onNavigate }: MobileSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const permissions = usePermissions()

  const fullNavigation = React.useMemo(() => {
    const nav = [...navigation]
    if (permissions.canManageUsers) {
      nav.push({
        label: "Admin",
        icon: Shield,
        children: [{ label: "Users", href: "/admin/users" }],
      })
    }
    return nav
  }, [permissions.canManageUsers])

  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {}
    for (const group of fullNavigation) {
      if (group.children) {
        const isActive = group.children.some((child) =>
          pathname.startsWith(child.href)
        )
        if (isActive) initial[group.label] = true
      }
    }
    return initial
  })

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isLinkActive = (href: string) => pathname === href
  const isSectionActive = (group: NavGroup) => {
    if (group.href) return pathname === group.href
    return group.children?.some((child) => pathname.startsWith(child.href)) ?? false
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Scissors className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight leading-tight">
            BonoStyle
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            Creations LLP
          </span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-0.5 px-2 py-3">
          {fullNavigation.map((group) => {
            const Icon = group.icon
            const active = isSectionActive(group)
            const isOpen = openSections[group.label] ?? false

            if (group.href) {
              const linkActive = isLinkActive(group.href)
              return (
                <Link
                  key={group.label}
                  href={group.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                    linkActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", linkActive && "text-primary")} />
                  <span>{group.label}</span>
                </Link>
              )
            }

            return (
              <div key={group.label} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleSection(group.label)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-muted-foreground/60 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="ml-[22px] flex flex-col gap-px border-l border-border/60 pl-3 pt-0.5 pb-1">
                      {group.children!.map((child) => {
                        const childActive = isLinkActive(child.href)
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onNavigate}
                            className={cn(
                              "rounded-md px-2.5 py-[7px] text-[13px] transition-all duration-150",
                              childActive
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                          >
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <Avatar size="sm">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 items-center justify-between gap-1 overflow-hidden">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium leading-tight">
                {session?.user?.name ?? "User"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground leading-tight">
                {session?.user?.email ?? ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
