"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Loader2,
  ArrowLeft,
  Trash2,
  Save,
  X,
  Layers,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// ---------- Constants ----------

const PROCESS_TYPES = [
  "Dyeing",
  "Compacting",
  "Heat Setting",
  "Washing",
  "Printing",
  "Cutting",
  "Others",
];

const PROCESS_TABS = ["All", ...PROCESS_TYPES];

const PAGE_SIZE = 20;

// ---------- Types ----------

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
  totalRolls: number;
  status: string;
  party: Party;
  stockItems: Array<{
    slNo: number;
    lotNo: string | null;
    styleNo: string | null;
    dia: string | null;
    clothDescription: string | null;
    color: string | null;
    weight: number;
    rolls: number;
  }>;
}

interface InwardItem {
  slNo: number;
  lotNo: string;
  styleNo: string;
  dia: string;
  clothDescription: string;
  color: string;
  weight: string;
  rolls: string;
  uom: string;
  rate: string;
  amount: string;
}

interface FabricInward {
  id: string;
  dcNo: string;
  dcDate: string;
  processType: string;
  storeId: string | null;
  partyId: string;
  party: Party;
  pdcNo: string | null;
  pdcDate: string | null;
  narration: string | null;
  vehicleNo: string | null;
  transport: string | null;
  totalQty: number;
  totalRolls: number;
  otherCharges: number;
  totalAmount: number;
  gstAmount: number;
  roundOff: number;
  netAmount: number;
  items: Array<{
    id: string;
    slNo: number;
    lotNo: string | null;
    styleNo: string | null;
    dia: string | null;
    clothDescription: string | null;
    color: string | null;
    weight: number;
    rolls: number;
    uom: string;
    rate: number;
    amount: number;
  }>;
  createdAt: string;
}

const emptyInwardItem = (): InwardItem => ({
  slNo: 1,
  lotNo: "",
  styleNo: "",
  dia: "",
  clothDescription: "",
  color: "",
  weight: "",
  rolls: "",
  uom: "Kgs",
  rate: "",
  amount: "",
});

// ---------- Component ----------

export default function FabricProcessInwardPage() {
  // View state
  const [view, setView] = useState<"list" | "form">("list");

  // List state
  const [inwards, setInwards] = useState<FabricInward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Master data
  const [parties, setParties] = useState<Party[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [outwardDCs, setOutwardDCs] = useState<OutwardDC[]>([]);

  // Form state
  const [dcDate, setDcDate] = useState<Date>(new Date());
  const [processType, setProcessType] = useState("");
  const [storeId, setStoreId] = useState("");
  const [partyId, setPartyId] = useState("");
  const [pdcNo, setPdcNo] = useState("");
  const [pdcDate, setPdcDate] = useState<Date | undefined>();
  const [narration, setNarration] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transport, setTransport] = useState("");
  const [otherCharges, setOtherCharges] = useState("");
  const [gstAmount, setGstAmount] = useState("");
  const [items, setItems] = useState<InwardItem[]>([emptyInwardItem()]);

  // DC selection dialog
  const [dcSelectOpen, setDcSelectOpen] = useState(false);

  // ---------- Fetch ----------

  const fetchInwards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "All") params.set("processType", activeTab);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/fabric/process-inward?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setInwards(await res.json());
    } catch {
      toast.error("Failed to load fabric process inwards");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  const fetchMasters = useCallback(async () => {
    try {
      const [partiesRes, storesRes] = await Promise.all([
        fetch("/api/parties"),
        fetch("/api/stores"),
      ]);
      if (partiesRes.ok) setParties(await partiesRes.json());
      if (storesRes.ok) setStores(await storesRes.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchInwards();
  }, [fetchInwards]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Fetch outward DCs when party changes
  useEffect(() => {
    if (!partyId) {
      setOutwardDCs([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/fabric/process-outward?partyId=${partyId}&status=Open`
        );
        if (res.ok) {
          const data = await res.json();
          // Also include partial ones
          const res2 = await fetch(
            `/api/fabric/process-outward?partyId=${partyId}&status=Partial`
          );
          if (res2.ok) {
            const data2 = await res2.json();
            setOutwardDCs([...data, ...data2]);
          } else {
            setOutwardDCs(data);
          }
        }
      } catch {
        // silent
      }
    })();
  }, [partyId]);

  // ---------- Pagination ----------

  const filtered = inwards;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ---------- Computed ----------

  const computedTotalQty = items.reduce(
    (sum, i) => sum + (parseFloat(i.weight) || 0),
    0
  );
  const computedTotalRolls = items.reduce(
    (sum, i) => sum + (parseInt(i.rolls) || 0),
    0
  );
  const computedTotalAmount = items.reduce(
    (sum, i) => sum + (parseFloat(i.amount) || 0),
    0
  );
  const computedNetAmount =
    computedTotalAmount +
    (parseFloat(otherCharges) || 0) +
    (parseFloat(gstAmount) || 0);

  // ---------- Form actions ----------

  function resetForm() {
    setDcDate(new Date());
    setProcessType("");
    setStoreId("");
    setPartyId("");
    setPdcNo("");
    setPdcDate(undefined);
    setNarration("");
    setVehicleNo("");
    setTransport("");
    setOtherCharges("");
    setGstAmount("");
    setItems([emptyInwardItem()]);
  }

  function openNewForm() {
    resetForm();
    setView("form");
  }

  function selectOutwardDC(dc: OutwardDC) {
    setPdcNo(dc.dcNo);
    setPdcDate(new Date(dc.dcDate));
    setProcessType(dc.processType);

    // Pre-fill items from outward stock items
    if (dc.stockItems && dc.stockItems.length > 0) {
      setItems(
        dc.stockItems.map((si, idx) => ({
          slNo: idx + 1,
          lotNo: si.lotNo || "",
          styleNo: si.styleNo || "",
          dia: si.dia || "",
          clothDescription: si.clothDescription || "",
          color: si.color || "",
          weight: "",
          rolls: "",
          uom: "Kgs",
          rate: "",
          amount: "",
        }))
      );
    }

    setDcSelectOpen(false);
  }

  function updateItem(index: number, field: keyof InwardItem, value: string) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Auto-calc amount
      if (field === "weight" || field === "rate") {
        const w = field === "weight" ? parseFloat(value) || 0 : parseFloat(updated[index].weight) || 0;
        const r = field === "rate" ? parseFloat(value) || 0 : parseFloat(updated[index].rate) || 0;
        updated[index].amount = (w * r).toFixed(2);
      }
      return updated;
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { ...emptyInwardItem(), slNo: prev.length + 1 },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, slNo: i + 1 }));
    });
  }

  async function handleSave() {
    if (!processType) {
      toast.error("Process Type is required");
      return;
    }
    if (!partyId) {
      toast.error("Party is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        dcDate: dcDate.toISOString(),
        processType,
        storeId: storeId || null,
        partyId,
        pdcNo: pdcNo || null,
        pdcDate: pdcDate ? pdcDate.toISOString() : null,
        narration: narration || null,
        vehicleNo: vehicleNo || null,
        transport: transport || null,
        otherCharges: parseFloat(otherCharges) || 0,
        gstAmount: parseFloat(gstAmount) || 0,
        items: items
          .filter((i) => i.lotNo || i.weight || i.clothDescription)
          .map((i) => ({
            lotNo: i.lotNo || null,
            styleNo: i.styleNo || null,
            dia: i.dia || null,
            clothDescription: i.clothDescription || null,
            color: i.color || null,
            weight: parseFloat(i.weight) || 0,
            rolls: parseInt(i.rolls) || 0,
            uom: i.uom || "Kgs",
            rate: parseFloat(i.rate) || 0,
            amount: parseFloat(i.amount) || 0,
          })),
      };

      const res = await fetch("/api/fabric/process-inward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success("Inward DC created successfully");
      setView("list");
      resetForm();
      fetchInwards();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save inward DC";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  // ---------- LIST VIEW ----------
  if (view === "list") {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Fabric Process Inward</h1>
          </div>
          <Button size="sm" onClick={openNewForm}>
            <Plus className="h-4 w-4 mr-1" />
            New Inward
          </Button>
        </div>

        {/* Filter Tabs */}
        <Card className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1">
              {PROCESS_TABS.map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className="text-xs"
                >
                  {tab}
                </Button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by DC No or party name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">DC No</TableHead>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead className="w-28">Process</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="w-28">PDC No</TableHead>
                  <TableHead className="w-24">Store</TableHead>
                  <TableHead className="w-24 text-right">Total Qty</TableHead>
                  <TableHead className="w-20 text-right">Rolls</TableHead>
                  <TableHead className="w-24 text-right">Net Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading...
                      </p>
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No fabric process inward records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((inward) => (
                    <TableRow
                      key={inward.id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-mono font-medium">
                        {inward.dcNo}
                      </TableCell>
                      <TableCell>
                        {format(new Date(inward.dcDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{inward.processType}</TableCell>
                      <TableCell className="font-medium">
                        {inward.party?.partyName || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {inward.pdcNo || "-"}
                      </TableCell>
                      <TableCell>
                        {stores.find((s) => s.id === inward.storeId)
                          ?.storeName || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {inward.totalQty.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {inward.totalRolls}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {inward.netAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <>
              <Separator />
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }

  // ---------- FORM VIEW ----------
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Form Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setView("list");
              resetForm();
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">New Fabric Process Inward</h1>
            <p className="text-sm text-muted-foreground">
              Receive fabric from process
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setView("list");
              resetForm();
            }}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Header Fields */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* DC No (auto) */}
          <div className="space-y-1.5">
            <Label>DC No</Label>
            <Input value="Auto-generated" disabled className="bg-muted" />
          </div>

          {/* DC Date */}
          <div className="space-y-1.5">
            <Label>
              DC Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dcDate && "text-muted-foreground"
                    )}
                  />
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dcDate ? format(dcDate, "dd/MM/yyyy") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dcDate}
                  onSelect={(date) => date && setDcDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Process Type */}
          <div className="space-y-1.5">
            <Label>
              Process Type <span className="text-destructive">*</span>
            </Label>
            <Select value={processType} onValueChange={(v) => setProcessType(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select process" />
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

          {/* Store */}
          <div className="space-y-1.5">
            <Label>Store</Label>
            <Select value={storeId} onValueChange={(v) => setStoreId(v ?? "")}>
              <SelectTrigger>
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

          {/* Party */}
          <div className="space-y-1.5">
            <Label>
              Party <span className="text-destructive">*</span>
            </Label>
            <Select value={partyId} onValueChange={(v) => setPartyId(v ?? "")}>
              <SelectTrigger>
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

          {/* PDC No (select from outward DCs) */}
          <div className="space-y-1.5">
            <Label>PDC No (Outward DC)</Label>
            <div className="flex gap-1">
              <Input
                value={pdcNo}
                onChange={(e) => setPdcNo(e.target.value)}
                placeholder="Select or type DC No"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDcSelectOpen(true)}
                disabled={!partyId}
                title="Select from open DCs"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PDC Date */}
          <div className="space-y-1.5">
            <Label>PDC Date</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !pdcDate && "text-muted-foreground"
                    )}
                  />
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {pdcDate ? format(pdcDate, "dd/MM/yyyy") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={pdcDate}
                  onSelect={setPdcDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Inward Items</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Sl</TableHead>
                <TableHead className="w-24">Lot No</TableHead>
                <TableHead className="w-24">Style No</TableHead>
                <TableHead className="w-16">Dia</TableHead>
                <TableHead className="w-32">Cloth Desc</TableHead>
                <TableHead className="w-20">Color</TableHead>
                <TableHead className="w-20">Weight</TableHead>
                <TableHead className="w-16">Rolls</TableHead>
                <TableHead className="w-16">UOM</TableHead>
                <TableHead className="w-20">Rate</TableHead>
                <TableHead className="w-24">Amount</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.lotNo}
                      onChange={(e) =>
                        updateItem(index, "lotNo", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.styleNo}
                      onChange={(e) =>
                        updateItem(index, "styleNo", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.dia}
                      onChange={(e) =>
                        updateItem(index, "dia", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.clothDescription}
                      onChange={(e) =>
                        updateItem(index, "clothDescription", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.color}
                      onChange={(e) =>
                        updateItem(index, "color", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.weight}
                      onChange={(e) =>
                        updateItem(index, "weight", e.target.value)
                      }
                      className="h-8 text-xs"
                      type="number"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.rolls}
                      onChange={(e) =>
                        updateItem(index, "rolls", e.target.value)
                      }
                      className="h-8 text-xs"
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.uom}
                      onValueChange={(v) => updateItem(index, "uom", v ?? "")}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kgs">Kgs</SelectItem>
                        <SelectItem value="Mtrs">Mtrs</SelectItem>
                        <SelectItem value="Rolls">Rolls</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.rate}
                      onChange={(e) =>
                        updateItem(index, "rate", e.target.value)
                      }
                      className="h-8 text-xs"
                      type="number"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.amount}
                      onChange={(e) =>
                        updateItem(index, "amount", e.target.value)
                      }
                      className="h-8 text-xs bg-muted"
                      type="number"
                      step="0.01"
                      readOnly
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>
      </Card>

      {/* Footer */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label>Narration</Label>
            <Textarea
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Notes / remarks"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Vehicle No</Label>
            <Input
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="Vehicle number"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Transport</Label>
            <Input
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              placeholder="Transport details"
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Total Qty (Kgs)</Label>
            <p className="text-lg font-bold font-mono">
              {computedTotalQty.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Total Rolls</Label>
            <p className="text-lg font-bold font-mono">{computedTotalRolls}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Other Charges</Label>
            <Input
              value={otherCharges}
              onChange={(e) => setOtherCharges(e.target.value)}
              type="number"
              step="0.01"
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">GST Amount</Label>
            <Input
              value={gstAmount}
              onChange={(e) => setGstAmount(e.target.value)}
              type="number"
              step="0.01"
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Net Amount</Label>
            <p className="text-lg font-bold font-mono text-primary">
              {computedNetAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {/* DC Selection Dialog */}
      <Dialog open={dcSelectOpen} onOpenChange={setDcSelectOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Outward DC</DialogTitle>
          </DialogHeader>
          {outwardDCs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No open/partial outward DCs found for the selected party.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DC No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rolls</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outwardDCs.map((dc) => (
                  <TableRow
                    key={dc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => selectOutwardDC(dc)}
                  >
                    <TableCell className="font-mono font-medium">
                      {dc.dcNo}
                    </TableCell>
                    <TableCell>
                      {format(new Date(dc.dcDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{dc.processType}</TableCell>
                    <TableCell className="text-right font-mono">
                      {dc.totalQty.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {dc.totalRolls}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dc.status === "Open" ? "default" : "outline"
                        }
                      >
                        {dc.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
