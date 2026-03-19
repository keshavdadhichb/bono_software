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
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Accessory Stock</h1>
        </div>
        <Button size="sm" variant="outline" onClick={exportExcel} disabled={stock.length === 0}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold">{summary.totalItems}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total Qty</p>
          <p className="text-2xl font-bold">{summary.totalQty.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total Weight</p>
          <p className="text-2xl font-bold">{summary.totalWeight.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">S.No</TableHead>
                <TableHead>Lot No</TableHead>
                <TableHead>Style No</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : stock.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No accessory stock found.</TableCell></TableRow>
              ) : stock.map((s, idx) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{s.lotNo}</TableCell>
                  <TableCell>{s.styleNo || "-"}</TableCell>
                  <TableCell>{s.accColor || "-"}</TableCell>
                  <TableCell>{s.accSize || "-"}</TableCell>
                  <TableCell className="text-right">{s.qty}</TableCell>
                  <TableCell className="text-right">{s.weight}</TableCell>
                  <TableCell>{s.uom}</TableCell>
                  <TableCell className="text-right">{s.rate.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
