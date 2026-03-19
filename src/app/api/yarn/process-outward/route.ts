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
    if (status && status !== "All") where.status = status;
    if (partyId) where.partyId = partyId;
    if (search) {
      where.OR = [
        { dcNo: { contains: search, mode: "insensitive" } },
        { party: { partyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const outwards = await db.yarnProcessOutward.findMany({
      where,
      include: { items: true, party: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(outwards);
  } catch (error) {
    console.error("Failed to fetch yarn process outwards:", error);
    return NextResponse.json(
      { error: "Failed to fetch yarn process outwards" },
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
    const lastDc = await db.yarnProcessOutward.findFirst({
      orderBy: { createdAt: "desc" },
      select: { dcNo: true },
    });
    const nextNum = lastDc
      ? parseInt(lastDc.dcNo.replace(/\D/g, "") || "0") + 1
      : 1;
    const dcNo = `YDO-${String(nextNum).padStart(5, "0")}`;

    const items = (body.items || []).map(
      (
        item: {
          lotNo?: string;
          styleNo?: string;
          counts?: string;
          yarnType?: string;
          millName?: string;
          color?: string;
          dyeColor?: string;
          noOfBags?: number;
          stockQty?: number;
          issueKgs?: number;
          uom?: string;
          rate?: number;
          amount?: number;
        },
        index: number
      ) => ({
        slNo: index + 1,
        lotNo: item.lotNo || null,
        styleNo: item.styleNo || null,
        counts: item.counts || null,
        yarnType: item.yarnType || null,
        millName: item.millName || null,
        color: item.color || null,
        dyeColor: item.dyeColor || null,
        noOfBags: parseInt(String(item.noOfBags)) || 0,
        stockQty: parseFloat(String(item.stockQty)) || 0,
        issueKgs: parseFloat(String(item.issueKgs)) || 0,
        uom: item.uom || "Kgs",
        rate: parseFloat(String(item.rate)) || 0,
        amount: parseFloat(String(item.amount)) || 0,
      })
    );

    const totalQty = items.reduce(
      (sum: number, i: { issueKgs: number }) => sum + i.issueKgs,
      0
    );
    const totalBags = items.reduce(
      (sum: number, i: { noOfBags: number }) => sum + i.noOfBags,
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

    const outward = await db.yarnProcessOutward.create({
      data: {
        dcNo,
        dcDate: new Date(body.dcDate),
        processType: body.processType,
        storeId: body.storeId || null,
        partyId: body.partyId,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        type: body.type || "Fresh",
        narration: body.narration || null,
        vehicleNo: body.vehicleNo || null,
        transport: body.transport || null,
        ourTeam: body.ourTeam || null,
        totalQty,
        totalBags,
        otherCharges,
        totalAmount,
        gstAmount,
        roundOff,
        netAmount,
        status: "Open",
        items: { create: items },
      },
      include: { items: true, party: true },
    });

    return NextResponse.json(outward, { status: 201 });
  } catch (error) {
    console.error("Failed to create yarn process outward:", error);
    return NextResponse.json(
      { error: "Failed to create yarn process outward" },
      { status: 500 }
    );
  }
}
