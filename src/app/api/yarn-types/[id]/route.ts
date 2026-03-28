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

    if (!body.typeName) {
      return Response.json(
        { error: "Type Name is required" },
        { status: 400 }
      );
    }

    const yarnType = await db.yarnType.update({
      where: { id },
      data: {
        typeName: body.typeName,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return Response.json(yarnType);
  } catch (error) {
    console.error("Failed to update yarn type:", error);
    return Response.json(
      { error: "Failed to update yarn type" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckDel = await requirePermission("canDeleteMaster"); if (authCheckDel) return authCheckDel;
    const { id } = await params;
    await db.yarnType.delete({ where: { id } });
    return Response.json({ message: "Yarn type deleted successfully" });
  } catch (error) {
    console.error("Failed to delete yarn type:", error);
    return Response.json(
      { error: "Failed to delete yarn type" },
      { status: 500 }
    );
  }
}
