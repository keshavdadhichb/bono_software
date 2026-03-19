import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const processType = searchParams.get("processType");
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

    const inwards = await db.fabricProcessInward.findMany({
      where,
      include: {
        items: { orderBy: { slNo: "asc" } },
        party: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(inwards);
  } catch (error) {
    console.error("Failed to fetch fabric process inwards:", error);
    return NextResponse.json(
      { error: "Failed to fetch fabric process inwards" },
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
    const lastDc = await db.fabricProcessInward.findFirst({
      orderBy: { createdAt: "desc" },
      select: { dcNo: true },
    });
    const nextNum = lastDc
      ? parseInt(lastDc.dcNo.replace(/\D/g, "") || "0") + 1
      : 1;
    const dcNo = `FPI-${String(nextNum).padStart(5, "0")}`;

    const items = (body.items || []).map(
      (
        item: {
          lotNo?: string;
          styleNo?: string;
          dia?: string;
          clothDescription?: string;
          color?: string;
          weight?: number;
          rolls?: number;
          uom?: string;
          rate?: number;
          amount?: number;
        },
        index: number
      ) => ({
        slNo: index + 1,
        lotNo: item.lotNo || null,
        styleNo: item.styleNo || null,
        dia: item.dia || null,
        clothDescription: item.clothDescription || null,
        color: item.color || null,
        weight: parseFloat(String(item.weight)) || 0,
        rolls: parseInt(String(item.rolls)) || 0,
        uom: item.uom || "Kgs",
        rate: parseFloat(String(item.rate)) || 0,
        amount: parseFloat(String(item.amount)) || 0,
      })
    );

    const totalQty = items.reduce(
      (sum: number, i: { weight: number }) => sum + i.weight,
      0
    );
    const totalRolls = items.reduce(
      (sum: number, i: { rolls: number }) => sum + i.rolls,
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

    const inward = await db.fabricProcessInward.create({
      data: {
        dcNo,
        dcDate: new Date(body.dcDate),
        processType: body.processType,
        storeId: body.storeId || null,
        partyId: body.partyId,
        pdcNo: body.pdcNo || null,
        pdcDate: body.pdcDate ? new Date(body.pdcDate) : null,
        narration: body.narration || null,
        vehicleNo: body.vehicleNo || null,
        transport: body.transport || null,
        totalQty,
        totalRolls,
        otherCharges,
        totalAmount,
        gstAmount,
        roundOff,
        netAmount,
        items: { create: items },
      },
      include: {
        items: { orderBy: { slNo: "asc" } },
        party: true,
      },
    });

    // If there's a linked outward DC (pdcNo), update its status
    if (body.pdcNo) {
      const outward = await db.fabricProcessOutward.findUnique({
        where: { dcNo: body.pdcNo },
      });
      if (outward) {
        // Check total received weight against outward
        const allInwards = await db.fabricProcessInward.findMany({
          where: { pdcNo: body.pdcNo },
          select: { totalQty: true },
        });
        const totalReceived = allInwards.reduce(
          (sum, inv) => sum + (inv.totalQty || 0),
          0
        );
        const newStatus =
          totalReceived >= outward.totalQty ? "Closed" : "Partial";
        await db.fabricProcessOutward.update({
          where: { id: outward.id },
          data: { status: newStatus },
        });
      }
    }

    return NextResponse.json(inward, { status: 201 });
  } catch (error) {
    console.error("Failed to create fabric process inward:", error);
    return NextResponse.json(
      { error: "Failed to create fabric process inward" },
      { status: 500 }
    );
  }
}
