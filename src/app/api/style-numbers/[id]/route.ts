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
    if (!body.styleNo?.trim()) {
      return Response.json({ error: "Style No is required" }, { status: 400 });
    }
    const style = await db.styleNumber.update({
      where: { id },
      data: {
        styleNo: body.styleNo.trim(),
        styleReference: body.styleReference || null,
        styleType: body.styleType || null,
        description: body.description || null,
      },
    });
    return Response.json(style);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "Style No already exists" }, { status: 400 });
    }
    console.error("Failed to update style number:", error);
    return Response.json({ error: "Failed to update style number" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckDel = await requirePermission("canDeleteMaster"); if (authCheckDel) return authCheckDel;
    const { id } = await params;
    await db.styleNumber.delete({ where: { id } });
    return Response.json({ message: "Deleted" });
  } catch (error) {
    console.error("Failed to delete style number:", error);
    return Response.json({ error: "Failed to delete style number" }, { status: 500 });
  }
}
