import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const processType = searchParams.get("processType");
    const status = searchParams.get("status");
    const partyId = searchParams.get("partyId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (processType && processType !== "All") where.processType = processType;
    if (partyId) where.partyId = partyId;
    if (search) {
      where.OR = [
        { dcNo: { contains: search, mode: "insensitive" } },
        { party: { partyName: { contains: search, mode: "insensitive" } } },
      ];
    }
    // Status filter not directly on inward, skip if provided

    const inwards = await db.yarnProcessInward.findMany({
      where,
      include: { items: true, party: true, outward: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(inwards);
  } catch (error) {
    console.error("Failed to fetch yarn process inwards:", error);
    return NextResponse.json(
      { error: "Failed to fetch yarn process inwards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.partyId || !body.dcDate || !body.processType) {
      return NextResponse.json(
        { error: "Party, DC Date, and Process Type are required" },
        { status: 400 }
      );
    }

    // Auto-generate DC number
    const lastDc = await db.yarnProcessInward.findFirst({
      orderBy: { createdAt: "desc" },
      select: { dcNo: true },
    });
    const nextNum = lastDc
      ? parseInt(lastDc.dcNo.replace(/\D/g, "") || "0") + 1
      : 1;
    const dcNo = `YDI-${String(nextNum).padStart(5, "0")}`;

    const items = (body.items || []).map(
      (
        item: {
          outwardDcNo?: string;
          lotNo?: string;
          styleNo?: string;
          counts?: string;
          yarnType?: string;
          issueColor?: string;
          recColor?: string;
          balQty?: number;
          recQty?: number;
          uom?: string;
          rate?: number;
          amount?: number;
        },
        index: number
      ) => ({
        slNo: index + 1,
        outwardDcNo: item.outwardDcNo || null,
        lotNo: item.lotNo || null,
        styleNo: item.styleNo || null,
        counts: item.counts || null,
        yarnType: item.yarnType || null,
        issueColor: item.issueColor || null,
        recColor: item.recColor || null,
        balQty: parseFloat(String(item.balQty)) || 0,
        recQty: parseFloat(String(item.recQty)) || 0,
        uom: item.uom || "Kgs",
        rate: parseFloat(String(item.rate)) || 0,
        amount: parseFloat(String(item.amount)) || 0,
      })
    );

    const totalQty = items.reduce(
      (sum: number, i: { recQty: number }) => sum + i.recQty,
      0
    );
    const totalAmount = items.reduce(
      (sum: number, i: { amount: number }) => sum + i.amount,
      0
    );
    const otherCharges = parseFloat(String(body.otherCharges)) || 0;
    const gstAmount = parseFloat(String(body.gstAmount)) || 0;
    const roundOff = parseFloat(String(body.roundOff)) || 0;
    const netAmount = totalAmount + otherCharges + gstAmount + roundOff;

    const inward = await db.yarnProcessInward.create({
      data: {
        dcNo,
        dcDate: new Date(body.dcDate),
        processType: body.processType,
        storeId: body.storeId || null,
        partyId: body.partyId,
        outwardId: body.outwardId || null,
        pdcNo: body.pdcNo || null,
        pdcDate: body.pdcDate ? new Date(body.pdcDate) : null,
        isPartReceipt: body.isPartReceipt || false,
        narration: body.narration || null,
        vehicleNo: body.vehicleNo || null,
        transport: body.transport || null,
        totalQty,
        otherCharges,
        totalAmount,
        gstAmount,
        roundOff,
        netAmount,
        items: { create: items },
      },
      include: { items: true, party: true, outward: true },
    });

    // Update outward DC status if linked
    if (body.outwardId) {
      const outward = await db.yarnProcessOutward.findUnique({
        where: { id: body.outwardId },
      });
      if (outward) {
        // Check total received against this outward
        const totalReceived = await db.yarnProcessInward.aggregate({
          where: { outwardId: body.outwardId },
          _sum: { totalQty: true },
        });
        const received = totalReceived._sum.totalQty || 0;
        const newStatus =
          received >= outward.totalQty ? "Closed" : "Partial";
        await db.yarnProcessOutward.update({
          where: { id: body.outwardId },
          data: { status: newStatus },
        });
      }
    }

    return NextResponse.json(inward, { status: 201 });
  } catch (error) {
    console.error("Failed to create yarn process inward:", error);
    return NextResponse.json(
      { error: "Failed to create yarn process inward" },
      { status: 500 }
    );
  }
}
