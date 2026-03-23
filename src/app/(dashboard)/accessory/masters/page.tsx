"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Group { id: string; groupName: string; hsnCode: string | null; gstPercent: number; _count: { items: number }; }
interface Master { id: string; accessoryName: string; groupId: string; group: { groupName: string }; purchaseUom: string | null; stockUom: string | null; minimumStock: number; hsnCode: string | null; gstPercent: number; isActive: boolean; }

export default function AccessoryMastersPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Group dialog
  const [gDialogOpen, setGDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [gForm, setGForm] = useState({ groupName: "", hsnCode: "", gstPercent: "" });
  const [gDeleteOpen, setGDeleteOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  // Master dialog
  const [mDialogOpen, setMDialogOpen] = useState(false);
  const [editingMaster, setEditingMaster] = useState<Master | null>(null);
  const [mForm, setMForm] = useState({ accessoryName: "", groupId: "", purchaseUom: "", stockUom: "", minimumStock: "", hsnCode: "", gstPercent: "", isActive: true });
  const [mDeleteOpen, setMDeleteOpen] = useState(false);
  const [deletingMaster, setDeletingMaster] = useState<Master | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, mRes] = await Promise.all([fetch("/api/accessory/groups"), fetch("/api/accessory/masters")]);
      setGroups(await gRes.json());
      setMasters(await mRes.json());
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Group CRUD
  function openAddGroup() { setEditingGroup(null); setGForm({ groupName: "", hsnCode: "", gstPercent: "" }); setGDialogOpen(true); }
  function openEditGroup(g: Group) { setEditingGroup(g); setGForm({ groupName: g.groupName, hsnCode: g.hsnCode || "", gstPercent: g.gstPercent.toString() }); setGDialogOpen(true); }

  async function saveGroup() {
    if (!gForm.groupName.trim()) { toast.error("Group Name required"); return; }
    setSaving(true);
    try {
      const url = editingGroup ? `/api/accessory/groups/${editingGroup.id}` : "/api/accessory/groups";
      const res = await fetch(url, { method: editingGroup ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(gForm) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(editingGroup ? "Updated" : "Created");
      setGDialogOpen(false); fetchAll();
    } catch (err: any) { toast.error(err.message || "Failed"); }
    finally { setSaving(false); }
  }

  async function deleteGroup() {
    if (!deletingGroup) return;
    try { await fetch(`/api/accessory/groups/${deletingGroup.id}`, { method: "DELETE" }); toast.success("Deleted"); setGDeleteOpen(false); fetchAll(); }
    catch { toast.error("Failed to delete"); }
  }

  // Master CRUD
  function openAddMaster() { setEditingMaster(null); setMForm({ accessoryName: "", groupId: "", purchaseUom: "", stockUom: "", minimumStock: "", hsnCode: "", gstPercent: "", isActive: true }); setMDialogOpen(true); }
  function openEditMaster(m: Master) {
    setEditingMaster(m);
    setMForm({ accessoryName: m.accessoryName, groupId: m.groupId, purchaseUom: m.purchaseUom || "", stockUom: m.stockUom || "", minimumStock: m.minimumStock.toString(), hsnCode: m.hsnCode || "", gstPercent: m.gstPercent.toString(), isActive: m.isActive });
    setMDialogOpen(true);
  }

  async function saveMaster() {
    if (!mForm.accessoryName.trim()) { toast.error("Name required"); return; }
    if (!mForm.groupId) { toast.error("Group required"); return; }
    setSaving(true);
    try {
      const url = editingMaster ? `/api/accessory/masters/${editingMaster.id}` : "/api/accessory/masters";
      const res = await fetch(url, { method: editingMaster ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mForm) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(editingMaster ? "Updated" : "Created");
      setMDialogOpen(false); fetchAll();
    } catch (err: any) { toast.error(err.message || "Failed"); }
    finally { setSaving(false); }
  }

  async function deleteMaster() {
    if (!deletingMaster) return;
    try { await fetch(`/api/accessory/masters/${deletingMaster.id}`, { method: "DELETE" }); toast.success("Deleted"); setMDeleteOpen(false); fetchAll(); }
    catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="size-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Accessory Masters</h1>
      </div>

      <Tabs defaultValue="groups">
        <TabsList>
          <TabsTrigger value="groups">Groups ({groups.length})</TabsTrigger>
          <TabsTrigger value="items">Items ({masters.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openAddGroup}><Plus className="h-4 w-4 mr-1" /> Add Group</Button>
          </div>
          <Card className="border-0 shadow-sm bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 text-[11px] uppercase tracking-wide">S.No</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Group Name</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">HSN Code</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">GST %</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Items</TableHead>
                  <TableHead className="w-20 text-right text-[11px] uppercase tracking-wide">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : groups.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No groups found.</TableCell></TableRow>
                ) : groups.map((g, idx) => (
                  <TableRow key={g.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEditGroup(g)}>
                    <TableCell className="text-[13px] font-mono text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="text-[13px] font-medium">{g.groupName}</TableCell>
                    <TableCell className="text-[13px]">{g.hsnCode || "-"}</TableCell>
                    <TableCell className="text-[13px]">{g.gstPercent}%</TableCell>
                    <TableCell><Badge variant="secondary">{g._count.items}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditGroup(g); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingGroup(g); setGDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openAddMaster}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
          </div>
          <Card className="border-0 shadow-sm bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-[11px] uppercase tracking-wide">S.No</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Accessory Name</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Group</TableHead>
                    <TableHead className="hidden md:table-cell text-[11px] uppercase tracking-wide">Purchase UOM</TableHead>
                    <TableHead className="hidden md:table-cell text-[11px] uppercase tracking-wide">Stock UOM</TableHead>
                    <TableHead className="hidden md:table-cell text-[11px] uppercase tracking-wide">Min Stock</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Status</TableHead>
                    <TableHead className="w-20 text-right text-[11px] uppercase tracking-wide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : masters.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No items found.</TableCell></TableRow>
                  ) : masters.map((m, idx) => (
                    <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEditMaster(m)}>
                      <TableCell className="text-[13px] font-mono text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-[13px] font-medium">{m.accessoryName}</TableCell>
                      <TableCell className="text-[13px]">{m.group.groupName}</TableCell>
                      <TableCell className="hidden md:table-cell text-[13px]">{m.purchaseUom || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell text-[13px]">{m.stockUom || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell text-[13px]">{m.minimumStock}</TableCell>
                      <TableCell><Badge variant={m.isActive ? "default" : "secondary"}>{m.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditMaster(m); }}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingMaster(m); setMDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Group Dialog */}
      <Dialog open={gDialogOpen} onOpenChange={setGDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingGroup ? "Edit Group" : "Add Group"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5"><Label>Group Name <span className="text-destructive">*</span></Label><Input value={gForm.groupName} onChange={(e) => setGForm({ ...gForm, groupName: e.target.value })} placeholder="e.g. Buttons, Zippers" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>HSN Code</Label><Input value={gForm.hsnCode} onChange={(e) => setGForm({ ...gForm, hsnCode: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>GST %</Label><Input type="number" value={gForm.gstPercent} onChange={(e) => setGForm({ ...gForm, gstPercent: e.target.value })} placeholder="0" /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveGroup} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{editingGroup ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={gDeleteOpen} onOpenChange={setGDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Group</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Delete <strong>{deletingGroup?.groupName}</strong>?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteGroup}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Master Dialog */}
      <Dialog open={mDialogOpen} onOpenChange={setMDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingMaster ? "Edit Item" : "Add Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5"><Label>Accessory Name <span className="text-destructive">*</span></Label><Input value={mForm.accessoryName} onChange={(e) => setMForm({ ...mForm, accessoryName: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Group <span className="text-destructive">*</span></Label>
              <select className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={mForm.groupId} onChange={(e) => setMForm({ ...mForm, groupId: e.target.value })}>
                <option value="">Select Group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.groupName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Purchase UOM</Label><Input value={mForm.purchaseUom} onChange={(e) => setMForm({ ...mForm, purchaseUom: e.target.value })} placeholder="e.g. Box, Grs" /></div>
              <div className="space-y-1.5"><Label>Stock UOM</Label><Input value={mForm.stockUom} onChange={(e) => setMForm({ ...mForm, stockUom: e.target.value })} placeholder="e.g. Nos, Pcs" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Min Stock</Label><Input type="number" value={mForm.minimumStock} onChange={(e) => setMForm({ ...mForm, minimumStock: e.target.value })} placeholder="0" /></div>
              <div className="space-y-1.5"><Label>HSN Code</Label><Input value={mForm.hsnCode} onChange={(e) => setMForm({ ...mForm, hsnCode: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>GST %</Label><Input type="number" value={mForm.gstPercent} onChange={(e) => setMForm({ ...mForm, gstPercent: e.target.value })} placeholder="0" /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={mForm.isActive} onChange={(e) => setMForm({ ...mForm, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveMaster} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{editingMaster ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={mDeleteOpen} onOpenChange={setMDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Item</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Delete <strong>{deletingMaster?.accessoryName}</strong>?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteMaster}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
