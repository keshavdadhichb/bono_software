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

    if (!body.storeName) {
      return Response.json(
        { error: "Store Name is required" },
        { status: 400 }
      );
    }

    const store = await db.store.update({
      where: { id },
      data: {
        storeName: body.storeName,
        storeLocation: body.storeLocation || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return Response.json(store);
  } catch (error) {
    console.error("Failed to update store:", error);
    return Response.json(
      { error: "Failed to update store" },
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
    await db.store.delete({ where: { id } });
    return Response.json({ message: "Store deleted successfully" });
  } catch (error) {
    console.error("Failed to delete store:", error);
    return Response.json(
      { error: "Failed to delete store" },
      { status: 500 }
    );
  }
}
