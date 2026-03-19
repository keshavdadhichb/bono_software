"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  Plus,
  Search,
  Save,
  X,
  FileText,
  ChevronLeft,
  PackageCheck,
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
import { Checkbox } from "@/components/ui/checkbox"

// ---- Types ----

interface OutwardItem {
  slNo: number
  bundleNo: string | null
  lotNo: string | null
  styleNo: string | null
  styleRef: string | null
  part: string | null
  color: string | null
  size: string | null
  qty: number
  uom: string
}

interface Outward {
  id: string
  dcNo: string
  dcDate: string
  processType: string
  partyId: string
  party: { id: string; partyName: string }
  totalQty: number
  status: string
  items: OutwardItem[]
}

interface InwardItem {
  slNo: number
  bundleNo: string
  lotNo: string
  styleNo: string
  styleRef: string
  part: string
  color: string
  size: string
  goodQty: number
  defectQty: number
  uom: string
  outwardDcNo: string
}

interface Inward {
  id: string
  dcNo: string
  dcDate: string
  processType: string
  partyId: string
  party: { id: string; partyName: string }
  pdcNo: string | null
  pdcDate: string | null
  narration: string | null
  vehicleNo: string | null
  totalQty: number
  items: InwardItem[]
}

interface Party {
  id: string
  partyName: string
}

// ---- Component ----

export default function GarmentProcessInwardPage() {
  const [view, setView] = React.useState<"list" | "form">("list")
  const [inwards, setInwards] = React.useState<Inward[]>([])
  const [parties, setParties] = React.useState<Party[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Form state
  const [form, setForm] = React.useState({
    dcNo: "",
    dcDate: format(new Date(), "yyyy-MM-dd"),
    processType: "",
    partyId: "",
    pdcNo: "",
    pdcDate: "",
    narration: "",
    vehicleNo: "",
  })
  const [items, setItems] = React.useState<InwardItem[]>([])

  // Outward DCs for selected party
  const [partyOutwards, setPartyOutwards] = React.useState<Outward[]>([])
  const [selectedOutwardIds, setSelectedOutwardIds] = React.useState<
    Set<string>
  >(new Set())

  // Fetch data
  const fetchInwards = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/garment/process-inward")
      if (res.ok) setInwards(await res.json())
    } catch (err) {
      console.error("Failed to fetch inwards:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchParties = React.useCallback(async () => {
    try {
      const res = await fetch("/api/parties?type=Job Worker")
      if (res.ok) setParties(await res.json())
    } catch (err) {
      console.error("Failed to fetch parties:", err)
    }
  }, [])

  React.useEffect(() => {
    fetchInwards()
    fetchParties()
  }, [fetchInwards, fetchParties])

  // Generate DC No
  const generateDcNo = React.useCallback(() => {
    const year = new Date().getFullYear().toString().slice(2)
    const count = inwards.length + 1
    return `GIN-${year}-${String(count).padStart(4, "0")}`
  }, [inwards.length])

  // When party changes, fetch their open outward DCs
  const handlePartyChange = async (partyId: string) => {
    setForm((prev) => ({ ...prev, partyId }))
    setSelectedOutwardIds(new Set())
    setItems([])

    if (!partyId) {
      setPartyOutwards([])
      return
    }

    try {
      const res = await fetch(
        `/api/garment/process-outward?partyId=${partyId}&status=Open`
      )
      if (res.ok) {
        const data: Outward[] = await res.json()
        setPartyOutwards(data)
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, processType: data[0].processType }))
        }
      }
    } catch (err) {
      console.error("Failed to fetch outwards for party:", err)
    }
  }

  // Toggle outward DC selection
  const handleToggleOutward = (outwardId: string, checked: boolean) => {
    setSelectedOutwardIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(outwardId)
      else next.delete(outwardId)
      return next
    })
  }

  // Build items from selected outward DCs
  React.useEffect(() => {
    const selectedOutwards = partyOutwards.filter((o) =>
      selectedOutwardIds.has(o.id)
    )

    let slNo = 0
    const newItems: InwardItem[] = []
    for (const outward of selectedOutwards) {
      if (outward.processType && !form.processType) {
        setForm((prev) => ({ ...prev, processType: outward.processType }))
      }
      for (const item of outward.items) {
        slNo++
        newItems.push({
          slNo,
          bundleNo: item.bundleNo || "",
          lotNo: item.lotNo || "",
          styleNo: item.styleNo || "",
          styleRef: item.styleRef || "",
          part: item.part || "",
          color: item.color || "",
          size: item.size || "",
          goodQty: item.qty,
          defectQty: 0,
          uom: item.uom || "Pcs",
          outwardDcNo: outward.dcNo,
        })
      }
    }
    setItems(newItems)
  }, [selectedOutwardIds, partyOutwards, form.processType])

  const handleItemChange = (
    index: number,
    field: "goodQty" | "defectQty",
    value: number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const totalGoodQty = items.reduce(
    (sum, item) => sum + Number(item.goodQty || 0),
    0
  )
  const totalDefectQty = items.reduce(
    (sum, item) => sum + Number(item.defectQty || 0),
    0
  )

  const handleNewInward = () => {
    setForm({
      dcNo: generateDcNo(),
      dcDate: format(new Date(), "yyyy-MM-dd"),
      processType: "",
      partyId: "",
      pdcNo: "",
      pdcDate: "",
      narration: "",
      vehicleNo: "",
    })
    setItems([])
    setPartyOutwards([])
    setSelectedOutwardIds(new Set())
    setView("form")
  }

  const handleSave = async () => {
    if (!form.processType || !form.partyId) {
      alert("Process Type and Party are required")
      return
    }
    try {
      setSaving(true)
      const payload = {
        ...form,
        totalQty: totalGoodQty + totalDefectQty,
        items: items.filter(
          (item) => item.goodQty > 0 || item.defectQty > 0
        ),
      }

      const res = await fetch("/api/garment/process-inward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await fetchInwards()
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

  // Filtered list
  const filteredInwards = React.useMemo(() => {
    if (!search) return inwards
    const s = search.toLowerCase()
    return inwards.filter(
      (i) =>
        i.dcNo.toLowerCase().includes(s) ||
        i.party.partyName.toLowerCase().includes(s) ||
        i.processType.toLowerCase().includes(s)
    )
  }, [inwards, search])

  // ---- Render ----

  if (view === "form") {
    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView("list")}>
            <ChevronLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              New Garment Process Inward
            </h1>
            <p className="text-sm text-muted-foreground">
              DC No: {form.dcNo}
            </p>
          </div>
        </div>

        {/* Form fields */}
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
                <Label htmlFor="partyId">Party *</Label>
                <Select
                  value={form.partyId}
                  onValueChange={(v) => v && handlePartyChange(v)}
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
                <Label htmlFor="processType">Process Type</Label>
                <Input
                  id="processType"
                  value={form.processType}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdcNo">PDC No</Label>
                <Input
                  id="pdcNo"
                  value={form.pdcNo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, pdcNo: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdcDate">PDC Date</Label>
                <Input
                  id="pdcDate"
                  type="date"
                  value={form.pdcDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, pdcDate: e.target.value }))
                  }
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
            </div>
          </CardContent>
        </Card>

        {/* Select Outward DCs */}
        {form.partyId && partyOutwards.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Select Outward DCs to receive against
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {partyOutwards.map((outward) => (
                  <label
                    key={outward.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedOutwardIds.has(outward.id)}
                      onCheckedChange={(checked) =>
                        handleToggleOutward(outward.id, !!checked)
                      }
                    />
                    <div className="flex-1 flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-medium">{outward.dcNo}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(outward.dcDate), "dd MMM yyyy")}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {outward.processType}
                      </Badge>
                      <span className="text-muted-foreground">
                        Qty: {outward.totalQty}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {form.partyId && partyOutwards.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No open outward DCs found for this party
            </CardContent>
          </Card>
        )}

        {/* Items Table */}
        {items.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Inward Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Sl</TableHead>
                      <TableHead>DC No</TableHead>
                      <TableHead>Bundle No</TableHead>
                      <TableHead>Lot No</TableHead>
                      <TableHead>Style No</TableHead>
                      <TableHead>Style Ref</TableHead>
                      <TableHead>Part</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right min-w-[90px]">
                        Good Qty
                      </TableHead>
                      <TableHead className="text-right min-w-[90px]">
                        Defect Qty
                      </TableHead>
                      <TableHead>UOM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-center text-muted-foreground">
                          {item.slNo}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.outwardDcNo}
                        </TableCell>
                        <TableCell>{item.bundleNo}</TableCell>
                        <TableCell>{item.lotNo}</TableCell>
                        <TableCell>{item.styleNo}</TableCell>
                        <TableCell>{item.styleRef}</TableCell>
                        <TableCell>{item.part}</TableCell>
                        <TableCell>{item.color}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.goodQty || ""}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "goodQty",
                                Number(e.target.value)
                              )
                            }
                            className="h-8 text-sm text-right w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.defectQty || ""}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "defectQty",
                                Number(e.target.value)
                              )
                            }
                            className="h-8 text-sm text-right w-20"
                          />
                        </TableCell>
                        <TableCell>{item.uom}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="narration">Narration / Remarks</Label>
                <Textarea
                  id="narration"
                  value={form.narration}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, narration: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                <div className="flex gap-6">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Total Good Qty
                    </span>
                    <p className="text-lg font-bold text-green-600">
                      {totalGoodQty}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Total Defect Qty
                    </span>
                    <p className="text-lg font-bold text-red-600">
                      {totalDefectQty}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Grand Total
                    </span>
                    <p className="text-lg font-bold">
                      {totalGoodQty + totalDefectQty}
                    </p>
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
            Garment Process Inward
          </h1>
          <p className="text-sm text-muted-foreground">
            Receive goods back from garment process contractors
          </p>
        </div>
        <Button onClick={handleNewInward}>
          <Plus className="size-4 mr-1" />
          New Inward
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search DC, party..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              Loading...
            </div>
          ) : filteredInwards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <PackageCheck className="size-10 mb-3 opacity-40" />
              <p>No inward records found</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleNewInward}
              >
                <Plus className="size-4 mr-1" />
                Create First Inward
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
                  <TableHead>PDC No</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInwards.map((inward) => (
                  <TableRow key={inward.id}>
                    <TableCell className="font-medium">
                      {inward.dcNo}
                    </TableCell>
                    <TableCell>
                      {format(new Date(inward.dcDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {inward.processType}
                      </Badge>
                    </TableCell>
                    <TableCell>{inward.party.partyName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {inward.pdcNo || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {inward.totalQty}
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
