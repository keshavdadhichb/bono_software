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
  Download,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// --------------- Types ---------------

interface InwardItem {
  slNo: number;
  outwardDcNo: string;
  lotNo: string;
  styleNo: string;
  counts: string;
  yarnType: string;
  issueColor: string;
  recColor: string;
  balQty: number;
  recQty: number;
  uom: string;
  rate: number;
  amount: number;
}

interface Party {
  id: string;
  partyName: string;
}

interface Store {
  id: string;
  storeName: string;
}

interface OutwardDC {
  id: string;
  dcNo: string;
  dcDate: string;
  processType: string;
  totalQty: number;
  status: string;
  party: Party;
  items: Array<{
    lotNo?: string;
    styleNo?: string;
    counts?: string;
    yarnType?: string;
    color?: string;
    dyeColor?: string;
    issueKgs: number;
    rate: number;
    uom: string;
  }>;
}

interface InwardRecord {
  id: string;
  dcNo: string;
  dcDate: string;
  processType: string;
  partyId: string;
  party: Party;
  outwardId: string | null;
  outward: OutwardDC | null;
  pdcNo: string | null;
  pdcDate: string | null;
  isPartReceipt: boolean;
  narration: string | null;
  vehicleNo: string | null;
  transport: string | null;
  totalQty: number;
  otherCharges: number;
  totalAmount: number;
  gstAmount: number;
  netAmount: number;
  items: InwardItem[];
}

// --------------- Constants ---------------

const PROCESS_TYPES = ["All", "Dyeing", "Winding", "Twisting", "Knitting"];

function emptyItem(slNo: number): InwardItem {
  return {
    slNo,
    outwardDcNo: "",
    lotNo: "",
    styleNo: "",
    counts: "",
    yarnType: "",
    issueColor: "",
    recColor: "",
    balQty: 0,
    recQty: 0,
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

export default function YarnProcessInwardPage() {
  const [view, setView] = React.useState<"list" | "form">("list");
  const [records, setRecords] = React.useState<InwardRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Filters
  const [processFilter, setProcessFilter] = React.useState("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Master data
  const [parties, setParties] = React.useState<Party[]>([]);
  const [stores, setStores] = React.useState<Store[]>([]);

  // DC selection dialog
  const [dcDialogOpen, setDcDialogOpen] = React.useState(false);
  const [openDCs, setOpenDCs] = React.useState<OutwardDC[]>([]);
  const [loadingDCs, setLoadingDCs] = React.useState(false);

  // Form state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [dcNo, setDcNo] = React.useState("(Auto)");
  const [dcDate, setDcDate] = React.useState<Date | undefined>(new Date());
  const [processType, setProcessType] = React.useState("Dyeing");
  const [storeId, setStoreId] = React.useState("");
  const [partyId, setPartyId] = React.useState("");
  const [outwardId, setOutwardId] = React.useState<string | null>(null);
  const [pdcNo, setPdcNo] = React.useState("");
  const [pdcDate, setPdcDate] = React.useState<Date | undefined>();
  const [isPartReceipt, setIsPartReceipt] = React.useState(false);
  const [items, setItems] = React.useState<InwardItem[]>([emptyItem(1)]);
  const [narration, setNarration] = React.useState("");
  const [vehicleNo, setVehicleNo] = React.useState("");
  const [transport, setTransport] = React.useState("");
  const [otherCharges, setOtherCharges] = React.useState(0);

  // --------------- Data fetching ---------------

  const fetchRecords = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (processFilter !== "All") params.set("processType", processFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/yarn/process-inward?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setRecords(await res.json());
    } catch {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [processFilter, searchQuery]);

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
    setOutwardId(null);
    setPdcNo("");
    setPdcDate(undefined);
    setIsPartReceipt(false);
    setItems([emptyItem(1)]);
    setNarration("");
    setVehicleNo("");
    setTransport("");
    setOtherCharges(0);
  };

  const openNewForm = () => {
    resetForm();
    setView("form");
  };

  const openEditForm = (record: InwardRecord) => {
    setEditingId(record.id);
    setDcNo(record.dcNo);
    setDcDate(new Date(record.dcDate));
    setProcessType(record.processType);
    setPartyId(record.partyId);
    setOutwardId(record.outwardId);
    setPdcNo(record.pdcNo || "");
    setPdcDate(record.pdcDate ? new Date(record.pdcDate) : undefined);
    setIsPartReceipt(record.isPartReceipt);
    setItems(
      record.items.length > 0
        ? record.items.map((it, i) => ({ ...it, slNo: i + 1 }))
        : [emptyItem(1)]
    );
    setNarration(record.narration || "");
    setVehicleNo(record.vehicleNo || "");
    setTransport(record.transport || "");
    setOtherCharges(record.otherCharges);
    setView("form");
  };

  // Load open DCs for selected party
  const loadOpenDCs = async () => {
    if (!partyId) {
      toast.error("Please select a party first");
      return;
    }
    setLoadingDCs(true);
    setDcDialogOpen(true);
    try {
      const params = new URLSearchParams({ partyId, status: "Open" });
      const res = await fetch(`/api/yarn/process-outward?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      // Also fetch Partial status
      const res2 = await fetch(
        `/api/yarn/process-outward?${new URLSearchParams({ partyId, status: "Partial" })}`
      );
      const data2 = res2.ok ? await res2.json() : [];
      setOpenDCs([...data, ...data2]);
    } catch {
      toast.error("Failed to load outward DCs");
    } finally {
      setLoadingDCs(false);
    }
  };

  // Select an outward DC and populate items
  const selectOutwardDC = (dc: OutwardDC) => {
    setOutwardId(dc.id);
    setProcessType(dc.processType);
    const newItems: InwardItem[] = dc.items.map((item, idx) => ({
      slNo: idx + 1,
      outwardDcNo: dc.dcNo,
      lotNo: item.lotNo || "",
      styleNo: item.styleNo || "",
      counts: item.counts || "",
      yarnType: item.yarnType || "",
      issueColor: item.color || "",
      recColor: item.dyeColor || item.color || "",
      balQty: item.issueKgs, // Balance = issued (simplification)
      recQty: 0,
      uom: item.uom || "Kgs",
      rate: item.rate || 0,
      amount: 0,
    }));
    setItems(newItems.length > 0 ? newItems : [emptyItem(1)]);
    setDcDialogOpen(false);
  };

  const updateItem = (index: number, field: keyof InwardItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === "recQty" || field === "rate") {
        const qty = field === "recQty" ? Number(value) : item.recQty;
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
  const totalQty = items.reduce((s, i) => s + (Number(i.recQty) || 0), 0);
  const totalAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const gstAmount = Math.round(totalAmount * 0.05 * 100) / 100;
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
    const validItems = items.filter((it) => it.recQty > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item with Rec Qty");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        dcDate: dcDate.toISOString(),
        processType,
        storeId: storeId || null,
        partyId,
        outwardId,
        pdcNo: pdcNo || null,
        pdcDate: pdcDate?.toISOString() || null,
        isPartReceipt,
        narration,
        vehicleNo,
        transport,
        otherCharges,
        gstAmount,
        roundOff,
        netAmount,
        items: validItems,
      };

      const res = await fetch("/api/yarn/process-inward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      toast.success("Inward DC created successfully");
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Yarn Process Inward</h1>
            <p className="text-sm text-muted-foreground">
              Receive yarn back from processing
            </p>
          </div>
          <Button onClick={openNewForm}>
            <Plus className="mr-1.5 size-4" />
            New Inward
          </Button>
        </div>

        <Tabs defaultValue="All" onValueChange={(v) => setProcessFilter(v as string)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              {PROCESS_TYPES.map((pt) => (
                <TabsTrigger key={pt} value={pt}>
                  {pt}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search DC / Party..."
                className="pl-8 w-[220px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {PROCESS_TYPES.map((pt) => (
            <TabsContent key={pt} value={pt} />
          ))}
        </Tabs>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DC No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Outward DC</TableHead>
                  <TableHead>Part Receipt</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="font-medium">{rec.dcNo}</TableCell>
                      <TableCell>
                        {format(new Date(rec.dcDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{rec.processType}</TableCell>
                      <TableCell>{rec.party?.partyName}</TableCell>
                      <TableCell>
                        {rec.outward?.dcNo || "-"}
                      </TableCell>
                      <TableCell>
                        {rec.isPartReceipt ? (
                          <Badge variant="secondary">Part</Badge>
                        ) : (
                          "Full"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {rec.totalQty.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {rec.netAmount.toFixed(2)}
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
    <div className="space-y-4">
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
          <h1 className="text-xl font-semibold">
            {editingId ? `Edit Inward - ${dcNo}` : "New Inward DC"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Yarn process inward receipt
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
      <Card>
        <CardHeader>
          <CardTitle>Inward Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>DC No</Label>
              <Input value={dcNo} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <DatePicker value={dcDate} onChange={setDcDate} />
            </div>
            <div className="space-y-1">
              <Label>Process Type</Label>
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
            <div className="space-y-1">
              <Label>Store</Label>
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

            {/* Party + Select DC's */}
            <div className="space-y-1">
              <Label>Party (Job Worker)</Label>
              <Select value={partyId} onValueChange={(v) => setPartyId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select party" />
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
            <div className="space-y-1">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={loadOpenDCs}
                disabled={!partyId}
              >
                <Download className="mr-1.5 size-4" />
                Select DC&apos;s
              </Button>
            </div>

            <div className="space-y-1">
              <Label>PDC No</Label>
              <Input
                value={pdcNo}
                onChange={(e) => setPdcNo(e.target.value)}
                placeholder="PDC Number"
              />
            </div>
            <div className="space-y-1">
              <Label>PDC Date</Label>
              <DatePicker value={pdcDate} onChange={setPdcDate} />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Checkbox
              checked={isPartReceipt}
              onCheckedChange={(v) => setIsPartReceipt(v === true)}
            />
            <Label className="cursor-pointer">Part Receipt</Label>
          </div>
        </CardContent>
      </Card>

      {/* DC Selection Dialog */}
      <Dialog open={dcDialogOpen} onOpenChange={setDcDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Outward DC</DialogTitle>
          </DialogHeader>
          {loadingDCs ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : openDCs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No open DCs found for this party
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DC No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Process</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openDCs.map((dc) => (
                    <TableRow key={dc.id}>
                      <TableCell className="font-medium">{dc.dcNo}</TableCell>
                      <TableCell>
                        {format(new Date(dc.dcDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{dc.processType}</TableCell>
                      <TableCell className="text-right">
                        {dc.totalQty.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            dc.status === "Partial" ? "secondary" : "outline"
                          }
                        >
                          {dc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="xs"
                          onClick={() => selectOutwardDC(dc)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      {/* Items grid */}
      <Card>
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
                  <TableHead className="min-w-[100px]">Outward DC</TableHead>
                  <TableHead className="min-w-[90px]">Lot No</TableHead>
                  <TableHead className="min-w-[90px]">Style No</TableHead>
                  <TableHead className="min-w-[80px]">Counts</TableHead>
                  <TableHead className="min-w-[90px]">Yarn Type</TableHead>
                  <TableHead className="min-w-[90px]">Issue Color</TableHead>
                  <TableHead className="min-w-[90px]">Rec Color</TableHead>
                  <TableHead className="min-w-[80px] text-right">Bal Qty</TableHead>
                  <TableHead className="min-w-[80px] text-right">Rec Qty</TableHead>
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
                        className="h-7 text-xs bg-muted/30"
                        value={item.outwardDcNo}
                        readOnly
                      />
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
                        className="h-7 text-xs bg-muted/30"
                        value={item.issueColor}
                        readOnly
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        className="h-7 text-xs"
                        value={item.recColor}
                        onChange={(e) => updateItem(idx, "recColor", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        className="h-7 text-xs text-right bg-muted/30"
                        value={item.balQty || ""}
                        readOnly
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        className="h-7 text-xs text-right font-medium"
                        value={item.recQty || ""}
                        onChange={(e) =>
                          updateItem(idx, "recQty", parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1 text-xs">{item.uom}</TableCell>
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
                  <TableCell colSpan={9} className="text-right font-medium">
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
        <Card className="lg:col-span-2">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Narration</Label>
                <Textarea
                  placeholder="Enter remarks..."
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Vehicle No</Label>
                  <Input
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Transport</Label>
                  <Input
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Qty</span>
                <span className="font-medium">{totalQty.toFixed(2)} Kgs</span>
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
