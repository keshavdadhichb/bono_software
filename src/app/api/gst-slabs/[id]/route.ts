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

    if (!body.taxName) {
      return Response.json(
        { error: "Tax Name is required" },
        { status: 400 }
      );
    }

    if (body.cgstRate === undefined || body.sgstRate === undefined) {
      return Response.json(
        { error: "CGST and SGST rates are required" },
        { status: 400 }
      );
    }

    const slab = await db.gstTaxSlab.update({
      where: { id },
      data: {
        taxName: body.taxName,
        cgstRate: parseFloat(body.cgstRate),
        sgstRate: parseFloat(body.sgstRate),
        hsnCode: body.hsnCode || null,
      },
    });

    return Response.json(slab);
  } catch (error) {
    console.error("Failed to update GST slab:", error);
    return Response.json(
      { error: "Failed to update GST slab" },
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
    await db.gstTaxSlab.delete({ where: { id } });
    return Response.json({ message: "GST slab deleted successfully" });
  } catch (error) {
    console.error("Failed to delete GST slab:", error);
    return Response.json(
      { error: "Failed to delete GST slab" },
      { status: 500 }
    );
  }
}
