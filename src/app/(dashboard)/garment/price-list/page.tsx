"use client"

import * as React from "react"
import {
  Search,
  Save,
  Download,
  RefreshCw,
  IndianRupee,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ---- Types ----

interface PriceItem {
  id: string
  styleNo: string
  styleRef: string
  size: string
  rate: number
  isNew?: boolean
  isDirty?: boolean
}

// ---- Component ----

export default function GarmentPriceListPage() {
  const [items, setItems] = React.useState<PriceItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Load price list from stock data
  const loadFromStock = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/garment/stock")
      if (!res.ok) return

      const stock: {
        id: string
        styleNo: string | null
        styleRef: string | null
        size: string | null
        rate: number
      }[] = await res.json()

      // Deduplicate by styleNo + size
      const seen = new Set<string>()
      const priceItems: PriceItem[] = []

      for (const s of stock) {
        if (!s.styleNo) continue
        const key = `${s.styleNo}|${s.size || ""}`
        if (seen.has(key)) continue
        seen.add(key)
        priceItems.push({
          id: s.id,
          styleNo: s.styleNo,
          styleRef: s.styleRef || "",
          size: s.size || "",
          rate: s.rate || 0,
          isNew: false,
          isDirty: false,
        })
      }

      priceItems.sort((a, b) => {
        const styleCompare = a.styleNo.localeCompare(b.styleNo)
        if (styleCompare !== 0) return styleCompare
        return a.size.localeCompare(b.size)
      })

      setItems(priceItems)
    } catch (err) {
      console.error("Failed to load stock:", err)
      alert("Failed to load styles from stock")
    } finally {
      setLoading(false)
    }
  }

  const handleRateChange = (index: number, rate: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, rate, isDirty: true } : item
      )
    )
  }

  const handleSave = async () => {
    const dirtyItems = items.filter((item) => item.isDirty)
    if (dirtyItems.length === 0) {
      alert("No changes to save")
      return
    }

    try {
      setSaving(true)
      // Save to garment stock - update rates
      for (const item of dirtyItems) {
        await fetch(`/api/garment/stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            styleNo: item.styleNo,
            size: item.size,
            rate: item.rate,
          }),
        })
      }

      setItems((prev) =>
        prev.map((item) => ({ ...item, isDirty: false }))
      )
      alert("Price list saved successfully")
    } catch (err) {
      console.error("Failed to save:", err)
      alert("Failed to save price list")
    } finally {
      setSaving(false)
    }
  }

  // Filtered items
  const filteredItems = React.useMemo(() => {
    if (!search) return items
    const s = search.toLowerCase()
    return items.filter(
      (item) =>
        item.styleNo.toLowerCase().includes(s) ||
        item.styleRef.toLowerCase().includes(s) ||
        item.size.toLowerCase().includes(s)
    )
  }, [items, search])

  const dirtyCount = items.filter((i) => i.isDirty).length

  // ---- Render ----

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Garment Price List
          </h1>
          <p className="text-sm text-muted-foreground">
            Set and manage prices for garment styles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadFromStock} disabled={loading}>
            <RefreshCw
              className={`size-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Load All Styles From Stock
          </Button>
          <Button onClick={handleSave} disabled={saving || dirtyCount === 0}>
            <Save className="size-4 mr-1" />
            {saving ? "Saving..." : `Save${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by style no, ref, size..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <IndianRupee className="size-10 mb-3 opacity-40" />
              <p>No price list data</p>
              <p className="text-xs mt-1">
                Click &quot;Load All Styles From Stock&quot; to get started
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={loadFromStock}
                disabled={loading}
              >
                <RefreshCw
                  className={`size-4 mr-1 ${loading ? "animate-spin" : ""}`}
                />
                Load Styles
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Style No</TableHead>
                  <TableHead>Style Ref</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-40 text-right">
                    Rate (per piece)
                  </TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, idx) => (
                  <TableRow
                    key={`${item.styleNo}-${item.size}-${idx}`}
                    className={item.isDirty ? "bg-amber-50" : ""}
                  >
                    <TableCell className="text-muted-foreground text-center">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.styleNo}
                    </TableCell>
                    <TableCell>{item.styleRef || "-"}</TableCell>
                    <TableCell>{item.size || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.rate || ""}
                        onChange={(e) =>
                          handleRateChange(
                            items.indexOf(item),
                            Number(e.target.value)
                          )
                        }
                        className="h-8 text-sm text-right w-32 ml-auto"
                      />
                    </TableCell>
                    <TableCell>
                      {item.isDirty && (
                        <span className="inline-flex size-2 rounded-full bg-amber-500" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
