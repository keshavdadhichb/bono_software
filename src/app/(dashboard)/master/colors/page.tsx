"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Palette, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface ColorItem {
  id: string;
  colorCode: string | null;
  colorName: string;
}

const emptyForm = { colorCode: "", colorName: "" };

export default function ColorsPage() {
  const [items, setItems] = useState<ColorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ColorItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<ColorItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/colors");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      toast.error("Failed to load colors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(item: ColorItem) {
    setEditing(item);
    setForm({ colorCode: item.colorCode || "", colorName: item.colorName });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.colorName.trim()) { toast.error("Color Name is required"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/colors/${editing.id}` : "/api/colors";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(editing ? "Color updated" : "Color created");
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/colors/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Color deleted");
      setDeleteOpen(false);
      setDeleting(null);
      fetchData();
    } catch {
      toast.error("Failed to delete color");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Colors</h1>
        </div>
        <Button size="sm" className="h-8 text-[13px]" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Color
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-[11px] uppercase tracking-wide">S.No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Color Code</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Color Name</TableHead>
                <TableHead className="w-20 text-right text-[11px] uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No colors found. Click &quot;Add Color&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, idx) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(item)}>
                    <TableCell className="text-[13px] font-mono text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="text-[13px]">{item.colorCode || "-"}</TableCell>
                    <TableCell className="text-[13px] font-medium">{item.colorName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleting(item); setDeleteOpen(true); }}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Color" : "Add Color"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Color Code</Label>
              <Input value={form.colorCode} onChange={(e) => setForm({ ...form, colorCode: e.target.value })} placeholder="e.g. RED, BLU" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Color Name <span className="text-destructive">*</span></Label>
              <Input value={form.colorName} onChange={(e) => setForm({ ...form, colorName: e.target.value })} placeholder="Enter color name" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Color</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete <strong>{deleting?.colorName}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
