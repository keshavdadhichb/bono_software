import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const partyId = searchParams.get("partyId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (partyId) where.partyId = partyId;
    if (status && status !== "All") where.status = status;
    if (search) {
      where.OR = [
        { poNo: { contains: search, mode: "insensitive" } },
        { party: { partyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orders = await db.yarnPurchaseOrder.findMany({
      where,
      include: { items: true, party: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch yarn purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch yarn purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.partyId || !body.poDate) {
      return NextResponse.json(
        { error: "Party and PO Date are required" },
        { status: 400 }
      );
    }

    // Auto-generate PO number
    const lastPo = await db.yarnPurchaseOrder.findFirst({
      orderBy: { createdAt: "desc" },
      select: { poNo: true },
    });
    const nextNum = lastPo
      ? parseInt(lastPo.poNo.replace(/\D/g, "") || "0") + 1
      : 1;
    const poNo = `YPO-${String(nextNum).padStart(5, "0")}`;

    const items = (body.items || []).map(
      (
        item: {
          lotNo?: string;
          styleNo?: string;
          counts?: string;
          yarnType?: string;
          millName?: string;
          color?: string;
          qty?: number;
          uom?: string;
          rate?: number;
          amount?: number;
        },
        index: number
      ) => ({
        slNo: index + 1,
        lotNo: item.lotNo || null,
        styleNo: item.styleNo || null,
        counts: item.counts || "",
        yarnType: item.yarnType || "",
        millName: item.millName || null,
        color: item.color || null,
        qty: parseFloat(String(item.qty)) || 0,
        uom: item.uom || "Kgs",
        rate: parseFloat(String(item.rate)) || 0,
        amount: parseFloat(String(item.amount)) || 0,
      })
    );

    const totalQty = items.reduce(
      (sum: number, i: { qty: number }) => sum + i.qty,
      0
    );
    const totalAmount = items.reduce(
      (sum: number, i: { amount: number }) => sum + i.amount,
      0
    );

    const order = await db.yarnPurchaseOrder.create({
      data: {
        poNo,
        poDate: new Date(body.poDate),
        partyId: body.partyId,
        storeId: body.storeId || null,
        narration: body.narration || null,
        totalQty,
        totalAmount,
        gstAmount: parseFloat(String(body.gstAmount)) || 0,
        netAmount: parseFloat(String(body.netAmount)) || totalAmount,
        status: "Open",
        items: { create: items },
      },
      include: { items: true, party: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create yarn purchase order:", error);
    return NextResponse.json(
      { error: "Failed to create yarn purchase order" },
      { status: 500 }
    );
  }
}
