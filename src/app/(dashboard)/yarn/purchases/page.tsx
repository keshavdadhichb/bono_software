"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, ShoppingCart, Loader2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Party { id: string; partyName: string; }
interface Store { id: string; storeName: string; }

interface PurchaseItem {
  lotNo: string; styleNo: string; counts: string; yarnType: string;
  millName: string; color: string; noOfBags: string; qty: string; rate: string; amount: string;
}

interface Purchase {
  id: string; grnNo: string; grnDate: string; invoiceNo: string | null;
  totalQty: number; netAmount: number;
  party: { partyName: string };
  _count: { items: number };
}

const emptyItem: PurchaseItem = {
  lotNo: "", styleNo: "", counts: "", yarnType: "", millName: "",
  color: "", noOfBags: "", qty: "", rate: "", amount: "",
};

export default function YarnPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    grnDate: new Date().toISOString().split("T")[0],
    partyId: "", storeId: "", invoiceNo: "", invoiceDate: "",
    vehicleNo: "", narration: "", gstAmount: "", otherCharges: "",
  });
  const [items, setItems] = useState<PurchaseItem[]>([{ ...emptyItem }]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/yarn/purchases${search ? `?search=${search}` : ""}`);
      if (!res.ok) throw new Error();
      setPurchases(await res.json());
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    Promise.all([fetch("/api/parties"), fetch("/api/stores")])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(([p, s]) => { setParties(p); setStores(s); });
  }, []);

  function openAdd() {
    setForm({
      grnDate: new Date().toISOString().split("T")[0],
      partyId: "", storeId: "", invoiceNo: "", invoiceDate: "",
      vehicleNo: "", narration: "", gstAmount: "", otherCharges: "",
    });
    setItems([{ ...emptyItem }]);
    setDialogOpen(true);
  }

  function updateItem(idx: number, field: keyof PurchaseItem, value: string) {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "qty" || field === "rate") {
      const qty = parseFloat(updated[idx].qty) || 0;
      const rate = parseFloat(updated[idx].rate) || 0;
      updated[idx].amount = (qty * rate).toFixed(2);
    }
    setItems(updated);
  }

  function addRow() { setItems([...items, { ...emptyItem }]); }
  function removeRow(idx: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  const totalQty = items.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
  const totalAmount = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  async function handleSave() {
    if (!form.partyId) { toast.error("Party is required"); return; }
    if (items.every(i => !i.qty)) { toast.error("Add at least one item"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/yarn/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: items.filter(i => parseFloat(i.qty) > 0) }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success("Purchase created");
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Yarn Purchases</h1>
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> New Purchase</Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search GRN, invoice, party..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GRN No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Party</TableHead>
                <TableHead className="hidden md:table-cell">Invoice No</TableHead>
                <TableHead className="text-right">Qty (Kgs)</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : purchases.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No purchases found.</TableCell></TableRow>
              ) : purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.grnNo}</TableCell>
                  <TableCell>{new Date(p.grnDate).toLocaleDateString()}</TableCell>
                  <TableCell>{p.party.partyName}</TableCell>
                  <TableCell className="hidden md:table-cell">{p.invoiceNo || "-"}</TableCell>
                  <TableCell className="text-right">{p.totalQty.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">{p.netAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Yarn Purchase</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>GRN Date</Label>
                <Input type="date" value={form.grnDate} onChange={(e) => setForm({ ...form, grnDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Party <span className="text-destructive">*</span></Label>
                <select className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value })}>
                  <option value="">Select Party</option>
                  {parties.map(p => <option key={p.id} value={p.id}>{p.partyName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Store</Label>
                <select className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
                  <option value="">Select Store</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.storeName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Invoice No</Label>
                <Input value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} placeholder="Invoice No" />
              </div>
              <div className="space-y-1">
                <Label>Invoice Date</Label>
                <Input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Vehicle No</Label>
                <Input value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} placeholder="Vehicle No" />
              </div>
              <div className="space-y-1">
                <Label>GST Amount</Label>
                <Input type="number" value={form.gstAmount} onChange={(e) => setForm({ ...form, gstAmount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>Other Charges</Label>
                <Input type="number" value={form.otherCharges} onChange={(e) => setForm({ ...form, otherCharges: e.target.value })} placeholder="0.00" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Items</Label>
                <Button size="sm" variant="outline" onClick={addRow}><Plus className="h-3 w-3 mr-1" /> Add Row</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left w-8">#</th>
                      <th className="p-2 text-left">Lot No</th>
                      <th className="p-2 text-left">Counts</th>
                      <th className="p-2 text-left">Yarn Type</th>
                      <th className="p-2 text-left">Color</th>
                      <th className="p-2 text-right">Bags</th>
                      <th className="p-2 text-right">Qty (Kgs)</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-1 text-center text-muted-foreground">{idx + 1}</td>
                        <td className="p-1"><Input className="h-7 text-xs" value={item.lotNo} onChange={(e) => updateItem(idx, "lotNo", e.target.value)} /></td>
                        <td className="p-1"><Input className="h-7 text-xs" value={item.counts} onChange={(e) => updateItem(idx, "counts", e.target.value)} /></td>
                        <td className="p-1"><Input className="h-7 text-xs" value={item.yarnType} onChange={(e) => updateItem(idx, "yarnType", e.target.value)} /></td>
                        <td className="p-1"><Input className="h-7 text-xs" value={item.color} onChange={(e) => updateItem(idx, "color", e.target.value)} /></td>
                        <td className="p-1"><Input className="h-7 text-xs text-right" type="number" value={item.noOfBags} onChange={(e) => updateItem(idx, "noOfBags", e.target.value)} /></td>
                        <td className="p-1"><Input className="h-7 text-xs text-right" type="number" value={item.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} /></td>
                        <td className="p-1"><Input className="h-7 text-xs text-right" type="number" value={item.rate} onChange={(e) => updateItem(idx, "rate", e.target.value)} /></td>
                        <td className="p-1 text-right font-medium text-xs pr-2">{item.amount || "0.00"}</td>
                        <td className="p-1">
                          {items.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(idx)}><X className="h-3 w-3" /></Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30 font-medium">
                      <td colSpan={6} className="p-2 text-right">Totals:</td>
                      <td className="p-2 text-right">{totalQty.toFixed(2)}</td>
                      <td className="p-2"></td>
                      <td className="p-2 text-right">{totalAmount.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Narration</Label>
              <Input value={form.narration} onChange={(e) => setForm({ ...form, narration: e.target.value })} placeholder="Remarks / notes" />
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="text-sm text-muted-foreground">
              Net: <Badge variant="secondary" className="ml-1 text-base">{(totalAmount + (parseFloat(form.gstAmount) || 0) + (parseFloat(form.otherCharges) || 0)).toFixed(2)}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save Purchase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
