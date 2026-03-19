"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  Plus,
  Search,
  Trash2,
  Save,
  X,
  FileText,
  ChevronLeft,
  Truck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ---- Constants ----

const PROCESS_TYPES = [
  "PRINTING",
  "STITCHING",
  "WASHING",
  "PACKING",
  "IRONING",
  "IRONING TO PACKING",
  "EMBOSS",
  "EMBROIDERY",
  "GARMENT FUSING",
  "GARMENT SMOCKING",
  "HAND EMBROIDERY",
  "GARMENT WASHING",
  "CHECKING",
  "FINISHED GOODS",
  "CUTTING",
  "DYEING",
] as const

const TAB_FILTERS = [
  "All",
  "CUTTING",
  "STITCHING",
  "PRINTING",
  "WASHING",
  "IRONING",
  "PACKING",
  "Others",
] as const

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-amber-100 text-amber-700",
  Partial: "bg-orange-100 text-orange-700",
  Closed: "bg-green-100 text-green-700",
}

// ---- Types ----

interface OutwardItem {
  id?: string
  slNo: number
  bundleNo: string
  lotNo: string
  styleNo: string
  styleRef: string
  styleType: string
  part: string
  color: string
  size: string
  qty: number
  uom: string
  rate: number
  amount: number
}

interface Outward {
  id: string
  dcNo: string
  dcDate: string
  processType: string
  storeId: string | null
  partyId: string
  party: { id: string; partyName: string }
  targetDate: string | null
  remarks: string | null
  vehicleNo: string | null
  transport: string | null
  totalQty: number
  totalAmount: number
  status: string
  items: OutwardItem[]
}

interface Party {
  id: string
  partyName: string
}

interface Store {
  id: string
  storeName: string
}

// ---- Helpers ----

function emptyItem(slNo: number): OutwardItem {
  return {
    slNo,
    bundleNo: "",
    lotNo: "",
    styleNo: "",
    styleRef: "",
    styleType: "",
    part: "",
    color: "",
    size: "",
    qty: 0,
    uom: "Pcs",
    rate: 0,
    amount: 0,
  }
}

// ---- Component ----

export default function GarmentProcessOutwardPage() {
  const [view, setView] = React.useState<"list" | "form">("list")
  const [outwards, setOutwards] = React.useState<Outward[]>([])
  const [parties, setParties] = React.useState<Party[]>([])
  const [stores, setStores] = React.useState<Store[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("All")
  const [editingId, setEditingId] = React.useState<string | null>(null)

  // Form state
  const [form, setForm] = React.useState({
    dcNo: "",
    dcDate: format(new Date(), "yyyy-MM-dd"),
    processType: "",
    storeId: "",
    partyId: "",
    targetDate: "",
    remarks: "",
    vehicleNo: "",
    transport: "",
  })
  const [items, setItems] = React.useState<OutwardItem[]>([emptyItem(1)])

  // Fetch data
  const fetchOutwards = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/garment/process-outward")
      if (res.ok) {
        const data = await res.json()
        setOutwards(data)
      }
    } catch (err) {
      console.error("Failed to fetch outwards:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMasters = React.useCallback(async () => {
    try {
      const [partiesRes, storesRes] = await Promise.all([
        fetch("/api/parties?type=Job Worker"),
        fetch("/api/stores"),
      ])
      if (partiesRes.ok) setParties(await partiesRes.json())
      if (storesRes.ok) setStores(await storesRes.json())
    } catch (err) {
      console.error("Failed to fetch masters:", err)
    }
  }, [])

  React.useEffect(() => {
    fetchOutwards()
    fetchMasters()
  }, [fetchOutwards, fetchMasters])

  // Generate next DC No
  const generateDcNo = React.useCallback(() => {
    const year = new Date().getFullYear().toString().slice(2)
    const count = outwards.length + 1
    return `GDC-${year}-${String(count).padStart(4, "0")}`
  }, [outwards.length])

  // ---- Form handlers ----

  const handleNewDC = () => {
    setEditingId(null)
    setForm({
      dcNo: generateDcNo(),
      dcDate: format(new Date(), "yyyy-MM-dd"),
      processType: "",
      storeId: "",
      partyId: "",
      targetDate: "",
      remarks: "",
      vehicleNo: "",
      transport: "",
    })
    setItems([emptyItem(1)])
    setView("form")
  }

  const handleEdit = (outward: Outward) => {
    setEditingId(outward.id)
    setForm({
      dcNo: outward.dcNo,
      dcDate: format(new Date(outward.dcDate), "yyyy-MM-dd"),
      processType: outward.processType,
      storeId: outward.storeId || "",
      partyId: outward.partyId,
      targetDate: outward.targetDate
        ? format(new Date(outward.targetDate), "yyyy-MM-dd")
        : "",
      remarks: outward.remarks || "",
      vehicleNo: outward.vehicleNo || "",
      transport: outward.transport || "",
    })
    setItems(
      outward.items.length > 0
        ? outward.items.map((item) => ({ ...item }))
        : [emptyItem(1)]
    )
    setView("form")
  }

  const handleAddRow = () => {
    setItems((prev) => [...prev, emptyItem(prev.length + 1)])
  }

  const handleDeleteRow = (index: number) => {
    if (items.length <= 1) return
    setItems((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, slNo: i + 1 }))
    )
  }

  const handleItemChange = (
    index: number,
    field: keyof OutwardItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        if (field === "qty" || field === "rate") {
          updated.amount = Number(updated.qty) * Number(updated.rate)
        }
        return updated
      })
    )
  }

  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0)
  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )

  const handleSave = async () => {
    if (!form.processType || !form.partyId) {
      alert("Process Type and Party are required")
      return
    }
    try {
      setSaving(true)
      const payload = {
        ...form,
        totalQty,
        totalAmount,
        items: items.filter((item) => item.qty > 0),
      }

      const url = editingId
        ? `/api/garment/process-outward/${editingId}`
        : "/api/garment/process-outward"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await fetchOutwards()
        setView("list")
      } else {
        const err = await res.json()
        alert(err.error || "Failed to save")
      }
    } catch (err) {
      console.error("Failed to save:", err)
      alert("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  // ---- Filtered data ----

  const filteredOutwards = React.useMemo(() => {
    let result = outwards

    // Tab filter
    if (activeTab !== "All") {
      if (activeTab === "Others") {
        const mainTypes: readonly string[] = TAB_FILTERS.filter((t) => t !== "All" && t !== "Others")
        result = result.filter(
          (o) => !mainTypes.includes(o.processType)
        )
      } else {
        result = result.filter((o) => o.processType === activeTab)
      }
    }

    // Search filter
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.dcNo.toLowerCase().includes(s) ||
          o.party.partyName.toLowerCase().includes(s) ||
          o.processType.toLowerCase().includes(s)
      )
    }

    return result
  }, [outwards, activeTab, search])

  // ---- Render ----

  if (view === "form") {
    return (
      <div className="flex flex-col gap-6">
        {/* Form Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("list")}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {editingId ? "Edit" : "New"} Garment Process Outward
            </h1>
            <p className="text-sm text-muted-foreground">
              DC No: {form.dcNo}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dcNo">DC No</Label>
                <Input id="dcNo" value={form.dcNo} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dcDate">Date</Label>
                <Input
                  id="dcDate"
                  type="date"
                  value={form.dcDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dcDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="processType">Process Type *</Label>
                <Select
                  value={form.processType}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, processType: val ?? "" }))
                  }
                >
                  <SelectTrigger id="processType">
                    <SelectValue placeholder="Select Process" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESS_TYPES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeId">Store</Label>
                <Select
                  value={form.storeId}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, storeId: val ?? "" }))
                  }
                >
                  <SelectTrigger id="storeId">
                    <SelectValue placeholder="Select Store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.storeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partyId">Party *</Label>
                <Select
                  value={form.partyId}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, partyId: val ?? "" }))
                  }
                >
                  <SelectTrigger id="partyId">
                    <SelectValue placeholder="Select Party" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.partyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={form.targetDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, targetDate: e.target.value }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Items</CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddRow}>
              <Plus className="size-4 mr-1" />
              Add Row
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sl</TableHead>
                    <TableHead className="min-w-[90px]">Bundle No</TableHead>
                    <TableHead className="min-w-[90px]">Lot No</TableHead>
                    <TableHead className="min-w-[100px]">Style No</TableHead>
                    <TableHead className="min-w-[100px]">Style Ref</TableHead>
                    <TableHead className="min-w-[90px]">Style Type</TableHead>
                    <TableHead className="min-w-[80px]">Part</TableHead>
                    <TableHead className="min-w-[80px]">Color</TableHead>
                    <TableHead className="min-w-[70px]">Size</TableHead>
                    <TableHead className="min-w-[70px] text-right">Qty</TableHead>
                    <TableHead className="min-w-[70px]">UOM</TableHead>
                    <TableHead className="min-w-[70px] text-right">Rate</TableHead>
                    <TableHead className="min-w-[80px] text-right">Amount</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-center text-muted-foreground">
                        {item.slNo}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.bundleNo}
                          onChange={(e) =>
                            handleItemChange(idx, "bundleNo", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.lotNo}
                          onChange={(e) =>
                            handleItemChange(idx, "lotNo", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.styleNo}
                          onChange={(e) =>
                            handleItemChange(idx, "styleNo", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.styleRef}
                          onChange={(e) =>
                            handleItemChange(idx, "styleRef", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.styleType}
                          onChange={(e) =>
                            handleItemChange(idx, "styleType", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.part}
                          onChange={(e) =>
                            handleItemChange(idx, "part", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.color}
                          onChange={(e) =>
                            handleItemChange(idx, "color", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.size}
                          onChange={(e) =>
                            handleItemChange(idx, "size", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.qty || ""}
                          onChange={(e) =>
                            handleItemChange(idx, "qty", Number(e.target.value))
                          }
                          className="h-8 text-sm text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.uom}
                          onChange={(e) =>
                            handleItemChange(idx, "uom", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) =>
                            handleItemChange(idx, "rate", Number(e.target.value))
                          }
                          className="h-8 text-sm text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {item.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteRow(idx)}
                          disabled={items.length <= 1}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Footer fields */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={form.remarks}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleNo">Vehicle No</Label>
                <Input
                  id="vehicleNo"
                  value={form.vehicleNo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, vehicleNo: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transport">Transport</Label>
                <Input
                  id="transport"
                  value={form.transport}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, transport: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Totals */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
              <div className="flex gap-6">
                <div>
                  <span className="text-sm text-muted-foreground">Total Qty</span>
                  <p className="text-lg font-bold">{totalQty}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <p className="text-lg font-bold">{totalAmount.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setView("list")}
                  disabled={saving}
                >
                  <X className="size-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="size-4 mr-1" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---- List View ----

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Garment Process Outward
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage outward delivery challans for garment processes
          </p>
        </div>
        <Button onClick={handleNewDC}>
          <Plus className="size-4 mr-1" />
          New DC
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? "")} className="flex-1">
          <TabsList className="flex-wrap h-auto gap-1">
            {TAB_FILTERS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="text-xs">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search DC, party..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              Loading...
            </div>
          ) : filteredOutwards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FileText className="size-10 mb-3 opacity-40" />
              <p>No outward DCs found</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleNewDC}
              >
                <Plus className="size-4 mr-1" />
                Create First DC
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DC No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOutwards.map((outward) => (
                  <TableRow
                    key={outward.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEdit(outward)}
                  >
                    <TableCell className="font-medium">
                      {outward.dcNo}
                    </TableCell>
                    <TableCell>
                      {format(new Date(outward.dcDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        <Truck className="size-3 mr-1" />
                        {outward.processType}
                      </Badge>
                    </TableCell>
                    <TableCell>{outward.party.partyName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {outward.totalQty}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[outward.status] || STATUS_COLORS.Open
                        }`}
                      >
                        {outward.status}
                      </span>
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
