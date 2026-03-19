"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Store as StoreIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface StoreItem {
  id: string;
  storeName: string;
  storeLocation: string | null;
  isActive: boolean;
}

const emptyForm = {
  storeName: "",
  storeLocation: "",
  isActive: true,
};

export default function StoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStore, setDeletingStore] = useState<StoreItem | null>(null);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stores");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStores(data);
    } catch {
      toast.error("Failed to load stores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  function openAddDialog() {
    setEditingStore(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(store: StoreItem) {
    setEditingStore(store);
    setForm({
      storeName: store.storeName,
      storeLocation: store.storeLocation || "",
      isActive: store.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.storeName.trim()) {
      toast.error("Store Name is required");
      return;
    }

    setSaving(true);
    try {
      const url = editingStore
        ? `/api/stores/${editingStore.id}`
        : "/api/stores";
      const method = editingStore ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(
        editingStore
          ? "Store updated successfully"
          : "Store created successfully"
      );
      setDialogOpen(false);
      fetchStores();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save store";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingStore) return;
    try {
      const res = await fetch(`/api/stores/${deletingStore.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Store deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingStore(null);
      fetchStores();
    } catch {
      toast.error("Failed to delete store");
    }
  }

  function updateForm(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StoreIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Stores</h1>
        </div>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-1" />
          Add Store
        </Button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">S.No</TableHead>
                <TableHead>Store Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading stores...
                    </p>
                  </TableCell>
                </TableRow>
              ) : stores.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No stores found. Click &quot;Add Store&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store, idx) => (
                  <TableRow
                    key={store.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openEditDialog(store)}
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {store.storeName}
                    </TableCell>
                    <TableCell>{store.storeLocation || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={store.isActive ? "default" : "secondary"}
                      >
                        {store.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(store);
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
                            setDeletingStore(store);
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
              {editingStore ? "Edit Store" : "Add Store"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="storeName">
                Store Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="storeName"
                value={form.storeName}
                onChange={(e) => updateForm("storeName", e.target.value)}
                placeholder="Enter store name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storeLocation">Location</Label>
              <Input
                id="storeLocation"
                value={form.storeLocation}
                onChange={(e) => updateForm("storeLocation", e.target.value)}
                placeholder="Enter location"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => updateForm("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
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
              {editingStore ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Store</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete{" "}
            <strong>{deletingStore?.storeName}</strong>? This action cannot be
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
