"use client";

import * as React from "react";
import { toast } from "sonner";
import { Search, Download, FileText, Package } from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// --------------- Types ---------------

interface StockItem {
  id: string;
  storeId: string;
  lotNo: string;
  styleNo: string | null;
  counts: string;
  yarnType: string;
  millName: string | null;
  color: string | null;
  dyeColor: string | null;
  stockKgs: number;
  noOfBags: number;
  uom: string;
  rate: number;
}

interface Store {
  id: string;
  storeName: string;
}

// --------------- Main Page ---------------

export default function YarnStockPage() {
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stores, setStores] = React.useState<Store[]>([]);

  // Filters
  const [storeFilter, setStoreFilter] = React.useState("All");
  const [yarnTypeFilter, setYarnTypeFilter] = React.useState("All");
  const [colorFilter, setColorFilter] = React.useState("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Derived unique values for filter dropdowns
  const yarnTypes = React.useMemo(
    () => [...new Set(stock.map((s) => s.yarnType).filter(Boolean))],
    [stock]
  );
  const colors = React.useMemo(
    () => [...new Set(stock.map((s) => s.color).filter(Boolean) as string[])],
    [stock]
  );

  // --------------- Data fetching ---------------

  const fetchStock = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (storeFilter !== "All") params.set("storeId", storeFilter);
      if (yarnTypeFilter !== "All") params.set("yarnType", yarnTypeFilter);
      if (colorFilter !== "All") params.set("color", colorFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/yarn/stock?${params}`);
      if (!res.ok) throw new Error("Failed to fetch stock");
      setStock(await res.json());
    } catch {
      toast.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  }, [storeFilter, yarnTypeFilter, colorFilter, searchQuery]);

  React.useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  React.useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then(setStores)
      .catch(() => {});
  }, []);

  // --------------- Computed ---------------

  const totalKgs = stock.reduce((s, i) => s + i.stockKgs, 0);
  const totalBags = stock.reduce((s, i) => s + i.noOfBags, 0);
  const totalValue = stock.reduce((s, i) => s + i.stockKgs * i.rate, 0);

  // --------------- Excel Export ---------------

  const exportToExcel = () => {
    const data = stock.map((item, idx) => ({
      "Sl No": idx + 1,
      "Lot No": item.lotNo,
      "Style No": item.styleNo || "",
      Counts: item.counts,
      "Yarn Type": item.yarnType,
      Mill: item.millName || "",
      Color: item.color || "",
      "Stock Kgs": item.stockKgs,
      "No of Bags": item.noOfBags,
      UOM: item.uom,
      Rate: item.rate,
      Value: Math.round(item.stockKgs * item.rate * 100) / 100,
    }));

    // Add totals row
    data.push({
      "Sl No": 0,
      "Lot No": "",
      "Style No": "",
      Counts: "",
      "Yarn Type": "",
      Mill: "",
      Color: "TOTAL",
      "Stock Kgs": totalKgs,
      "No of Bags": totalBags,
      UOM: "",
      Rate: 0,
      Value: Math.round(totalValue * 100) / 100,
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yarn Stock");
    XLSX.writeFile(wb, `Yarn_Stock_Report.xlsx`);
    toast.success("Excel file downloaded");
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Yarn Stock Report</h1>
          <p className="text-[13px] text-muted-foreground">
            Current yarn stock across all stores
          </p>
        </div>
        <Button variant="outline" onClick={exportToExcel} disabled={stock.length === 0}>
          <Download className="mr-1.5 size-4" />
          Export Excel
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card size="sm" className="border-0 shadow-sm bg-white">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Stock</p>
              <p className="text-2xl font-semibold">{totalKgs.toFixed(2)} Kgs</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm" className="border-0 shadow-sm bg-white">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Bags</p>
              <p className="text-2xl font-semibold">{totalBags}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm" className="border-0 shadow-sm bg-white">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Value</p>
              <p className="text-2xl font-semibold">{totalValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card size="sm" className="border-0 shadow-sm bg-white">
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Store</Label>
              <Select value={storeFilter} onValueChange={(v) => setStoreFilter(v ?? "")}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Stores</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.storeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Yarn Type</Label>
              <Select value={yarnTypeFilter} onValueChange={(v) => setYarnTypeFilter(v ?? "")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {yarnTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Select value={colorFilter} onValueChange={(v) => setColorFilter(v ?? "")}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Colors</SelectItem>
                  {colors.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search across all columns..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock table */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center text-[11px] uppercase tracking-wide">Sl</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Lot No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Style No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Counts</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Yarn Type</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Mill</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Color</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide">Stock Kgs</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide">No of Bags</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">UOM</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide">Rate</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-32 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : stock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-32 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 size-8 opacity-50" />
                    No stock records found
                  </TableCell>
                </TableRow>
              ) : (
                stock.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-center text-[13px] text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-[13px] font-medium">{item.lotNo}</TableCell>
                    <TableCell className="text-[13px]">{item.styleNo || "-"}</TableCell>
                    <TableCell className="text-[13px]">{item.counts}</TableCell>
                    <TableCell className="text-[13px]">{item.yarnType}</TableCell>
                    <TableCell className="text-[13px]">{item.millName || "-"}</TableCell>
                    <TableCell className="text-[13px]">{item.color || "-"}</TableCell>
                    <TableCell className="text-right text-[13px] font-medium">
                      {item.stockKgs.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-[13px]">{item.noOfBags}</TableCell>
                    <TableCell className="text-[13px]">{item.uom}</TableCell>
                    <TableCell className="text-right text-[13px]">{item.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-[13px] font-medium">
                      {(item.stockKgs * item.rate).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {stock.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className="text-right font-semibold">
                    Totals
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {totalKgs.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {totalBags}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right font-semibold">
                    {totalValue.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
