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
    if (!body.colorName?.trim()) {
      return Response.json({ error: "Color Name is required" }, { status: 400 });
    }
    const color = await db.color.update({
      where: { id },
      data: { colorCode: body.colorCode || null, colorName: body.colorName.trim() },
    });
    return Response.json(color);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "Color already exists" }, { status: 400 });
    }
    console.error("Failed to update color:", error);
    return Response.json({ error: "Failed to update color" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckDel = await requirePermission("canDeleteMaster"); if (authCheckDel) return authCheckDel;
    const { id } = await params;
    await db.color.delete({ where: { id } });
    return Response.json({ message: "Deleted" });
  } catch (error) {
    console.error("Failed to delete color:", error);
    return Response.json({ error: "Failed to delete color" }, { status: 500 });
  }
}
