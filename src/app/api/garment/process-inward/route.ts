import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
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
    const body = await request.json();

    if (!body.dcNo || !body.processType || !body.partyId) {
      return Response.json(
        { error: "DC No, Process Type and Party are required" },
        { status: 400 }
      );
    }

    const inward = await db.garmentProcessInward.create({
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
        items: {
          create: (body.items || []).map(
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
          ),
        },
      },
      include: {
        party: true,
        items: { orderBy: { slNo: "asc" } },
      },
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
