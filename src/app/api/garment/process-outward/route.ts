import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const processType = searchParams.get("processType");
    const status = searchParams.get("status");
    const partyId = searchParams.get("partyId");

    const where: Record<string, unknown> = {};
    if (processType && processType !== "All") {
      where.processType = processType;
    }
    if (status && status !== "All") {
      where.status = status;
    }
    if (partyId) {
      where.partyId = partyId;
    }

    const outwards = await db.garmentProcessOutward.findMany({
      where,
      include: {
        party: true,
        items: { orderBy: { slNo: "asc" } },
      },
      orderBy: { dcDate: "desc" },
    });

    return Response.json(outwards);
  } catch (error) {
    console.error("Failed to fetch garment process outwards:", error);
    return Response.json(
      { error: "Failed to fetch garment process outwards" },
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

    const outward = await db.garmentProcessOutward.create({
      data: {
        dcNo: body.dcNo,
        dcDate: new Date(body.dcDate || new Date()),
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

    return Response.json(outward, { status: 201 });
  } catch (error) {
    console.error("Failed to create garment process outward:", error);
    return Response.json(
      { error: "Failed to create garment process outward" },
      { status: 500 }
    );
  }
}
