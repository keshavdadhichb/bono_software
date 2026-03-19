"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GstTaxSlab {
  id: string;
  taxName: string;
  cgstRate: number;
  sgstRate: number;
  hsnCode: string | null;
}

const emptyForm = {
  taxName: "",
  cgstRate: "",
  sgstRate: "",
  hsnCode: "",
};

export default function GstSlabsPage() {
  const [slabs, setSlabs] = useState<GstTaxSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GstTaxSlab | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<GstTaxSlab | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gst-slabs");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSlabs(data);
    } catch {
      toast.error("Failed to load GST slabs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openAddDialog() {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(item: GstTaxSlab) {
    setEditingItem(item);
    setForm({
      taxName: item.taxName,
      cgstRate: String(item.cgstRate),
      sgstRate: String(item.sgstRate),
      hsnCode: item.hsnCode || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.taxName.trim()) {
      toast.error("Tax Name is required");
      return;
    }
    if (form.cgstRate === "" || form.sgstRate === "") {
      toast.error("CGST and SGST rates are required");
      return;
    }

    setSaving(true);
    try {
      const url = editingItem
        ? `/api/gst-slabs/${editingItem.id}`
        : "/api/gst-slabs";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxName: form.taxName,
          cgstRate: parseFloat(form.cgstRate),
          sgstRate: parseFloat(form.sgstRate),
          hsnCode: form.hsnCode || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(
        editingItem
          ? "GST slab updated successfully"
          : "GST slab created successfully"
      );
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save GST slab";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingItem) return;
    try {
      const res = await fetch(`/api/gst-slabs/${deletingItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("GST slab deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchData();
    } catch {
      toast.error("Failed to delete GST slab");
    }
  }

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">GST Tax Slabs</h1>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-1" />
          Add GST Slab
        </Button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">S.No</TableHead>
                <TableHead>Tax Name</TableHead>
                <TableHead className="w-24 text-right">CGST %</TableHead>
                <TableHead className="w-24 text-right">SGST %</TableHead>
                <TableHead className="w-24 text-right">Total %</TableHead>
                <TableHead className="w-32">HSN Code</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading...
                    </p>
                  </TableCell>
                </TableRow>
              ) : slabs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No GST slabs found. Click &quot;Add GST Slab&quot; to
                    create one.
                  </TableCell>
                </TableRow>
              ) : (
                slabs.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openEditDialog(item)}
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.taxName}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.cgstRate}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.sgstRate}%
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {(item.cgstRate + item.sgstRate).toFixed(2)}%
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.hsnCode || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(item);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingItem(item);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit GST Slab" : "Add GST Slab"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="taxName">
                Tax Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="taxName"
                value={form.taxName}
                onChange={(e) => updateForm("taxName", e.target.value)}
                placeholder="e.g. GST 5%, GST 12%"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cgstRate">
                  CGST % <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cgstRate"
                  value={form.cgstRate}
                  onChange={(e) => updateForm("cgstRate", e.target.value)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sgstRate">
                  SGST % <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sgstRate"
                  value={form.sgstRate}
                  onChange={(e) => updateForm("sgstRate", e.target.value)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
            {form.cgstRate && form.sgstRate && (
              <p className="text-sm text-muted-foreground">
                Total GST:{" "}
                <strong>
                  {(
                    parseFloat(form.cgstRate || "0") +
                    parseFloat(form.sgstRate || "0")
                  ).toFixed(2)}
                  %
                </strong>
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input
                id="hsnCode"
                value={form.hsnCode}
                onChange={(e) => updateForm("hsnCode", e.target.value)}
                placeholder="HSN Code"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingItem ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete GST Slab</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete{" "}
            <strong>{deletingItem?.taxName}</strong>? This action cannot be
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
