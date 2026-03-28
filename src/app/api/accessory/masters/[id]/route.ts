import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckPut = await requirePermission("canEditAccessory"); if (authCheckPut) return authCheckPut;
    const { id } = await params;
    const body = await request.json();
    if (!body.accessoryName?.trim()) return Response.json({ error: "Name required" }, { status: 400 });
    const master = await db.accessoryMaster.update({
      where: { id },
      data: {
        accessoryName: body.accessoryName.trim(),
        groupId: body.groupId,
        purchaseUom: body.purchaseUom || null,
        stockUom: body.stockUom || null,
        minimumStock: parseFloat(body.minimumStock) || 0,
        hsnCode: body.hsnCode || null,
        gstPercent: parseFloat(body.gstPercent) || 0,
        isActive: body.isActive !== false,
      },
    });
    return Response.json(master);
  } catch (error) {
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckDel = await requirePermission("canDeleteAccessory"); if (authCheckDel) return authCheckDel;
    const { id } = await params;
    await db.accessoryMaster.delete({ where: { id } });
    return Response.json({ message: "Deleted" });
  } catch (error) {
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
