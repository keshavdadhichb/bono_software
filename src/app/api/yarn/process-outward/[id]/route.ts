import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const outward = await db.yarnProcessOutward.findUnique({
      where: { id },
      include: { items: true, party: true },
    });

    if (!outward) {
      return NextResponse.json(
        { error: "Outward DC not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(outward);
  } catch (error) {
    console.error("Failed to fetch yarn process outward:", error);
    return NextResponse.json(
      { error: "Failed to fetch yarn process outward" },
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
    await db.yarnProcessOutwardItem.deleteMany({
      where: { outwardId: id },
    });

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

    const outward = await db.yarnProcessOutward.update({
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
        ourTeam: body.ourTeam || null,
        totalQty,
        totalBags,
        otherCharges,
        totalAmount,
        gstAmount,
        roundOff,
        netAmount,
        status: body.status || undefined,
        items: { create: items },
      },
      include: { items: true, party: true },
    });

    return NextResponse.json(outward);
  } catch (error) {
    console.error("Failed to update yarn process outward:", error);
    return NextResponse.json(
      { error: "Failed to update yarn process outward" },
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
    await db.yarnProcessOutward.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Failed to delete yarn process outward:", error);
    return NextResponse.json(
      { error: "Failed to delete yarn process outward" },
      { status: 500 }
    );
  }
}
