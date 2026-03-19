import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const outward = await db.fabricProcessOutward.findUnique({
      where: { id },
      include: {
        stockItems: { orderBy: { slNo: "asc" } },
        programItems: { orderBy: { slNo: "asc" } },
        party: true,
      },
    });

    if (!outward) {
      return NextResponse.json(
        { error: "Fabric process outward not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(outward);
  } catch (error) {
    console.error("Failed to fetch fabric process outward:", error);
    return NextResponse.json(
      { error: "Failed to fetch fabric process outward" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Delete existing items and recreate
    await db.fabricProcessOutwardItem.deleteMany({ where: { outwardId: id } });
    await db.fabricProcessOutwardProgram.deleteMany({ where: { outwardId: id } });

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

    const outward = await db.fabricProcessOutward.update({
      where: { id },
      data: {
        dcDate: body.dcDate ? new Date(body.dcDate) : undefined,
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
        status: body.status || undefined,
        stockItems: { create: stockItems },
        programItems: { create: programItems },
      },
      include: {
        stockItems: { orderBy: { slNo: "asc" } },
        programItems: { orderBy: { slNo: "asc" } },
        party: true,
      },
    });

    return NextResponse.json(outward);
  } catch (error) {
    console.error("Failed to update fabric process outward:", error);
    return NextResponse.json(
      { error: "Failed to update fabric process outward" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.fabricProcessOutward.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Failed to delete fabric process outward:", error);
    return NextResponse.json(
      { error: "Failed to delete fabric process outward" },
      { status: 500 }
    );
  }
}
