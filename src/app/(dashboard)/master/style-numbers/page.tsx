"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Tag, Loader2 } from "lucide-react";
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

interface StyleItem {
  id: string;
  styleNo: string;
  styleReference: string | null;
  styleType: string | null;
  description: string | null;
}

const emptyForm = { styleNo: "", styleReference: "", styleType: "", description: "" };

export default function StyleNumbersPage() {
  const [items, setItems] = useState<StyleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StyleItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<StyleItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/style-numbers");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      toast.error("Failed to load style numbers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdd() { setEditing(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(item: StyleItem) {
    setEditing(item);
    setForm({
      styleNo: item.styleNo,
      styleReference: item.styleReference || "",
      styleType: item.styleType || "",
      description: item.description || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.styleNo.trim()) { toast.error("Style No is required"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/style-numbers/${editing.id}` : "/api/style-numbers";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(editing ? "Updated" : "Created");
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/style-numbers/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      setDeleteOpen(false); setDeleting(null); fetchData();
    } catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Style Numbers</h1>
        </div>
        <Button size="sm" className="h-8 text-[13px]" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Style</Button>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-[11px] uppercase tracking-wide">S.No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Style No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Reference</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Type</TableHead>
                <TableHead className="hidden md:table-cell text-[11px] uppercase tracking-wide">Description</TableHead>
                <TableHead className="w-20 text-right text-[11px] uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No style numbers found.</TableCell></TableRow>
              ) : items.map((item, idx) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(item)}>
                  <TableCell className="text-[13px] font-mono text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="text-[13px] font-medium">{item.styleNo}</TableCell>
                  <TableCell className="text-[13px]">{item.styleReference || "-"}</TableCell>
                  <TableCell className="text-[13px]">{item.styleType || "-"}</TableCell>
                  <TableCell className="text-[13px] hidden md:table-cell text-muted-foreground">{item.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(item); }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleting(item); setDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Style" : "Add Style"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Style No <span className="text-destructive">*</span></Label>
              <Input value={form.styleNo} onChange={(e) => setForm({ ...form, styleNo: e.target.value })} placeholder="e.g. ST-001" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Reference</Label>
              <Input value={form.styleReference} onChange={(e) => setForm({ ...form, styleReference: e.target.value })} placeholder="Style reference" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Type</Label>
              <Input value={form.styleType} onChange={(e) => setForm({ ...form, styleType: e.target.value })} placeholder="e.g. T-Shirt, Polo" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Style</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Delete <strong>{deleting?.styleNo}</strong>?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
