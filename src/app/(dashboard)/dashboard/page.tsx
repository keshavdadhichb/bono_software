"use client"

import Link from "next/link"
import {
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Shirt,
  ScrollText,
  BarChart3,
  Clock,
  Bell,
  AlertCircle,
  ChevronRight,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ---- Demo / hardcoded data ----

const stats = [
  {
    title: "Total Parties",
    value: 148,
    change: +12.5,
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-100",
  },
  {
    title: "Pending Outward DCs",
    value: 23,
    change: -4.2,
    icon: ArrowUpRight,
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-100",
  },
  {
    title: "Pending Inward DCs",
    value: 17,
    change: +8.1,
    icon: ArrowDownLeft,
    color: "text-green-600",
    bg: "bg-green-50",
    ring: "ring-green-100",
  },
  {
    title: "Low Stock Alerts",
    value: 5,
    change: -20.0,
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    ring: "ring-red-100",
  },
]

type TransactionType = "Purchase" | "Outward" | "Inward" | "Sale"
type TransactionStatus = "Open" | "Closed" | "Partial"

const recentTransactions: {
  type: TransactionType
  dcRef: string
  party: string
  date: string
  qty: string
  status: TransactionStatus
}[] = [
  {
    type: "Purchase",
    dcRef: "GRN-2026-0045",
    party: "Sri Lakshmi Yarns",
    date: "19 Mar 2026",
    qty: "500 Kgs",
    status: "Closed",
  },
  {
    type: "Outward",
    dcRef: "YDC-2026-0112",
    party: "Devi Dyers",
    date: "18 Mar 2026",
    qty: "320 Kgs",
    status: "Open",
  },
  {
    type: "Inward",
    dcRef: "YIN-2026-0089",
    party: "Devi Dyers",
    date: "18 Mar 2026",
    qty: "290 Kgs",
    status: "Partial",
  },
  {
    type: "Sale",
    dcRef: "INV-2026-0034",
    party: "RK Garments",
    date: "17 Mar 2026",
    qty: "150 Pcs",
    status: "Closed",
  },
  {
    type: "Outward",
    dcRef: "FDC-2026-0078",
    party: "Sai Compacting",
    date: "17 Mar 2026",
    qty: "420 Kgs",
    status: "Open",
  },
  {
    type: "Purchase",
    dcRef: "GRN-2026-0044",
    party: "Mahalakshmi Textiles",
    date: "16 Mar 2026",
    qty: "750 Kgs",
    status: "Closed",
  },
]

const typeBadgeColors: Record<TransactionType, string> = {
  Purchase: "bg-blue-100 text-blue-700",
  Outward: "bg-amber-100 text-amber-700",
  Inward: "bg-green-100 text-green-700",
  Sale: "bg-purple-100 text-purple-700",
}

const statusBadgeColors: Record<TransactionStatus, string> = {
  Open: "bg-amber-100 text-amber-700",
  Closed: "bg-green-100 text-green-700",
  Partial: "bg-orange-100 text-orange-700",
}

const quickActions = [
  {
    label: "New Yarn Outward",
    icon: Package,
    href: "/yarn/process-outward/new",
    color: "text-blue-600",
  },
  {
    label: "New Fabric Outward",
    icon: ScrollText,
    href: "/fabric/process-outward/new",
    color: "text-emerald-600",
  },
  {
    label: "New Garment Outward",
    icon: Shirt,
    href: "/garment/process-outward/new",
    color: "text-violet-600",
  },
  {
    label: "View Stock Reports",
    icon: BarChart3,
    href: "/reports/stock",
    color: "text-orange-600",
  },
]

const notifications = [
  {
    type: "overdue" as const,
    message: "DC YDC-2026-0098 from Devi Dyers is overdue by 3 days",
    time: "2 hours ago",
  },
  {
    type: "overdue" as const,
    message: "DC FDC-2026-0065 from Sai Compacting is overdue by 1 day",
    time: "5 hours ago",
  },
  {
    type: "stock" as const,
    message: "30s Combed Cotton yarn stock is below minimum (12 Kgs remaining)",
    time: "1 day ago",
  },
  {
    type: "stock" as const,
    message: "Single Jersey 26D fabric stock is critically low (8 Kgs)",
    time: "1 day ago",
  },
  {
    type: "overdue" as const,
    message: "DC GDC-2026-0041 from Stitching Hub is overdue by 5 days",
    time: "2 days ago",
  },
]

// ---- Helpers ----

function formatCurrentDate(): string {
  const d = new Date()
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getFinancialYear(): string {
  const now = new Date()
  const month = now.getMonth() // 0-indexed
  const year = now.getFullYear()
  // Indian FY: April to March. If month >= March (index 3), FY starts this year.
  if (month >= 3) {
    return `FY ${year}-${String(year + 1).slice(2)}`
  }
  return `FY ${year - 1}-${String(year).slice(2)}`
}

// ---- Component ----

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      {/* Welcome header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {formatCurrentDate()}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="w-fit text-xs font-semibold px-3 py-1 mt-2 sm:mt-0"
        >
          {getFinancialYear()}
        </Badge>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          const isPositive = s.change >= 0
          return (
            <Card key={s.title} className="gap-3 py-4">
              <CardContent className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {s.title}
                  </span>
                  <span className="text-2xl font-bold tracking-tight">
                    {s.value}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {isPositive ? "+" : ""}
                    {s.change}%
                  </span>
                </div>
                <div
                  className={`rounded-lg p-2.5 ${s.bg} ring-1 ${s.ring}`}
                >
                  <Icon className={`size-5 ${s.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main content: Transactions + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Latest activity across all modules
                </CardDescription>
              </div>
              <Link href="/reports/transactions">
                <Button variant="outline" size="sm">
                  View All
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>DC / Ref No</TableHead>
                  <TableHead className="hidden md:table-cell">Party</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx.dcRef}>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          typeBadgeColors[tx.type]
                        }`}
                      >
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{tx.dcRef}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {tx.party}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {tx.date}
                    </TableCell>
                    <TableCell className="text-right">{tx.qty}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          statusBadgeColors[tx.status]
                        }`}
                      >
                        {tx.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right sidebar: Quick Actions + Notifications */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((a) => {
                  const Icon = a.icon
                  return (
                    <Link key={a.label} href={a.href}>
                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-2 py-4 text-xs font-medium"
                      >
                        <Icon className={`size-5 ${a.color}`} />
                        <span className="text-center leading-tight">
                          {a.label}
                        </span>
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Recent alerts</CardDescription>
                </div>
                <span className="flex items-center justify-center size-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                  {notifications.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {notifications.map((n, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`mt-0.5 rounded-md p-1.5 ${
                        n.type === "overdue"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {n.type === "overdue" ? (
                        <Clock className="size-3.5" />
                      ) : (
                        <AlertCircle className="size-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed text-foreground">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {n.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
