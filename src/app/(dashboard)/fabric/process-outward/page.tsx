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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  partyType: string;
}

interface Store {
  id: string;
  storeName: string;
}

interface StockItem {
  id?: string;
  slNo: number;
  fromLotNo: string;
  fromStyle: string;
  lotNo: string;
  styleNo: string;
  dia: string;
  clothDescription: string;
  content: string;
  color: string;
  printColor: string;
  gsm: string;
  counts: string;
  stockKgs: string;
  weight: string;
  rolls: string;
}

interface ProgramItem {
  id?: string;
  slNo: number;
  lotNo: string;
  styleNo: string;
  styleRef: string;
  styleType: string;
  part: string;
  partGroup: string;
  noOfParts: string;
  pcsWeight: string;
  color: string;
  size: string;
  qty: string;
}

interface FabricOutward {
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
  totalQty: number;
  totalRolls: number;
  programQty: number;
  otherCharges: number;
  totalAmount: number;
  roundOff: number;
  netAmount: number;
  status: string;
  stockItems: Array<{
    id: string;
    slNo: number;
    fromLotNo: string | null;
    fromStyle: string | null;
    lotNo: string | null;
    styleNo: string | null;
    dia: string | null;
    clothDescription: string | null;
    content: string | null;
    color: string | null;
    printColor: string | null;
    gsm: number | null;
    counts: string | null;
    stockKgs: number;
    weight: number;
    rolls: number;
  }>;
  programItems: Array<{
    id: string;
    slNo: number;
    lotNo: string | null;
    styleNo: string | null;
    styleRef: string | null;
    styleType: string | null;
    part: string | null;
    partGroup: string | null;
    noOfParts: number;
    pcsWeight: number;
    color: string | null;
    size: string | null;
    qty: number;
  }>;
  createdAt: string;
}

const emptyStockItem = (): StockItem => ({
  slNo: 1,
  fromLotNo: "",
  fromStyle: "",
  lotNo: "",
  styleNo: "",
  dia: "",
  clothDescription: "",
  content: "",
  color: "",
  printColor: "",
  gsm: "",
  counts: "",
  stockKgs: "",
  weight: "",
  rolls: "",
});

const emptyProgramItem = (): ProgramItem => ({
  slNo: 1,
  lotNo: "",
  styleNo: "",
  styleRef: "",
  styleType: "",
  part: "",
  partGroup: "",
  noOfParts: "",
  pcsWeight: "",
  color: "",
  size: "",
  qty: "",
});

// ---------- Component ----------

export default function FabricProcessOutwardPage() {
  // View state
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // List state
  const [outwards, setOutwards] = useState<FabricOutward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Master data
  const [parties, setParties] = useState<Party[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // Form state
  const [dcDate, setDcDate] = useState<Date>(new Date());
  const [processType, setProcessType] = useState("");
  const [storeId, setStoreId] = useState("");
  const [partyId, setPartyId] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [dcType, setDcType] = useState("Fresh");
  const [narration, setNarration] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transport, setTransport] = useState("");
  const [otherCharges, setOtherCharges] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [stockItems, setStockItems] = useState<StockItem[]>([emptyStockItem()]);
  const [programItems, setProgramItems] = useState<ProgramItem[]>([
    emptyProgramItem(),
  ]);

  // Delete confirm
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOutward, setDeletingOutward] = useState<FabricOutward | null>(
    null
  );

  // ---------- Fetch ----------

  const fetchOutwards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "All") params.set("processType", activeTab);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/fabric/process-outward?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOutwards(data);
    } catch {
      toast.error("Failed to load fabric process outwards");
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
      // Silently fail - user can still type
    }
  }, []);

  useEffect(() => {
    fetchOutwards();
  }, [fetchOutwards]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // ---------- Pagination ----------

  const filtered = outwards;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ---------- Computed totals ----------

  const computedTotalQty = stockItems.reduce(
    (sum, i) => sum + (parseFloat(i.weight) || 0),
    0
  );
  const computedTotalRolls = stockItems.reduce(
    (sum, i) => sum + (parseInt(i.rolls) || 0),
    0
  );
  const computedProgramQty = programItems.reduce(
    (sum, i) => sum + (parseInt(i.qty) || 0),
    0
  );
  const computedNetAmount =
    (parseFloat(totalAmount) || 0) +
    (parseFloat(otherCharges) || 0);

  // ---------- Form actions ----------

  function resetForm() {
    setEditingId(null);
    setDcDate(new Date());
    setProcessType("");
    setStoreId("");
    setPartyId("");
    setTargetDate(undefined);
    setDcType("Fresh");
    setNarration("");
    setVehicleNo("");
    setTransport("");
    setOtherCharges("");
    setTotalAmount("");
    setStockItems([emptyStockItem()]);
    setProgramItems([emptyProgramItem()]);
  }

  function openNewForm() {
    resetForm();
    setView("form");
  }

  function openEditForm(outward: FabricOutward) {
    setEditingId(outward.id);
    setDcDate(new Date(outward.dcDate));
    setProcessType(outward.processType);
    setStoreId(outward.storeId || "");
    setPartyId(outward.partyId);
    setTargetDate(outward.targetDate ? new Date(outward.targetDate) : undefined);
    setDcType(outward.type);
    setNarration(outward.narration || "");
    setVehicleNo(outward.vehicleNo || "");
    setTransport(outward.transport || "");
    setOtherCharges(outward.otherCharges ? String(outward.otherCharges) : "");
    setTotalAmount(outward.totalAmount ? String(outward.totalAmount) : "");

    if (outward.stockItems.length > 0) {
      setStockItems(
        outward.stockItems.map((item) => ({
          id: item.id,
          slNo: item.slNo,
          fromLotNo: item.fromLotNo || "",
          fromStyle: item.fromStyle || "",
          lotNo: item.lotNo || "",
          styleNo: item.styleNo || "",
          dia: item.dia || "",
          clothDescription: item.clothDescription || "",
          content: item.content || "",
          color: item.color || "",
          printColor: item.printColor || "",
          gsm: item.gsm ? String(item.gsm) : "",
          counts: item.counts || "",
          stockKgs: item.stockKgs ? String(item.stockKgs) : "",
          weight: item.weight ? String(item.weight) : "",
          rolls: item.rolls ? String(item.rolls) : "",
        }))
      );
    } else {
      setStockItems([emptyStockItem()]);
    }

    if (outward.programItems.length > 0) {
      setProgramItems(
        outward.programItems.map((item) => ({
          id: item.id,
          slNo: item.slNo,
          lotNo: item.lotNo || "",
          styleNo: item.styleNo || "",
          styleRef: item.styleRef || "",
          styleType: item.styleType || "",
          part: item.part || "",
          partGroup: item.partGroup || "",
          noOfParts: item.noOfParts ? String(item.noOfParts) : "",
          pcsWeight: item.pcsWeight ? String(item.pcsWeight) : "",
          color: item.color || "",
          size: item.size || "",
          qty: item.qty ? String(item.qty) : "",
        }))
      );
    } else {
      setProgramItems([emptyProgramItem()]);
    }

    setView("form");
  }

  // Stock item handlers
  function updateStockItem(index: number, field: keyof StockItem, value: string) {
    setStockItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addStockItem() {
    setStockItems((prev) => [
      ...prev,
      { ...emptyStockItem(), slNo: prev.length + 1 },
    ]);
  }

  function removeStockItem(index: number) {
    setStockItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        slNo: i + 1,
      }));
    });
  }

  // Program item handlers
  function updateProgramItem(
    index: number,
    field: keyof ProgramItem,
    value: string
  ) {
    setProgramItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addProgramItem() {
    setProgramItems((prev) => [
      ...prev,
      { ...emptyProgramItem(), slNo: prev.length + 1 },
    ]);
  }

  function removeProgramItem(index: number) {
    setProgramItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        slNo: i + 1,
      }));
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
        targetDate: targetDate ? targetDate.toISOString() : null,
        type: dcType,
        narration: narration || null,
        vehicleNo: vehicleNo || null,
        transport: transport || null,
        otherCharges: parseFloat(otherCharges) || 0,
        totalAmount: parseFloat(totalAmount) || 0,
        stockItems: stockItems
          .filter((i) => i.lotNo || i.weight || i.clothDescription)
          .map((i) => ({
            fromLotNo: i.fromLotNo || null,
            fromStyle: i.fromStyle || null,
            lotNo: i.lotNo || null,
            styleNo: i.styleNo || null,
            dia: i.dia || null,
            clothDescription: i.clothDescription || null,
            content: i.content || null,
            color: i.color || null,
            printColor: i.printColor || null,
            gsm: i.gsm ? parseInt(i.gsm) : null,
            counts: i.counts || null,
            stockKgs: parseFloat(i.stockKgs) || 0,
            weight: parseFloat(i.weight) || 0,
            rolls: parseInt(i.rolls) || 0,
          })),
        programItems: programItems
          .filter((i) => i.lotNo || i.qty || i.styleNo)
          .map((i) => ({
            lotNo: i.lotNo || null,
            styleNo: i.styleNo || null,
            styleRef: i.styleRef || null,
            styleType: i.styleType || null,
            part: i.part || null,
            partGroup: i.partGroup || null,
            noOfParts: parseInt(i.noOfParts) || 0,
            pcsWeight: parseFloat(i.pcsWeight) || 0,
            color: i.color || null,
            size: i.size || null,
            qty: parseInt(i.qty) || 0,
          })),
      };

      const url = editingId
        ? `/api/fabric/process-outward/${editingId}`
        : "/api/fabric/process-outward";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(
        editingId
          ? "DC updated successfully"
          : "DC created successfully"
      );
      setView("list");
      resetForm();
      fetchOutwards();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save DC";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingOutward) return;
    try {
      const res = await fetch(
        `/api/fabric/process-outward/${deletingOutward.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("DC deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingOutward(null);
      fetchOutwards();
    } catch {
      toast.error("Failed to delete DC");
    }
  }

  function getStatusVariant(
    status: string
  ): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "Open":
        return "default";
      case "Partial":
        return "outline";
      case "Closed":
        return "secondary";
      default:
        return "default";
    }
  }

  // ---------- LIST VIEW ----------
  if (view === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">Fabric Process Outward</h1>
          </div>
          <Button size="sm" onClick={openNewForm}>
            <Plus className="h-4 w-4 mr-1" />
            New DC
          </Button>
        </div>

        {/* Filter Tabs */}
        <Card className="p-4 border-0 shadow-sm bg-white">
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
        <Card className="border-0 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 text-[11px]">DC No</TableHead>
                  <TableHead className="w-24 text-[11px]">Date</TableHead>
                  <TableHead className="w-28 text-[11px]">Process</TableHead>
                  <TableHead className="text-[11px]">Party</TableHead>
                  <TableHead className="w-28 text-[11px]">Store</TableHead>
                  <TableHead className="w-20 text-[11px]">Type</TableHead>
                  <TableHead className="w-24 text-[11px] text-right">Total Qty</TableHead>
                  <TableHead className="w-20 text-[11px] text-right">Rolls</TableHead>
                  <TableHead className="w-24 text-[11px]">Status</TableHead>
                  <TableHead className="w-20 text-[11px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading...
                      </p>
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No fabric process outward DCs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((outward) => (
                    <TableRow
                      key={outward.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openEditForm(outward)}
                    >
                      <TableCell className="text-[13px] font-mono font-medium">
                        {outward.dcNo}
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {format(new Date(outward.dcDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-[13px]">{outward.processType}</TableCell>
                      <TableCell className="text-[13px] font-medium">
                        {outward.party?.partyName || "-"}
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {stores.find((s) => s.id === outward.storeId)
                          ?.storeName || "-"}
                      </TableCell>
                      <TableCell className="text-[13px]">{outward.type}</TableCell>
                      <TableCell className="text-[13px] text-right font-mono">
                        {outward.totalQty.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-[13px] text-right font-mono">
                        {outward.totalRolls}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(outward.status)}>
                          {outward.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingOutward(outward);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete DC</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-4">
              Are you sure you want to delete{" "}
              <strong>{deletingOutward?.dcNo}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ---------- FORM VIEW ----------
  return (
    <div className="space-y-6">
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
            <h1 className="text-xl font-semibold tracking-tight">
              {editingId ? "Edit DC" : "New Fabric Process Outward DC"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {editingId ? "Update the DC details" : "Create a new delivery challan"}
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
            {editingId ? "Update" : "Save"}
          </Button>
        </div>
      </div>

      {/* Header Fields */}
      <Card className="p-4 border-0 shadow-sm bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* DC No (auto) */}
          <div className="space-y-1.5">
            <Label>DC No</Label>
            <Input value={editingId ? "Auto-assigned" : "Auto-generated"} disabled className="bg-muted" />
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

          {/* Target Date */}
          <div className="space-y-1.5">
            <Label>Target Date</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground"
                    )}
                  />
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {targetDate
                  ? format(targetDate, "dd/MM/yyyy")
                  : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={setTargetDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={dcType} onValueChange={(v) => setDcType(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fresh">Fresh</SelectItem>
                <SelectItem value="Re-work">Re-work</SelectItem>
                <SelectItem value="Re-Process">Re-Process</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Items Tabs */}
      <Card className="p-4 border-0 shadow-sm bg-white">
        <Tabs defaultValue="stock">
          <TabsList>
            <TabsTrigger value="stock">Stock Transfer</TabsTrigger>
            <TabsTrigger value="program">Program</TabsTrigger>
          </TabsList>

          {/* Stock Transfer Tab */}
          <TabsContent value="stock" className="mt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sl</TableHead>
                    <TableHead className="w-24">From Lot No</TableHead>
                    <TableHead className="w-24">From Style</TableHead>
                    <TableHead className="w-24">Lot No</TableHead>
                    <TableHead className="w-24">Style No</TableHead>
                    <TableHead className="w-16">Dia</TableHead>
                    <TableHead className="w-32">Cloth Desc</TableHead>
                    <TableHead className="w-24">Content</TableHead>
                    <TableHead className="w-20">Color</TableHead>
                    <TableHead className="w-24">Print Color</TableHead>
                    <TableHead className="w-16">GSM</TableHead>
                    <TableHead className="w-20">Counts</TableHead>
                    <TableHead className="w-20">Stock Kgs</TableHead>
                    <TableHead className="w-20">Weight</TableHead>
                    <TableHead className="w-16">Rolls</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.fromLotNo}
                          onChange={(e) =>
                            updateStockItem(index, "fromLotNo", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.fromStyle}
                          onChange={(e) =>
                            updateStockItem(index, "fromStyle", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.lotNo}
                          onChange={(e) =>
                            updateStockItem(index, "lotNo", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.styleNo}
                          onChange={(e) =>
                            updateStockItem(index, "styleNo", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.dia}
                          onChange={(e) =>
                            updateStockItem(index, "dia", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.clothDescription}
                          onChange={(e) =>
                            updateStockItem(
                              index,
                              "clothDescription",
                              e.target.value
                            )
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.content}
                          onChange={(e) =>
                            updateStockItem(index, "content", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.color}
                          onChange={(e) =>
                            updateStockItem(index, "color", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.printColor}
                          onChange={(e) =>
                            updateStockItem(index, "printColor", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.gsm}
                          onChange={(e) =>
                            updateStockItem(index, "gsm", e.target.value)
                          }
                          className="h-8 text-xs"
                          type="number"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.counts}
                          onChange={(e) =>
                            updateStockItem(index, "counts", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.stockKgs}
                          onChange={(e) =>
                            updateStockItem(index, "stockKgs", e.target.value)
                          }
                          className="h-8 text-xs"
                          type="number"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.weight}
                          onChange={(e) =>
                            updateStockItem(index, "weight", e.target.value)
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
                            updateStockItem(index, "rolls", e.target.value)
                          }
                          className="h-8 text-xs"
                          type="number"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeStockItem(index)}
                          disabled={stockItems.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={addStockItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          </TabsContent>

          {/* Program Tab */}
          <TabsContent value="program" className="mt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sl</TableHead>
                    <TableHead className="w-24">Lot No</TableHead>
                    <TableHead className="w-24">Style No</TableHead>
                    <TableHead className="w-24">Style Ref</TableHead>
                    <TableHead className="w-24">Style Type</TableHead>
                    <TableHead className="w-20">Part</TableHead>
                    <TableHead className="w-24">Part Group</TableHead>
                    <TableHead className="w-20">No of Parts</TableHead>
                    <TableHead className="w-20">PCS Weight</TableHead>
                    <TableHead className="w-20">Color</TableHead>
                    <TableHead className="w-16">Size</TableHead>
                    <TableHead className="w-16">Qty</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.lotNo}
                          onChange={(e) =>
                            updateProgramItem(index, "lotNo", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.styleNo}
                          onChange={(e) =>
                            updateProgramItem(index, "styleNo", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.styleRef}
                          onChange={(e) =>
                            updateProgramItem(index, "styleRef", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.styleType}
                          onChange={(e) =>
                            updateProgramItem(
                              index,
                              "styleType",
                              e.target.value
                            )
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.part}
                          onChange={(e) =>
                            updateProgramItem(index, "part", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.partGroup}
                          onChange={(e) =>
                            updateProgramItem(
                              index,
                              "partGroup",
                              e.target.value
                            )
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.noOfParts}
                          onChange={(e) =>
                            updateProgramItem(
                              index,
                              "noOfParts",
                              e.target.value
                            )
                          }
                          className="h-8 text-xs"
                          type="number"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.pcsWeight}
                          onChange={(e) =>
                            updateProgramItem(
                              index,
                              "pcsWeight",
                              e.target.value
                            )
                          }
                          className="h-8 text-xs"
                          type="number"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.color}
                          onChange={(e) =>
                            updateProgramItem(index, "color", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.size}
                          onChange={(e) =>
                            updateProgramItem(index, "size", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.qty}
                          onChange={(e) =>
                            updateProgramItem(index, "qty", e.target.value)
                          }
                          className="h-8 text-xs"
                          type="number"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeProgramItem(index)}
                          disabled={programItems.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={addProgramItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Footer */}
      <Card className="p-4 border-0 shadow-sm bg-white">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Total Qty (Kgs)</Label>
            <p className="text-lg font-bold font-mono">
              {computedTotalQty.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Program Qty</Label>
            <p className="text-lg font-bold font-mono">{computedProgramQty}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Total Rolls</Label>
            <p className="text-lg font-bold font-mono">{computedTotalRolls}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Total Amount</Label>
            <Input
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              type="number"
              step="0.01"
              className="h-8"
            />
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
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Net Amount</Label>
            <p className="text-lg font-bold font-mono text-primary">
              {computedNetAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
