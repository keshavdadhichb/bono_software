"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Package, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface StockItem {
  id: string; storeId: string; lotNo: string; styleNo: string | null;
  accessoryId: string; accColor: string | null; accSize: string | null;
  qty: number; weight: number; uom: string; rate: number;
}

interface Summary { totalItems: number; totalQty: number; totalWeight: number; }

export default function AccessoryStockPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalItems: 0, totalQty: 0, totalWeight: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accessory/stock");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStock(data.stock);
      setSummary(data.summary);
    } catch {
      toast.error("Failed to load stock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(stock.map((s, i) => ({
      "S.No": i + 1, "Lot No": s.lotNo, "Style No": s.styleNo || "",
      "Color": s.accColor || "", "Size": s.accSize || "",
      "Qty": s.qty, "Weight": s.weight, "UOM": s.uom, "Rate": s.rate,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accessory Stock");
    XLSX.writeFile(wb, "accessory-stock.xlsx");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Accessory Stock</h1>
        </div>
        <Button size="sm" variant="outline" onClick={exportExcel} disabled={stock.length === 0}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-white"><CardContent className="pt-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Items</p>
          <p className="text-2xl font-semibold">{summary.totalItems}</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm bg-white"><CardContent className="pt-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Qty</p>
          <p className="text-2xl font-semibold">{summary.totalQty.toFixed(2)}</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm bg-white"><CardContent className="pt-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Weight</p>
          <p className="text-2xl font-semibold">{summary.totalWeight.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-[11px] uppercase tracking-wide">S.No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Lot No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Style No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Color</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Size</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide">Qty</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide">Weight</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">UOM</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : stock.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No accessory stock found.</TableCell></TableRow>
              ) : stock.map((s, idx) => (
                <TableRow key={s.id}>
                  <TableCell className="text-[13px] font-mono text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="text-[13px] font-medium">{s.lotNo}</TableCell>
                  <TableCell className="text-[13px]">{s.styleNo || "-"}</TableCell>
                  <TableCell className="text-[13px]">{s.accColor || "-"}</TableCell>
                  <TableCell className="text-[13px]">{s.accSize || "-"}</TableCell>
                  <TableCell className="text-right text-[13px]">{s.qty}</TableCell>
                  <TableCell className="text-right text-[13px]">{s.weight}</TableCell>
                  <TableCell className="text-[13px]">{s.uom}</TableCell>
                  <TableCell className="text-right text-[13px]">{s.rate.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
