"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface FabricItem {
  id: string;
  clothDescription: string;
  dia: string | null;
  gsm: number | null;
  content: string | null;
  isActive: boolean;
}

const emptyForm = { clothDescription: "", dia: "", gsm: "", content: "", isActive: true };

export default function FabricMastersPage() {
  const [items, setItems] = useState<FabricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FabricItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<FabricItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fabric-masters");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      toast.error("Failed to load fabric masters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdd() { setEditing(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(item: FabricItem) {
    setEditing(item);
    setForm({
      clothDescription: item.clothDescription,
      dia: item.dia || "",
      gsm: item.gsm?.toString() || "",
      content: item.content || "",
      isActive: item.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.clothDescription.trim()) { toast.error("Cloth Description is required"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/fabric-masters/${editing.id}` : "/api/fabric-masters";
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
      const res = await fetch(`/api/fabric-masters/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      setDeleteOpen(false); setDeleting(null); fetchData();
    } catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Fabric Masters</h1>
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Fabric</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">S.No</TableHead>
                <TableHead>Cloth Description</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead>GSM</TableHead>
                <TableHead className="hidden md:table-cell">Content</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No fabric masters found.</TableCell></TableRow>
              ) : items.map((item, idx) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(item)}>
                  <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{item.clothDescription}</TableCell>
                  <TableCell>{item.dia || "-"}</TableCell>
                  <TableCell>{item.gsm ?? "-"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{item.content || "-"}</TableCell>
                  <TableCell><Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge></TableCell>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Fabric" : "Add Fabric"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Cloth Description <span className="text-destructive">*</span></Label>
              <Input value={form.clothDescription} onChange={(e) => setForm({ ...form, clothDescription: e.target.value })} placeholder="e.g. Single Jersey" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Dia (Width)</Label>
                <Input value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value })} placeholder="e.g. 26D" />
              </div>
              <div className="space-y-1.5">
                <Label>GSM</Label>
                <Input type="number" value={form.gsm} onChange={(e) => setForm({ ...form, gsm: e.target.value })} placeholder="e.g. 180" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="e.g. 100% Cotton" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="isActive">Active</Label>
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
          <DialogHeader><DialogTitle>Delete Fabric</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Delete <strong>{deleting?.clothDescription}</strong>?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
