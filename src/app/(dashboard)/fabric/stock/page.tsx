"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Search,
  Loader2,
  Download,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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

const PAGE_SIZE = 25;

// ---------- Types ----------

interface Store {
  id: string;
  storeName: string;
}

interface FabricStockItem {
  id: string;
  storeId: string;
  lotNo: string;
  styleNo: string | null;
  dia: string | null;
  clothDescription: string | null;
  content: string | null;
  color: string | null;
  dyeColor: string | null;
  printColor: string | null;
  gsm: number | null;
  counts: string | null;
  weight: number;
  rolls: number;
  uom: string;
  rate: number;
  process: string | null;
}

// ---------- Component ----------

export default function FabricStockPage() {
  const [stock, setStock] = useState<FabricStockItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [storeId, setStoreId] = useState("");
  const [clothFilter, setClothFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ---------- Fetch ----------

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (storeId) params.set("storeId", storeId);
      if (clothFilter) params.set("clothDescription", clothFilter);
      if (colorFilter) params.set("color", colorFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/fabric/stock?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setStock(await res.json());
    } catch {
      toast.error("Failed to load fabric stock");
    } finally {
      setLoading(false);
    }
  }, [storeId, clothFilter, colorFilter, searchQuery]);

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/stores");
      if (res.ok) setStores(await res.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    setCurrentPage(1);
  }, [storeId, clothFilter, colorFilter, searchQuery]);

  // ---------- Pagination ----------

  const totalPages = Math.max(1, Math.ceil(stock.length / PAGE_SIZE));
  const paginated = stock.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ---------- Totals ----------

  const totalWeight = stock.reduce((sum, s) => sum + s.weight, 0);
  const totalRolls = stock.reduce((sum, s) => sum + s.rolls, 0);
  const totalValue = stock.reduce((sum, s) => sum + s.weight * s.rate, 0);

  // ---------- Export ----------

  function exportToExcel() {
    const exportData = stock.map((s, idx) => ({
      "S.No": idx + 1,
      "Lot No": s.lotNo,
      "Style No": s.styleNo || "",
      Dia: s.dia || "",
      "Cloth Description": s.clothDescription || "",
      Content: s.content || "",
      Color: s.color || "",
      "Dye Color": s.dyeColor || "",
      "Print Color": s.printColor || "",
      GSM: s.gsm || "",
      Weight: s.weight,
      Rolls: s.rolls,
      Rate: s.rate,
      Value: (s.weight * s.rate).toFixed(2),
    }));

    // Add totals row
    exportData.push({
      "S.No": 0,
      "Lot No": "",
      "Style No": "",
      Dia: "",
      "Cloth Description": "",
      Content: "",
      Color: "",
      "Dye Color": "",
      "Print Color": "",
      GSM: "",
      Weight: totalWeight,
      Rolls: totalRolls,
      Rate: 0,
      Value: totalValue.toFixed(2),
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fabric Stock");
    XLSX.writeFile(wb, "Fabric_Stock_Report.xlsx");
    toast.success("Exported to Excel");
  }

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Fabric Stock Report</h1>
        </div>
        <Button variant="outline" size="sm" onClick={exportToExcel}>
          <Download className="h-4 w-4 mr-1" />
          Export Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Store</Label>
            <Select value={storeId} onValueChange={(v) => setStoreId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stores</SelectItem>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.storeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cloth Description</Label>
            <Input
              value={clothFilter}
              onChange={(e) => setClothFilter(e.target.value)}
              placeholder="Filter by cloth..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <Input
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              placeholder="Filter by color..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lot, style, cloth, color..."
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 text-[11px] uppercase tracking-wide">Lot No</TableHead>
                <TableHead className="w-24 text-[11px] uppercase tracking-wide">Style No</TableHead>
                <TableHead className="w-16 text-[11px] uppercase tracking-wide">Dia</TableHead>
                <TableHead className="w-36 text-[11px] uppercase tracking-wide">Cloth Desc</TableHead>
                <TableHead className="w-24 text-[11px] uppercase tracking-wide">Content</TableHead>
                <TableHead className="w-20 text-[11px] uppercase tracking-wide">Color</TableHead>
                <TableHead className="w-20 text-[11px] uppercase tracking-wide">Dye Color</TableHead>
                <TableHead className="w-24 text-[11px] uppercase tracking-wide">Print Color</TableHead>
                <TableHead className="w-16 text-[11px] uppercase tracking-wide">GSM</TableHead>
                <TableHead className="w-20 text-right text-[11px] uppercase tracking-wide">Weight</TableHead>
                <TableHead className="w-16 text-right text-[11px] uppercase tracking-wide">Rolls</TableHead>
                <TableHead className="w-20 text-right text-[11px] uppercase tracking-wide">Rate</TableHead>
                <TableHead className="w-24 text-right text-[11px] uppercase tracking-wide">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading stock...
                    </p>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No fabric stock records found.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {paginated.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="text-[13px] font-mono font-medium">
                        {item.lotNo}
                      </TableCell>
                      <TableCell className="text-[13px]">{item.styleNo || "-"}</TableCell>
                      <TableCell className="text-[13px]">{item.dia || "-"}</TableCell>
                      <TableCell className="text-[13px]">{item.clothDescription || "-"}</TableCell>
                      <TableCell className="text-[13px]">{item.content || "-"}</TableCell>
                      <TableCell className="text-[13px]">{item.color || "-"}</TableCell>
                      <TableCell className="text-[13px]">{item.dyeColor || "-"}</TableCell>
                      <TableCell className="text-[13px]">{item.printColor || "-"}</TableCell>
                      <TableCell className="text-[13px]">{item.gsm || "-"}</TableCell>
                      <TableCell className="text-right text-[13px] font-mono">
                        {item.weight.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-[13px] font-mono">
                        {item.rolls}
                      </TableCell>
                      <TableCell className="text-right text-[13px] font-mono">
                        {item.rate.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-[13px] font-mono">
                        {(item.weight * item.rate).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Totals row */}
                  <TableRow className="bg-muted/50 font-bold border-t-2">
                    <TableCell colSpan={9} className="text-right">
                      TOTAL
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {totalWeight.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {totalRolls}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-mono text-primary">
                      {totalValue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </>
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
                {Math.min(currentPage * PAGE_SIZE, stock.length)} of{" "}
                {stock.length}
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-white p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Weight (Kgs)</p>
          <p className="text-2xl font-semibold font-mono mt-1">
            {totalWeight.toFixed(2)}
          </p>
        </Card>
        <Card className="border-0 shadow-sm bg-white p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Rolls</p>
          <p className="text-2xl font-semibold font-mono mt-1">{totalRolls}</p>
        </Card>
        <Card className="border-0 shadow-sm bg-white p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Value</p>
          <p className="text-2xl font-semibold font-mono mt-1 text-primary">
            {totalValue.toFixed(2)}
          </p>
        </Card>
      </div>
    </div>
  );
}
