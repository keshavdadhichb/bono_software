"use client"

import * as React from "react"
import {
  Search,
  Download,
  Package,
  Layers,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

// ---- Types ----

interface StockItem {
  id: string
  storeId: string
  lotNo: string
  styleNo: string | null
  styleRef: string | null
  styleType: string | null
  part: string | null
  color: string | null
  size: string | null
  qty: number
  uom: string
  rate: number
  process: string | null
}

interface Store {
  id: string
  storeName: string
}

// ---- Constants ----

const PROCESS_STAGES = [
  "All",
  "CUTTING",
  "PRINTING",
  "STITCHING",
  "WASHING",
  "IRONING",
  "PACKING",
  "CHECKING",
  "FINISHED GOODS",
  "EMBROIDERY",
]

// ---- Component ----

export default function GarmentStockPage() {
  const [stock, setStock] = React.useState<StockItem[]>([])
  const [stores, setStores] = React.useState<Store[]>([])
  const [loading, setLoading] = React.useState(true)
  const [groupByStyle, setGroupByStyle] = React.useState(false)

  // Filters
  const [filterStoreId, setFilterStoreId] = React.useState("")
  const [filterStyleNo, setFilterStyleNo] = React.useState("")
  const [filterProcess, setFilterProcess] = React.useState("All")
  const [filterColor, setFilterColor] = React.useState("")

  // Fetch stores
  React.useEffect(() => {
    fetch("/api/stores")
      .then((res) => (res.ok ? res.json() : []))
      .then(setStores)
      .catch(() => {})
  }, [])

  // Fetch stock with filters
  const fetchStock = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStoreId) params.set("storeId", filterStoreId)
      if (filterStyleNo) params.set("styleNo", filterStyleNo)
      if (filterProcess && filterProcess !== "All")
        params.set("process", filterProcess)
      if (filterColor) params.set("color", filterColor)

      const res = await fetch(`/api/garment/stock?${params.toString()}`)
      if (res.ok) setStock(await res.json())
    } catch (err) {
      console.error("Failed to fetch stock:", err)
    } finally {
      setLoading(false)
    }
  }, [filterStoreId, filterStyleNo, filterProcess, filterColor])

  React.useEffect(() => {
    fetchStock()
  }, [fetchStock])

  // Totals
  const totalQty = stock.reduce((sum, s) => sum + s.qty, 0)

  // Group by style
  const groupedStock = React.useMemo(() => {
    if (!groupByStyle) return null
    const groups: Record<string, StockItem[]> = {}
    for (const item of stock) {
      const key = item.styleNo || "No Style"
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }
    return groups
  }, [stock, groupByStyle])

  // Excel export
  const handleExport = async () => {
    try {
      const XLSX = await import("xlsx")
      const data = stock.map((s) => ({
        "Lot No": s.lotNo,
        "Style No": s.styleNo || "",
        "Style Ref": s.styleRef || "",
        "Style Type": s.styleType || "",
        Part: s.part || "",
        Color: s.color || "",
        Size: s.size || "",
        Qty: s.qty,
        UOM: s.uom,
        Stage: s.process || "",
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Garment Stock")
      XLSX.writeFile(wb, "garment_stock.xlsx")
    } catch (err) {
      console.error("Export failed:", err)
      alert("Failed to export. Please try again.")
    }
  }

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Garment Stock</h1>
          <p className="text-[13px] text-muted-foreground">
            View current garment stock across stores and process stages
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4 mr-1" />
          Export Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label>Store</Label>
              <Select value={filterStoreId} onValueChange={(v) => setFilterStoreId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.storeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Style No</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search style..."
                  value={filterStyleNo}
                  onChange={(e) => setFilterStyleNo(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Process Stage</Label>
              <Select value={filterProcess} onValueChange={(v) => setFilterProcess(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  {PROCESS_STAGES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                placeholder="Filter by color..."
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Checkbox
                id="groupByStyle"
                checked={groupByStyle}
                onCheckedChange={(checked) => setGroupByStyle(!!checked)}
              />
              <Label htmlFor="groupByStyle" className="text-sm cursor-pointer">
                <Layers className="size-3.5 inline mr-1" />
                Group by Style
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white py-4">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 ring-1 ring-blue-100">
              <Package className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Items</p>
              <p className="text-2xl font-semibold">{stock.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white py-4">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5 ring-1 ring-green-100">
              <Layers className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Qty</p>
              <p className="text-2xl font-semibold">{totalQty}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              Loading...
            </div>
          ) : stock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Package className="size-10 mb-3 opacity-40" />
              <p>No garment stock found</p>
            </div>
          ) : groupByStyle && groupedStock ? (
            // Grouped view
            <div className="divide-y">
              {Object.entries(groupedStock).map(([styleNo, items]) => {
                const groupQty = items.reduce((sum, i) => sum + i.qty, 0)
                return (
                  <div key={styleNo}>
                    <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5">
                      <span className="font-semibold text-sm">
                        Style: {styleNo}
                      </span>
                      <Badge variant="secondary">
                        {items.length} items | Qty: {groupQty}
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[11px] uppercase tracking-wide">Lot No</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wide">Style Ref</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wide">Style Type</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wide">Part</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wide">Color</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wide">Size</TableHead>
                          <TableHead className="text-right text-[11px] uppercase tracking-wide">Qty</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wide">UOM</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wide">Stage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-[13px]">{item.lotNo}</TableCell>
                            <TableCell className="text-[13px]">{item.styleRef || "-"}</TableCell>
                            <TableCell className="text-[13px]">{item.styleType || "-"}</TableCell>
                            <TableCell className="text-[13px]">{item.part || "-"}</TableCell>
                            <TableCell className="text-[13px]">{item.color || "-"}</TableCell>
                            <TableCell className="text-[13px]">{item.size || "-"}</TableCell>
                            <TableCell className="text-right text-[13px] font-medium">
                              {item.qty}
                            </TableCell>
                            <TableCell className="text-[13px]">{item.uom}</TableCell>
                            <TableCell>
                              {item.process ? (
                                <Badge variant="outline" className="text-xs">
                                  {item.process}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              })}
            </div>
          ) : (
            // Flat view
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] uppercase tracking-wide">Lot No</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Style No</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Style Ref</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Style Type</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Part</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Color</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Size</TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wide">Qty</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">UOM</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Stage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-[13px]">{item.lotNo}</TableCell>
                    <TableCell className="text-[13px] font-medium">
                      {item.styleNo || "-"}
                    </TableCell>
                    <TableCell className="text-[13px]">{item.styleRef || "-"}</TableCell>
                    <TableCell className="text-[13px]">{item.styleType || "-"}</TableCell>
                    <TableCell className="text-[13px]">{item.part || "-"}</TableCell>
                    <TableCell className="text-[13px]">{item.color || "-"}</TableCell>
                    <TableCell className="text-[13px]">{item.size || "-"}</TableCell>
                    <TableCell className="text-right text-[13px] font-medium">
                      {item.qty}
                    </TableCell>
                    <TableCell className="text-[13px]">{item.uom}</TableCell>
                    <TableCell>
                      {item.process ? (
                        <Badge variant="outline" className="text-xs">
                          {item.process}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={7} className="text-right">
                    Total
                  </TableCell>
                  <TableCell className="text-right">{totalQty}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
