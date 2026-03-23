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
  Trash2,
  Eye,
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
  CardDescription,
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

interface OutwardItem {
  id?: string;
  slNo: number;
  lotNo: string;
  styleNo: string;
  counts: string;
  yarnType: string;
  millName: string;
  color: string;
  dyeColor: string;
  noOfBags: number;
  stockQty: number;
  issueKgs: number;
  uom: string;
  rate: number;
  amount: number;
}

interface Party {
  id: string;
  partyName: string;
  partyType: string;
}

interface Store {
  id: string;
  storeName: string;
}

interface OutwardRecord {
  id: string;
  dcNo: string;
  dcDate: string;
  processType: string;
  storeId: string | null;
  partyId: string;
  party: Party;
  targetDate: string | null;
  type: string;
  narration: string | null;
  vehicleNo: string | null;
  transport: string | null;
  ourTeam: string | null;
  totalQty: number;
  totalBags: number;
  otherCharges: number;
  totalAmount: number;
  gstAmount: number;
  roundOff: number;
  netAmount: number;
  status: string;
  items: OutwardItem[];
}

// --------------- Constants ---------------

const PROCESS_TYPES = ["All", "Dyeing", "Winding", "Twisting", "Knitting"];
const STATUS_OPTIONS = ["All", "Open", "Partial", "Closed"];
const TYPE_OPTIONS = ["Fresh", "Re-work(F)", "Re-Process(C)"];
const UOM_OPTIONS = ["Kgs", "Nos", "Pcs"];

function emptyItem(slNo: number): OutwardItem {
  return {
    slNo,
    lotNo: "",
    styleNo: "",
    counts: "",
    yarnType: "",
    millName: "",
    color: "",
    dyeColor: "",
    noOfBags: 0,
    stockQty: 0,
    issueKgs: 0,
    uom: "Kgs",
    rate: 0,
    amount: 0,
  };
}

// --------------- Date Picker Component ---------------

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

export default function YarnProcessOutwardPage() {
  const [view, setView] = React.useState<"list" | "form">("list");
  const [records, setRecords] = React.useState<OutwardRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // List filters
  const [processFilter, setProcessFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Master data
  const [parties, setParties] = React.useState<Party[]>([]);
  const [stores, setStores] = React.useState<Store[]>([]);

  // Form state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [dcNo, setDcNo] = React.useState("(Auto)");
  const [dcDate, setDcDate] = React.useState<Date | undefined>(new Date());
  const [processType, setProcessType] = React.useState("Dyeing");
  const [storeId, setStoreId] = React.useState("");
  const [partyId, setPartyId] = React.useState("");
  const [partySearch, setPartySearch] = React.useState("");
  const [targetDate, setTargetDate] = React.useState<Date | undefined>();
  const [type, setType] = React.useState("Fresh");
  const [items, setItems] = React.useState<OutwardItem[]>([emptyItem(1)]);
  const [narration, setNarration] = React.useState("");
  const [vehicleNo, setVehicleNo] = React.useState("");
  const [transport, setTransport] = React.useState("");
  const [ourTeam, setOurTeam] = React.useState("");
  const [otherCharges, setOtherCharges] = React.useState(0);
  const [footerTab, setFooterTab] = React.useState("others");

  // --------------- Data fetching ---------------

  const fetchRecords = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (processFilter !== "All") params.set("processType", processFilter);
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/yarn/process-outward?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecords(data);
    } catch {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [processFilter, statusFilter, searchQuery]);

  React.useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  React.useEffect(() => {
    fetch("/api/parties?type=Job Worker")
      .then((r) => r.json())
      .then(setParties)
      .catch(() => {});
    fetch("/api/stores")
      .then((r) => r.json())
      .then(setStores)
      .catch(() => {});
  }, []);

  // --------------- Form helpers ---------------

  const resetForm = () => {
    setEditingId(null);
    setDcNo("(Auto)");
    setDcDate(new Date());
    setProcessType("Dyeing");
    setStoreId("");
    setPartyId("");
    setPartySearch("");
    setTargetDate(undefined);
    setType("Fresh");
    setItems([emptyItem(1)]);
    setNarration("");
    setVehicleNo("");
    setTransport("");
    setOurTeam("");
    setOtherCharges(0);
    setFooterTab("others");
  };

  const openNewForm = () => {
    resetForm();
    setView("form");
  };

  const openEditForm = (record: OutwardRecord) => {
    setEditingId(record.id);
    setDcNo(record.dcNo);
    setDcDate(new Date(record.dcDate));
    setProcessType(record.processType);
    setStoreId(record.storeId || "");
    setPartyId(record.partyId);
    setTargetDate(record.targetDate ? new Date(record.targetDate) : undefined);
    setType(record.type);
    setItems(
      record.items.length > 0
        ? record.items.map((it, i) => ({ ...it, slNo: i + 1 }))
        : [emptyItem(1)]
    );
    setNarration(record.narration || "");
    setVehicleNo(record.vehicleNo || "");
    setTransport(record.transport || "");
    setOurTeam(record.ourTeam || "");
    setOtherCharges(record.otherCharges);
    setView("form");
  };

  const updateItem = (index: number, field: keyof OutwardItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      // Auto-calculate amount
      if (field === "issueKgs" || field === "rate") {
        const kgs = field === "issueKgs" ? Number(value) : item.issueKgs;
        const rate = field === "rate" ? Number(value) : item.rate;
        item.amount = Math.round(kgs * rate * 100) / 100;
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

  // Computed totals
  const totalQty = items.reduce((s, i) => s + (Number(i.issueKgs) || 0), 0);
  const totalBags = items.reduce((s, i) => s + (Number(i.noOfBags) || 0), 0);
  const totalAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const gstAmount = Math.round(totalAmount * 0.05 * 100) / 100; // 5% GST placeholder
  const roundOff =
    Math.round(totalAmount + otherCharges + gstAmount) -
    (totalAmount + otherCharges + gstAmount);
  const netAmount =
    Math.round((totalAmount + otherCharges + gstAmount + roundOff) * 100) / 100;

  // --------------- Save ---------------

  const handleSave = async () => {
    if (!partyId) {
      toast.error("Please select a party");
      return;
    }
    if (!dcDate) {
      toast.error("Please select a date");
      return;
    }
    const validItems = items.filter((it) => it.issueKgs > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item with Issue Kgs");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        dcDate: dcDate.toISOString(),
        processType,
        storeId: storeId || null,
        partyId,
        targetDate: targetDate?.toISOString() || null,
        type,
        narration,
        vehicleNo,
        transport,
        ourTeam,
        otherCharges,
        gstAmount,
        roundOff,
        netAmount,
        items: validItems,
      };

      const url = editingId
        ? `/api/yarn/process-outward/${editingId}`
        : "/api/yarn/process-outward";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      toast.success(editingId ? "DC updated successfully" : "DC created successfully");
      setView("list");
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // --------------- Filter parties for searchable dropdown ---------------
  const filteredParties = partySearch
    ? parties.filter((p) =>
        p.partyName.toLowerCase().includes(partySearch.toLowerCase())
      )
    : parties;

  // --------------- Status badge variant ---------------
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

  // =========================================================================
  // RENDER: LIST VIEW
  // =========================================================================

  if (view === "list") {
    return (
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Yarn Process Outward</h1>
            <p className="text-[13px] text-muted-foreground">
              Manage outward delivery challans for yarn processing
            </p>
          </div>
          <Button onClick={openNewForm}>
            <Plus className="mr-1.5 size-4" />
            New DC
          </Button>
        </div>

        {/* Process type tabs */}
        <Tabs defaultValue="All" onValueChange={(v) => setProcessFilter(v as string)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              {PROCESS_TYPES.map((pt) => (
                <TabsTrigger key={pt} value={pt}>
                  {pt}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search DC / Party..."
                  className="pl-8 w-[220px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status filter */}
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v ?? "")}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table content area (all tabs show same table with filter applied) */}
          {PROCESS_TYPES.map((pt) => (
            <TabsContent key={pt} value={pt}>
              {/* Content rendered below outside tabs */}
            </TabsContent>
          ))}
        </Tabs>

        {/* Records table */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">DC No</TableHead>
                  <TableHead className="text-[11px]">Date</TableHead>
                  <TableHead className="text-[11px]">Process</TableHead>
                  <TableHead className="text-[11px]">Party</TableHead>
                  <TableHead className="text-[11px]">Type</TableHead>
                  <TableHead className="text-[11px] text-right">Total Qty</TableHead>
                  <TableHead className="text-[11px] text-right">Net Amount</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                  <TableHead className="text-[11px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <FileText className="mx-auto mb-2 size-8 opacity-50" />
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((rec) => (
                    <TableRow
                      key={rec.id}
                      className="cursor-pointer"
                      onClick={() => openEditForm(rec)}
                    >
                      <TableCell className="text-[13px] font-medium">{rec.dcNo}</TableCell>
                      <TableCell className="text-[13px]">{format(new Date(rec.dcDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-[13px]">{rec.processType}</TableCell>
                      <TableCell className="text-[13px]">{rec.party?.partyName}</TableCell>
                      <TableCell className="text-[13px]">{rec.type}</TableCell>
                      <TableCell className="text-[13px] text-right">
                        {rec.totalQty.toFixed(2)}
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
                        <div className="flex items-center justify-end gap-1">
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
                        </div>
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
  // RENDER: FORM VIEW
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Form header */}
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
            {editingId ? `Edit DC - ${dcNo}` : "New Outward DC"}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Yarn process outward delivery challan
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
          <CardTitle>DC Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
            {/* DC No */}
            <div className="space-y-1">
              <Label className="text-[13px]">DC No</Label>
              <Input value={dcNo} disabled className="bg-muted/50" />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <Label className="text-[13px]">Date</Label>
              <DatePicker value={dcDate} onChange={setDcDate} />
            </div>

            {/* Process Type */}
            <div className="space-y-1">
              <Label className="text-[13px]">Process Type</Label>
              <Select value={processType} onValueChange={(v) => setProcessType(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Dyeing", "Winding", "Twisting", "Knitting"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Store */}
            <div className="space-y-1">
              <Label className="text-[13px]">Store</Label>
              <Select value={storeId} onValueChange={(v) => setStoreId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select store" />
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

            {/* Party (searchable) */}
            <div className="space-y-1 col-span-2 md:col-span-1">
              <Label className="text-[13px]">Party (Job Worker)</Label>
              <Select value={partyId} onValueChange={(v) => setPartyId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-1 pb-0">
                    <Input
                      placeholder="Search party..."
                      className="h-7 text-xs"
                      value={partySearch}
                      onChange={(e) => setPartySearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredParties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.partyName}
                    </SelectItem>
                  ))}
                  {filteredParties.length === 0 && (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                      No parties found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Target Date */}
            <div className="space-y-1">
              <Label className="text-[13px]">Target Date</Label>
              <DatePicker value={targetDate} onChange={setTargetDate} />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <Label className="text-[13px]">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items grid - Excel-like */}
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
                  <TableHead className="min-w-[90px]">Dye Color</TableHead>
                  <TableHead className="min-w-[70px] text-right">Bags</TableHead>
                  <TableHead className="min-w-[80px] text-right">Stock Qty</TableHead>
                  <TableHead className="min-w-[80px] text-right">Issue Kgs</TableHead>
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
                        tabIndex={0}
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
                        className="h-7 text-xs"
                        value={item.dyeColor}
                        onChange={(e) => updateItem(idx, "dyeColor", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        className="h-7 text-xs text-right"
                        value={item.noOfBags || ""}
                        onChange={(e) =>
                          updateItem(idx, "noOfBags", parseInt(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        className="h-7 text-xs text-right"
                        value={item.stockQty || ""}
                        onChange={(e) =>
                          updateItem(idx, "stockQty", parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        className="h-7 text-xs text-right font-medium"
                        value={item.issueKgs || ""}
                        onChange={(e) =>
                          updateItem(idx, "issueKgs", parseFloat(e.target.value) || 0)
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
                          {UOM_OPTIONS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
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
                  <TableCell colSpan={8} className="text-right font-medium">
                    Totals
                  </TableCell>
                  <TableCell className="text-right font-medium">{totalBags}</TableCell>
                  <TableCell />
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

      {/* Footer section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Others / GST tabs */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white">
          <CardContent className="pt-4">
            <Tabs defaultValue="others" onValueChange={(v) => setFooterTab(v as string)}>
              <TabsList>
                <TabsTrigger value="others">Others</TabsTrigger>
                <TabsTrigger value="gst">GST</TabsTrigger>
              </TabsList>
              <TabsContent value="others">
                <div className="mt-3 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[13px]">Narration</Label>
                    <Textarea
                      placeholder="Enter remarks / narration..."
                      value={narration}
                      onChange={(e) => setNarration(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[13px]">Vehicle No</Label>
                      <Input
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value)}
                        placeholder="TN 01 AB 1234"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[13px]">Transport</Label>
                      <Input
                        value={transport}
                        onChange={(e) => setTransport(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[13px]">Our Team</Label>
                      <Input
                        value={ourTeam}
                        onChange={(e) => setOurTeam(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="gst">
                <div className="mt-3 text-sm text-muted-foreground">
                  <p>GST calculations are auto-applied at 5% on the total amount.</p>
                  <p className="mt-1">
                    CGST: {(gstAmount / 2).toFixed(2)} | SGST:{" "}
                    {(gstAmount / 2).toFixed(2)}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Summary */}
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
                <span className="text-muted-foreground">Total Bags</span>
                <span className="font-medium">{totalBags}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Other Charges</span>
                <Input
                  type="number"
                  className="h-7 w-24 text-right text-xs"
                  value={otherCharges || ""}
                  onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST Amount</span>
                <span>{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Round Off</span>
                <span>{roundOff.toFixed(2)}</span>
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
