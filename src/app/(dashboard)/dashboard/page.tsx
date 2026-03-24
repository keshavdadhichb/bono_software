"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Users, ArrowUpRight, Package, Loader2, Clock, AlertCircle,
  ChevronRight, CircleDot, Layers, Shirt, BarChart3,
} from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

interface DashboardData {
  stats: {
    totalParties: number
    totalStores: number
    pendingOutward: number
    yarnStockKgs: number
  }
  recentTransactions: {
    type: string
    dcRef: string
    party: string
    date: string
    qty: string
    status: string
  }[]
  notifications: {
    type: "overdue" | "stock"
    message: string
    time: string
  }[]
}

function formatCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function getFirstName(name?: string | null): string {
  if (!name) return "there"
  return name.split(" ")[0]
}

function getFinancialYear(): string {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  if (month >= 3) return `FY ${year}-${String(year + 1).slice(2)}`
  return `FY ${year - 1}-${String(year).slice(2)}`
}

const typeBadgeColors: Record<string, string> = {
  "Yarn Outward": "bg-blue-50 text-blue-700 border-blue-200",
  "Fabric Outward": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Garment Outward": "bg-violet-50 text-violet-700 border-violet-200",
  "Yarn Inward": "bg-green-50 text-green-700 border-green-200",
}

const statusBadgeColors: Record<string, string> = {
  Open: "bg-amber-50 text-amber-700 border-amber-200",
  Closed: "bg-green-50 text-green-700 border-green-200",
  Partial: "bg-orange-50 text-orange-700 border-orange-200",
  Received: "bg-blue-50 text-blue-700 border-blue-200",
}

const quickActions = [
  { label: "New Yarn Outward", icon: CircleDot, href: "/yarn/process-outward", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "New Fabric Outward", icon: Layers, href: "/fabric/process-outward", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "New Garment Outward", icon: Shirt, href: "/garment/process-outward", color: "text-violet-600", bg: "bg-violet-50" },
  { label: "View Reports", icon: BarChart3, href: "/reports", color: "text-orange-600", bg: "bg-orange-50" },
]

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const stats = data?.stats ?? { totalParties: 0, totalStores: 0, pendingOutward: 0, yarnStockKgs: 0 }
  const transactions = data?.recentTransactions ?? []
  const notifications = data?.notifications ?? []

  const statCards = [
    { title: "Total Parties", value: stats.totalParties, icon: Users, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100" },
    { title: "Pending Outward DCs", value: stats.pendingOutward, icon: ArrowUpRight, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100" },
    { title: "Stores", value: stats.totalStores, icon: Package, color: "text-green-600", bg: "bg-green-50", ring: "ring-green-100" },
    { title: "Yarn Stock", value: `${stats.yarnStockKgs.toFixed(0)} Kgs`, icon: CircleDot, color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-100" },
  ]

  const overdueCount = notifications.filter((n) => n.type === "overdue").length
  const greeting = getGreeting()
  const firstName = getFirstName(session?.user?.name)

  return (
    <div className="flex flex-col gap-6">
      {/* Morning Digest */}
      <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-blue-950/40 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                {greeting}, {firstName}!
              </h2>
              <p className="text-[12px] text-muted-foreground">{formatCurrentDate()}</p>
            </div>
            <p className="text-[12px] text-indigo-700 dark:text-indigo-300 font-medium">
              Here&apos;s your overview for today
            </p>
            {overdueCount > 0 && (
              <p className="text-[12px] text-amber-700 dark:text-amber-400 font-medium">
                ⚠️ {overdueCount} delivery {overdueCount === 1 ? "challan is" : "challans are"} overdue
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                stats.pendingOutward > 0
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
                  : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400"
              }`}
            >
              {stats.pendingOutward} pending DCs
            </span>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400">
              {stats.yarnStockKgs.toFixed(0)} Kgs yarn
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                notifications.length > 0
                  ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-400"
                  : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400"
              }`}
            >
              {notifications.length} {notifications.length === 1 ? "alert" : "alerts"}
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground text-[13px] mt-0.5">{formatCurrentDate()}</p>
        </div>
        <Badge variant="secondary" className="w-fit text-[11px] font-medium px-2.5 py-0.5 mt-1 sm:mt-0">
          {getFinancialYear()}
        </Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.title} className="gap-2 py-4 border-0 shadow-sm bg-white">
              <CardContent className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{s.title}</span>
                  <span className="text-2xl font-semibold tracking-tight">{s.value}</span>
                </div>
                <div className={`rounded-xl p-2.5 ${s.bg}`}>
                  <Icon className={`size-5 ${s.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="xl:col-span-2 border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                <CardDescription className="text-[12px]">Latest activity across all modules</CardDescription>
              </div>
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="text-[12px] text-muted-foreground hover:text-foreground">
                  View All <ChevronRight className="size-3.5 ml-0.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-[13px]">No transactions yet. Start by creating an outward DC.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px]">Type</TableHead>
                    <TableHead className="text-[11px]">DC / Ref No</TableHead>
                    <TableHead className="hidden md:table-cell text-[11px]">Party</TableHead>
                    <TableHead className="hidden sm:table-cell text-[11px]">Date</TableHead>
                    <TableHead className="text-right text-[11px]">Qty</TableHead>
                    <TableHead className="text-right text-[11px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.dcRef} className="group">
                      <TableCell className="py-2.5">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${typeBadgeColors[tx.type] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-[13px] py-2.5">{tx.dcRef}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-[13px] py-2.5">{tx.party}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-[13px] py-2.5">
                        {new Date(tx.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </TableCell>
                      <TableCell className="text-right text-[13px] py-2.5 font-medium">{tx.qty}</TableCell>
                      <TableCell className="text-right py-2.5">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusBadgeColors[tx.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                          {tx.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              <CardDescription className="text-[12px]">Common shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5">
                {quickActions.map((a) => {
                  const Icon = a.icon
                  return (
                    <Link key={a.label} href={a.href}>
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-muted/30 py-4 px-2 text-center transition-all duration-150 hover:bg-accent hover:shadow-sm hover:border-border cursor-pointer">
                        <div className={`rounded-lg p-2 ${a.bg}`}>
                          <Icon className={`size-4 ${a.color}`} />
                        </div>
                        <span className="text-[11px] font-medium text-foreground leading-tight">{a.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Notifications</CardTitle>
                  <CardDescription className="text-[12px]">Alerts & warnings</CardDescription>
                </div>
                {notifications.length > 0 && (
                  <span className="flex items-center justify-center size-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                    {notifications.length}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-[13px]">No alerts - all good!</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {notifications.map((n, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-lg p-2.5 hover:bg-muted/50 transition-colors">
                      <div className={`mt-0.5 rounded-lg p-1.5 ${n.type === "overdue" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                        {n.type === "overdue" ? <Clock className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] leading-relaxed text-foreground">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(n.time).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
