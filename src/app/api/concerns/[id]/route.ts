import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckPut = await requirePermission("canEditMaster"); if (authCheckPut) return authCheckPut;
    const { id } = await params;
    const body = await request.json();
    if (!body.concernName?.trim()) {
      return Response.json({ error: "Concern Name is required" }, { status: 400 });
    }
    const concern = await db.concern.update({
      where: { id },
      data: { concernName: body.concernName.trim(), isActive: body.isActive !== false },
    });
    return Response.json(concern);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "Concern already exists" }, { status: 400 });
    }
    console.error("Failed to update concern:", error);
    return Response.json({ error: "Failed to update concern" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckDel = await requirePermission("canDeleteMaster"); if (authCheckDel) return authCheckDel;
    const { id } = await params;
    await db.concern.delete({ where: { id } });
    return Response.json({ message: "Deleted" });
  } catch (error) {
    console.error("Failed to delete concern:", error);
    return Response.json({ error: "Failed to delete concern" }, { status: 500 });
  }
}
