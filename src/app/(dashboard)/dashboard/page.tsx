"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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

function getFinancialYear(): string {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  if (month >= 3) return `FY ${year}-${String(year + 1).slice(2)}`
  return `FY ${year - 1}-${String(year).slice(2)}`
}

const typeBadgeColors: Record<string, string> = {
  "Yarn Outward": "bg-blue-100 text-blue-700",
  "Fabric Outward": "bg-emerald-100 text-emerald-700",
  "Garment Outward": "bg-violet-100 text-violet-700",
  "Yarn Inward": "bg-green-100 text-green-700",
}

const statusBadgeColors: Record<string, string> = {
  Open: "bg-amber-100 text-amber-700",
  Closed: "bg-green-100 text-green-700",
  Partial: "bg-orange-100 text-orange-700",
  Received: "bg-blue-100 text-blue-700",
}

const quickActions = [
  { label: "New Yarn Outward", icon: CircleDot, href: "/yarn/process-outward", color: "text-blue-600" },
  { label: "New Fabric Outward", icon: Layers, href: "/fabric/process-outward", color: "text-emerald-600" },
  { label: "New Garment Outward", icon: Shirt, href: "/garment/process-outward", color: "text-violet-600" },
  { label: "View Reports", icon: BarChart3, href: "/reports", color: "text-orange-600" },
]

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground text-sm mt-1">{formatCurrentDate()}</p>
        </div>
        <Badge variant="secondary" className="w-fit text-xs font-semibold px-3 py-1 mt-2 sm:mt-0">
          {getFinancialYear()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.title} className="gap-3 py-4">
              <CardContent className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{s.title}</span>
                  <span className="text-2xl font-bold tracking-tight">{s.value}</span>
                </div>
                <div className={`rounded-lg p-2.5 ${s.bg} ring-1 ${s.ring}`}>
                  <Icon className={`size-5 ${s.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest activity across all modules</CardDescription>
              </div>
              <Link href="/reports">
                <Button variant="outline" size="sm">View All <ChevronRight className="size-3.5" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet. Start by creating an outward DC.</p>
            ) : (
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
                  {transactions.map((tx) => (
                    <TableRow key={tx.dcRef}>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${typeBadgeColors[tx.type] || "bg-gray-100 text-gray-700"}`}>
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{tx.dcRef}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{tx.party}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">{tx.qty}</TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeColors[tx.status] || "bg-gray-100 text-gray-700"}`}>
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

        <div className="flex flex-col gap-6">
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
                      <Button variant="outline" className="h-auto flex-col gap-2 py-4 text-xs font-medium w-full">
                        <Icon className={`size-5 ${a.color}`} />
                        <span className="text-center leading-tight">{a.label}</span>
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Alerts & warnings</CardDescription>
                </div>
                {notifications.length > 0 && (
                  <span className="flex items-center justify-center size-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                    {notifications.length}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">No alerts - all good!</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {notifications.map((n, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors">
                      <div className={`mt-0.5 rounded-md p-1.5 ${n.type === "overdue" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                        {n.type === "overdue" ? <Clock className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed text-foreground">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(n.time).toLocaleDateString()}
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
