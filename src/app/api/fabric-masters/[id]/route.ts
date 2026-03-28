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
    if (!body.clothDescription?.trim()) {
      return Response.json({ error: "Cloth Description is required" }, { status: 400 });
    }
    const fabric = await db.fabricMaster.update({
      where: { id },
      data: {
        clothDescription: body.clothDescription.trim(),
        dia: body.dia || null,
        gsm: body.gsm ? parseInt(body.gsm) : null,
        content: body.content || null,
        isActive: body.isActive !== false,
      },
    });
    return Response.json(fabric);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "This fabric combination already exists" }, { status: 400 });
    }
    console.error("Failed to update fabric master:", error);
    return Response.json({ error: "Failed to update fabric master" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckDel = await requirePermission("canDeleteMaster"); if (authCheckDel) return authCheckDel;
    const { id } = await params;
    await db.fabricMaster.delete({ where: { id } });
    return Response.json({ message: "Deleted" });
  } catch (error) {
    console.error("Failed to delete fabric master:", error);
    return Response.json({ error: "Failed to delete fabric master" }, { status: 500 });
  }
}
