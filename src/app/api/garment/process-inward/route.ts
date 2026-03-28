import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canViewGarment"); if (authCheck) return authCheck;
    const searchParams = request.nextUrl.searchParams;
    const processType = searchParams.get("processType");
    const partyId = searchParams.get("partyId");

    const where: Record<string, unknown> = {};
    if (processType && processType !== "All") {
      where.processType = processType;
    }
    if (partyId) {
      where.partyId = partyId;
    }

    const inwards = await db.garmentProcessInward.findMany({
      where,
      include: {
        party: true,
        items: { orderBy: { slNo: "asc" } },
      },
      orderBy: { dcDate: "desc" },
    });

    return Response.json(inwards);
  } catch (error) {
    console.error("Failed to fetch garment process inwards:", error);
    return Response.json(
      { error: "Failed to fetch garment process inwards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canEditGarment"); if (authCheck) return authCheck;
    const body = await request.json();

    if (!body.dcNo || !body.processType || !body.partyId) {
      return Response.json(
        { error: "DC No, Process Type and Party are required" },
        { status: 400 }
      );
    }

    const storeId = body.storeId || "default";
    const parsedItems = (body.items || []).map(
      (
        item: {
          slNo?: number;
          bundleNo?: string;
          lotNo?: string;
          styleNo?: string;
          styleRef?: string;
          part?: string;
          color?: string;
          size?: string;
          goodQty?: number;
          defectQty?: number;
          uom?: string;
        },
        index: number
      ) => ({
        slNo: item.slNo || index + 1,
        bundleNo: item.bundleNo || null,
        lotNo: item.lotNo || null,
        styleNo: item.styleNo || null,
        styleRef: item.styleRef || null,
        part: item.part || null,
        color: item.color || null,
        size: item.size || null,
        goodQty: item.goodQty || 0,
        defectQty: item.defectQty || 0,
        uom: item.uom || "Pcs",
      })
    );

    const inward = await db.$transaction(async (tx: any) => {
      const created = await tx.garmentProcessInward.create({
        data: {
          dcNo: body.dcNo,
          dcDate: new Date(body.dcDate || new Date()),
          processType: body.processType,
          storeId: body.storeId || null,
          partyId: body.partyId,
          pdcNo: body.pdcNo || null,
          pdcDate: body.pdcDate ? new Date(body.pdcDate) : null,
          narration: body.narration || null,
          vehicleNo: body.vehicleNo || null,
          totalQty: body.totalQty || 0,
          totalAmount: body.totalAmount || 0,
          items: { create: parsedItems },
        },
        include: {
          party: true,
          items: { orderBy: { slNo: "asc" } },
        },
      });

      // Add good qty to GarmentStock (only good pieces, not defects)
      for (const item of parsedItems) {
        if (item.goodQty <= 0) continue;
        const existing = await tx.garmentStock.findFirst({
          where: {
            storeId,
            lotNo: item.lotNo || "",
            styleNo: item.styleNo || null,
            part: item.part || null,
            color: item.color || null,
            size: item.size || null,
          },
        });
        if (existing) {
          await tx.garmentStock.update({
            where: { id: existing.id },
            data: {
              qty: { increment: item.goodQty },
              process: body.processType,
            },
          });
        } else {
          await tx.garmentStock.create({
            data: {
              storeId,
              lotNo: item.lotNo || "",
              styleNo: item.styleNo || null,
              styleRef: item.styleRef || null,
              part: item.part || null,
              color: item.color || null,
              size: item.size || null,
              qty: item.goodQty,
              uom: item.uom,
              process: body.processType,
            },
          });
        }
      }

      return created;
    });

    return Response.json(inward, { status: 201 });
  } catch (error) {
    console.error("Failed to create garment process inward:", error);
    return Response.json(
      { error: "Failed to create garment process inward" },
      { status: 500 }
    );
  }
}
