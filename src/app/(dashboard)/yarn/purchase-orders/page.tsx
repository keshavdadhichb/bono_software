"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Plus,
  Save,
  X,
  ArrowLeft,
  Search,
  FileText,
  Pencil,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// --------------- Types ---------------

interface POItem {
  slNo: number;
  lotNo: string;
  styleNo: string;
  counts: string;
  yarnType: string;
  millName: string;
  color: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
}

interface Party {
  id: string;
  partyName: string;
}

interface PORecord {
  id: string;
  poNo: string;
  poDate: string;
  partyId: string;
  party: Party;
  narration: string | null;
  totalQty: number;
  totalAmount: number;
  gstAmount: number;
  netAmount: number;
  status: string;
  items: POItem[];
}

// --------------- Constants ---------------

const STATUS_OPTIONS = ["All", "Open", "Partial", "Closed"];

function emptyItem(slNo: number): POItem {
  return {
    slNo,
    lotNo: "",
    styleNo: "",
    counts: "",
    yarnType: "",
    millName: "",
    color: "",
    qty: 0,
    uom: "Kgs",
    rate: 0,
    amount: 0,
  };
}

// --------------- Date Picker ---------------

function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        {value ? format(value, "dd/MM/yyyy") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// --------------- Main Page ---------------

export default function YarnPurchaseOrdersPage() {
  const [view, setView] = React.useState<"list" | "form">("list");
  const [records, setRecords] = React.useState<PORecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Master data
  const [parties, setParties] = React.useState<Party[]>([]);

  // Form state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [poNo, setPoNo] = React.useState("(Auto)");
  const [poDate, setPoDate] = React.useState<Date | undefined>(new Date());
  const [partyId, setPartyId] = React.useState("");
  const [narration, setNarration] = React.useState("");
  const [items, setItems] = React.useState<POItem[]>([emptyItem(1)]);

  // --------------- Data fetching ---------------

  const fetchRecords = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/yarn/purchase-orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setRecords(await res.json());
    } catch {
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  React.useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  React.useEffect(() => {
    fetch("/api/parties?type=Supplier")
      .then((r) => r.json())
      .then(setParties)
      .catch(() => {});
  }, []);

  // --------------- Form helpers ---------------

  const resetForm = () => {
    setEditingId(null);
    setPoNo("(Auto)");
    setPoDate(new Date());
    setPartyId("");
    setNarration("");
    setItems([emptyItem(1)]);
  };

  const openNewForm = () => {
    resetForm();
    setView("form");
  };

  const openEditForm = (record: PORecord) => {
    setEditingId(record.id);
    setPoNo(record.poNo);
    setPoDate(new Date(record.poDate));
    setPartyId(record.partyId);
    setNarration(record.narration || "");
    setItems(
      record.items.length > 0
        ? record.items.map((it, i) => ({ ...it, slNo: i + 1 }))
        : [emptyItem(1)]
    );
    setView("form");
  };

  const updateItem = (index: number, field: keyof POItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === "qty" || field === "rate") {
        const qty = field === "qty" ? Number(value) : item.qty;
        const rate = field === "rate" ? Number(value) : item.rate;
        item.amount = Math.round(qty * rate * 100) / 100;
      }
      next[index] = item;
      return next;
    });
  };

  const addRow = () => {
    setItems((prev) => [...prev, emptyItem(prev.length + 1)]);
  };

  const removeRow = (index: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index).map((it, i) => ({ ...it, slNo: i + 1 }));
    });
  };

  // Computed
  const totalQty = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const totalAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const gstAmount = Math.round(totalAmount * 0.05 * 100) / 100;
  const netAmount = Math.round((totalAmount + gstAmount) * 100) / 100;

  // Status badge
  const statusVariant = (status: string) => {
    switch (status) {
      case "Open":
        return "outline" as const;
      case "Partial":
        return "secondary" as const;
      case "Closed":
        return "default" as const;
      default:
        return "outline" as const;
    }
  };

  // --------------- Save ---------------

  const handleSave = async () => {
    if (!partyId) {
      toast.error("Please select a party");
      return;
    }
    if (!poDate) {
      toast.error("Please select a date");
      return;
    }
    const validItems = items.filter((it) => it.qty > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item with quantity");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        poDate: poDate.toISOString(),
        partyId,
        narration,
        gstAmount,
        netAmount,
        items: validItems,
      };

      const res = await fetch("/api/yarn/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      toast.success("Purchase order created successfully");
      setView("list");
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // LIST VIEW
  // =========================================================================

  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Yarn Purchase Orders</h1>
            <p className="text-[13px] text-muted-foreground">
              Manage yarn purchase orders
            </p>
          </div>
          <Button onClick={openNewForm}>
            <Plus className="mr-1.5 size-4" />
            New PO
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultValue="All" onValueChange={(v) => setStatusFilter(v as string)}>
            <TabsList>
              {STATUS_OPTIONS.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {s}
                </TabsTrigger>
              ))}
            </TabsList>
            {STATUS_OPTIONS.map((s) => (
              <TabsContent key={s} value={s} />
            ))}
          </Tabs>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search PO / Party..."
              className="pl-8 w-[220px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">PO No</TableHead>
                  <TableHead className="text-[11px]">Date</TableHead>
                  <TableHead className="text-[11px]">Party</TableHead>
                  <TableHead className="text-[11px] text-right">Total Qty</TableHead>
                  <TableHead className="text-[11px] text-right">Total Amount</TableHead>
                  <TableHead className="text-[11px] text-right">Net Amount</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                  <TableHead className="text-[11px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <FileText className="mx-auto mb-2 size-8 opacity-50" />
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((rec) => (
                    <TableRow
                      key={rec.id}
                      className="cursor-pointer"
                      onClick={() => openEditForm(rec)}
                    >
                      <TableCell className="text-[13px] font-medium">{rec.poNo}</TableCell>
                      <TableCell className="text-[13px]">
                        {format(new Date(rec.poDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-[13px]">{rec.party?.partyName}</TableCell>
                      <TableCell className="text-[13px] text-right">
                        {rec.totalQty.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-[13px] text-right">
                        {rec.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-[13px] text-right">
                        {rec.netAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(rec.status)}>
                          {rec.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm(rec);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // FORM VIEW
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setView("list");
            resetForm();
          }}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {editingId ? `Edit PO - ${poNo}` : "New Purchase Order"}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Yarn purchase order details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setView("list");
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-1.5 size-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Header fields */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle>PO Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>PO No</Label>
              <Input value={poNo} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <DatePicker value={poDate} onChange={setPoDate} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Party (Supplier)</Label>
              <Select value={partyId} onValueChange={(v) => setPartyId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select supplier" />
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
          </div>
        </CardContent>
      </Card>

      {/* Items grid */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1 size-3.5" />
              Add Row
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-12 text-center">Sl</TableHead>
                  <TableHead className="min-w-[100px]">Lot No</TableHead>
                  <TableHead className="min-w-[100px]">Style No</TableHead>
                  <TableHead className="min-w-[90px]">Counts</TableHead>
                  <TableHead className="min-w-[100px]">Yarn Type</TableHead>
                  <TableHead className="min-w-[90px]">Mill</TableHead>
                  <TableHead className="min-w-[90px]">Color</TableHead>
                  <TableHead className="min-w-[80px] text-right">Qty</TableHead>
                  <TableHead className="min-w-[65px]">UOM</TableHead>
                  <TableHead className="min-w-[80px] text-right">Rate</TableHead>
                  <TableHead className="min-w-[90px] text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx} className="group">
                    <TableCell className="text-center text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-7 text-xs"
                        value={item.lotNo}
                        onChange={(e) => updateItem(idx, "lotNo", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-7 text-xs"
                        value={item.styleNo}
                        onChange={(e) => updateItem(idx, "styleNo", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-7 text-xs"
                        value={item.counts}
                        onChange={(e) => updateItem(idx, "counts", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-7 text-xs"
                        value={item.yarnType}
                        onChange={(e) => updateItem(idx, "yarnType", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-7 text-xs"
                        value={item.millName}
                        onChange={(e) => updateItem(idx, "millName", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-7 text-xs"
                        value={item.color}
                        onChange={(e) => updateItem(idx, "color", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        className="h-7 text-xs text-right font-medium"
                        value={item.qty || ""}
                        onChange={(e) =>
                          updateItem(idx, "qty", parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Select
                        value={item.uom}
                        onValueChange={(v) => updateItem(idx, "uom", v as string)}
                      >
                        <SelectTrigger className="h-7 w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kgs">Kgs</SelectItem>
                          <SelectItem value="Nos">Nos</SelectItem>
                          <SelectItem value="Pcs">Pcs</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        className="h-7 text-xs text-right"
                        value={item.rate || ""}
                        onChange={(e) =>
                          updateItem(idx, "rate", parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1 text-right font-medium text-xs">
                      {item.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => removeRow(idx)}
                      >
                        <X className="size-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className="text-right font-medium">
                    Totals
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {totalQty.toFixed(2)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right font-medium">
                    {totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white">
          <CardContent className="pt-4">
            <div className="space-y-1">
              <Label>Narration</Label>
              <Textarea
                placeholder="Enter remarks..."
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Qty</span>
                <span className="font-medium">{totalQty.toFixed(2)} Kgs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (5%)</span>
                <span>{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Net Amount</span>
                <span className="text-base font-bold">{netAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
