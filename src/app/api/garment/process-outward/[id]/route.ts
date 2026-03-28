import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requirePermission("canViewGarment"); if (authCheck) return authCheck;
    const { id } = await params;
    const outward = await db.garmentProcessOutward.findUnique({
      where: { id },
      include: {
        party: true,
        items: { orderBy: { slNo: "asc" } },
      },
    });

    if (!outward) {
      return Response.json(
        { error: "Garment process outward not found" },
        { status: 404 }
      );
    }

    return Response.json(outward);
  } catch (error) {
    console.error("Failed to fetch garment process outward:", error);
    return Response.json(
      { error: "Failed to fetch garment process outward" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckPut = await requirePermission("canEditGarment"); if (authCheckPut) return authCheckPut;
    const { id } = await params;
    const body = await request.json();

    // Delete existing items and recreate
    await db.garmentProcessOutwardItem.deleteMany({
      where: { outwardId: id },
    });

    const outward = await db.garmentProcessOutward.update({
      where: { id },
      data: {
        dcNo: body.dcNo,
        dcDate: new Date(body.dcDate),
        processType: body.processType,
        storeId: body.storeId || null,
        partyId: body.partyId,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        remarks: body.remarks || null,
        vehicleNo: body.vehicleNo || null,
        transport: body.transport || null,
        totalQty: body.totalQty || 0,
        totalAmount: body.totalAmount || 0,
        status: body.status || "Open",
        items: {
          create: (body.items || []).map(
            (
              item: {
                slNo?: number;
                bundleNo?: string;
                lotNo?: string;
                styleNo?: string;
                styleRef?: string;
                styleType?: string;
                part?: string;
                color?: string;
                size?: string;
                qty?: number;
                uom?: string;
                rate?: number;
                amount?: number;
              },
              index: number
            ) => ({
              slNo: item.slNo || index + 1,
              bundleNo: item.bundleNo || null,
              lotNo: item.lotNo || null,
              styleNo: item.styleNo || null,
              styleRef: item.styleRef || null,
              styleType: item.styleType || null,
              part: item.part || null,
              color: item.color || null,
              size: item.size || null,
              qty: item.qty || 0,
              uom: item.uom || "Pcs",
              rate: item.rate || 0,
              amount: item.amount || 0,
            })
          ),
        },
      },
      include: {
        party: true,
        items: { orderBy: { slNo: "asc" } },
      },
    });

    return Response.json(outward);
  } catch (error) {
    console.error("Failed to update garment process outward:", error);
    return Response.json(
      { error: "Failed to update garment process outward" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckDel = await requirePermission("canDeleteGarment"); if (authCheckDel) return authCheckDel;
    const { id } = await params;
    await db.garmentProcessOutward.delete({ where: { id } });
    return Response.json({ message: "Garment process outward deleted successfully" });
  } catch (error) {
    console.error("Failed to delete garment process outward:", error);
    return Response.json(
      { error: "Failed to delete garment process outward" },
      { status: 500 }
    );
  }
}
