"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PARTY_TYPES = [
  "Supplier",
  "Customer",
  "Contractor",
  "Transporter",
  "Job Worker",
];

const PAGE_SIZE = 20;

interface Party {
  id: string;
  partyCode: string | null;
  partyName: string;
  partyType: string;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  gstNo: string | null;
  panNo: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankIfscCode: string | null;
  creditDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  partyName: "",
  partyType: "",
  address1: "",
  address2: "",
  address3: "",
  address4: "",
  district: "",
  state: "",
  pincode: "",
  phone: "",
  mobile: "",
  email: "",
  gstNo: "",
  panNo: "",
  bankName: "",
  bankAccountNo: "",
  bankIfscCode: "",
  creditDays: "0",
  isActive: true,
};

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingParty, setDeletingParty] = useState<Party | null>(null);

  const fetchParties = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filterType === "All"
          ? "/api/parties"
          : `/api/parties?type=${encodeURIComponent(filterType)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setParties(data);
    } catch {
      toast.error("Failed to load parties");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  // Filter by search
  const filtered = parties.filter((p) =>
    p.partyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  function openAddDialog() {
    setEditingParty(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(party: Party) {
    setEditingParty(party);
    setForm({
      partyName: party.partyName,
      partyType: party.partyType,
      address1: party.address1 || "",
      address2: party.address2 || "",
      address3: party.address3 || "",
      address4: party.address4 || "",
      district: party.district || "",
      state: party.state || "",
      pincode: party.pincode || "",
      phone: party.phone || "",
      mobile: party.mobile || "",
      email: party.email || "",
      gstNo: party.gstNo || "",
      panNo: party.panNo || "",
      bankName: party.bankName || "",
      bankAccountNo: party.bankAccountNo || "",
      bankIfscCode: party.bankIfscCode || "",
      creditDays: String(party.creditDays),
      isActive: party.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.partyName.trim()) {
      toast.error("Party Name is required");
      return;
    }
    if (!form.partyType) {
      toast.error("Party Type is required");
      return;
    }

    setSaving(true);
    try {
      const url = editingParty
        ? `/api/parties/${editingParty.id}`
        : "/api/parties";
      const method = editingParty ? "PUT" : "POST";

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
        editingParty ? "Party updated successfully" : "Party created successfully"
      );
      setDialogOpen(false);
      fetchParties();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save party";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingParty) return;
    try {
      const res = await fetch(`/api/parties/${deletingParty.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Party deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingParty(null);
      fetchParties();
    } catch {
      toast.error("Failed to delete party");
    }
  }

  function exportToExcel() {
    const exportData = filtered.map((p, idx) => ({
      "S.No": idx + 1,
      "Party Name": p.partyName,
      Type: p.partyType,
      Mobile: p.mobile || "",
      Phone: p.phone || "",
      Email: p.email || "",
      "GST No": p.gstNo || "",
      PAN: p.panNo || "",
      Address: [p.address1, p.address2, p.address3, p.address4]
        .filter(Boolean)
        .join(", "),
      District: p.district || "",
      State: p.state || "",
      Pincode: p.pincode || "",
      "Bank Name": p.bankName || "",
      "Account No": p.bankAccountNo || "",
      IFSC: p.bankIfscCode || "",
      "Credit Days": p.creditDays,
      Status: p.isActive ? "Active" : "Inactive",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Parties");
    XLSX.writeFile(wb, "Parties.xlsx");
    toast.success("Exported to Excel");
  }

  function updateForm(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Parties</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" />
            Add Party
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                {PARTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by party name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">S.No</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-32">Mobile</TableHead>
                <TableHead className="w-36">GST No</TableHead>
                <TableHead className="w-28">State</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading parties...
                    </p>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No parties found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((party, idx) => (
                  <TableRow
                    key={party.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openEditDialog(party)}
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      {(currentPage - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {party.partyName}
                    </TableCell>
                    <TableCell>{party.partyType}</TableCell>
                    <TableCell>{party.mobile || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {party.gstNo || "-"}
                    </TableCell>
                    <TableCell>{party.state || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={party.isActive ? "default" : "secondary"}
                      >
                        {party.isActive ? "Active" : "Inactive"}
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
                            openEditDialog(party);
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
                            setDeletingParty(party);
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

        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingParty ? "Edit Party" : "Add Party"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {/* Party Name */}
            <div className="space-y-1.5">
              <Label htmlFor="partyName">
                Party Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="partyName"
                value={form.partyName}
                onChange={(e) => updateForm("partyName", e.target.value)}
                placeholder="Enter party name"
              />
            </div>

            {/* Party Type */}
            <div className="space-y-1.5">
              <Label>
                Party Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.partyType}
                onValueChange={(v) => updateForm("partyType", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PARTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Address Line 1</Label>
              <Input
                value={form.address1}
                onChange={(e) => updateForm("address1", e.target.value)}
                placeholder="Address line 1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address Line 2</Label>
              <Input
                value={form.address2}
                onChange={(e) => updateForm("address2", e.target.value)}
                placeholder="Address line 2"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address Line 3</Label>
              <Input
                value={form.address3}
                onChange={(e) => updateForm("address3", e.target.value)}
                placeholder="Address line 3"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address Line 4</Label>
              <Input
                value={form.address4}
                onChange={(e) => updateForm("address4", e.target.value)}
                placeholder="Address line 4"
              />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Input
                value={form.district}
                onChange={(e) => updateForm("district", e.target.value)}
                placeholder="District"
              />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) => updateForm("state", e.target.value)}
                placeholder="State"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pincode</Label>
              <Input
                value={form.pincode}
                onChange={(e) => updateForm("pincode", e.target.value)}
                placeholder="Pincode"
              />
            </div>

            <Separator className="sm:col-span-2" />

            {/* Contact */}
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input
                value={form.mobile}
                onChange={(e) => updateForm("mobile", e.target.value)}
                placeholder="Mobile number"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="Email address"
                type="email"
              />
            </div>

            <Separator className="sm:col-span-2" />

            {/* Tax */}
            <div className="space-y-1.5">
              <Label>GST No</Label>
              <Input
                value={form.gstNo}
                onChange={(e) => updateForm("gstNo", e.target.value)}
                placeholder="GST Number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>PAN</Label>
              <Input
                value={form.panNo}
                onChange={(e) => updateForm("panNo", e.target.value)}
                placeholder="PAN Number"
              />
            </div>

            <Separator className="sm:col-span-2" />

            {/* Bank */}
            <div className="space-y-1.5">
              <Label>Bank Name</Label>
              <Input
                value={form.bankName}
                onChange={(e) => updateForm("bankName", e.target.value)}
                placeholder="Bank name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Account No</Label>
              <Input
                value={form.bankAccountNo}
                onChange={(e) => updateForm("bankAccountNo", e.target.value)}
                placeholder="Account number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>IFSC Code</Label>
              <Input
                value={form.bankIfscCode}
                onChange={(e) => updateForm("bankIfscCode", e.target.value)}
                placeholder="IFSC code"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Credit Days</Label>
              <Input
                value={form.creditDays}
                onChange={(e) => updateForm("creditDays", e.target.value)}
                placeholder="0"
                type="number"
              />
            </div>

            <Separator className="sm:col-span-2" />

            {/* Active status */}
            <div className="flex items-center gap-2 sm:col-span-2">
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
              {editingParty ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Party</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete{" "}
            <strong>{deletingParty?.partyName}</strong>? This action cannot be
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
