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

    const outwards = await db.fabricProcessOutward.findMany({
      where,
      include: {
        stockItems: { orderBy: { slNo: "asc" } },
        programItems: { orderBy: { slNo: "asc" } },
        party: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(outwards);
  } catch (error) {
    console.error("Failed to fetch fabric process outwards:", error);
    return NextResponse.json(
      { error: "Failed to fetch fabric process outwards" },
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
    const lastDc = await db.fabricProcessOutward.findFirst({
      orderBy: { createdAt: "desc" },
      select: { dcNo: true },
    });
    const nextNum = lastDc
      ? parseInt(lastDc.dcNo.replace(/\D/g, "") || "0") + 1
      : 1;
    const dcNo = `FPO-${String(nextNum).padStart(5, "0")}`;

    const stockItems = (body.stockItems || []).map(
      (
        item: {
          fromLotNo?: string;
          fromStyle?: string;
          lotNo?: string;
          styleNo?: string;
          dia?: string;
          clothDescription?: string;
          content?: string;
          color?: string;
          printColor?: string;
          gsm?: number;
          counts?: string;
          stockKgs?: number;
          weight?: number;
          rolls?: number;
        },
        index: number
      ) => ({
        slNo: index + 1,
        fromLotNo: item.fromLotNo || null,
        fromStyle: item.fromStyle || null,
        lotNo: item.lotNo || null,
        styleNo: item.styleNo || null,
        dia: item.dia || null,
        clothDescription: item.clothDescription || null,
        content: item.content || null,
        color: item.color || null,
        printColor: item.printColor || null,
        gsm: item.gsm ? parseInt(String(item.gsm)) : null,
        counts: item.counts || null,
        stockKgs: parseFloat(String(item.stockKgs)) || 0,
        weight: parseFloat(String(item.weight)) || 0,
        rolls: parseInt(String(item.rolls)) || 0,
      })
    );

    const programItems = (body.programItems || []).map(
      (
        item: {
          lotNo?: string;
          styleNo?: string;
          styleRef?: string;
          styleType?: string;
          part?: string;
          partGroup?: string;
          noOfParts?: number;
          pcsWeight?: number;
          color?: string;
          size?: string;
          qty?: number;
        },
        index: number
      ) => ({
        slNo: index + 1,
        lotNo: item.lotNo || null,
        styleNo: item.styleNo || null,
        styleRef: item.styleRef || null,
        styleType: item.styleType || null,
        part: item.part || null,
        partGroup: item.partGroup || null,
        noOfParts: parseInt(String(item.noOfParts)) || 0,
        pcsWeight: parseFloat(String(item.pcsWeight)) || 0,
        color: item.color || null,
        size: item.size || null,
        qty: parseInt(String(item.qty)) || 0,
      })
    );

    const totalQty = stockItems.reduce(
      (sum: number, i: { weight: number }) => sum + i.weight,
      0
    );
    const totalRolls = stockItems.reduce(
      (sum: number, i: { rolls: number }) => sum + i.rolls,
      0
    );
    const programQty = programItems.reduce(
      (sum: number, i: { qty: number }) => sum + i.qty,
      0
    );
    const otherCharges = parseFloat(String(body.otherCharges)) || 0;
    const totalAmount = parseFloat(String(body.totalAmount)) || 0;
    const roundOff = parseFloat(String(body.roundOff)) || 0;
    const netAmount = totalAmount + otherCharges + roundOff;

    const outward = await db.fabricProcessOutward.create({
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
        totalQty,
        totalRolls,
        programQty,
        otherCharges,
        totalAmount,
        roundOff,
        netAmount,
        status: "Open",
        stockItems: { create: stockItems },
        programItems: { create: programItems },
      },
      include: {
        stockItems: { orderBy: { slNo: "asc" } },
        programItems: { orderBy: { slNo: "asc" } },
        party: true,
      },
    });

    return NextResponse.json(outward, { status: 201 });
  } catch (error) {
    console.error("Failed to create fabric process outward:", error);
    return NextResponse.json(
      { error: "Failed to create fabric process outward" },
      { status: 500 }
    );
  }
}
