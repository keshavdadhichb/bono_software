import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";

    const purchases = await db.yarnPurchase.findMany({
      where: search
        ? {
            OR: [
              { grnNo: { contains: search, mode: "insensitive" } },
              { invoiceNo: { contains: search, mode: "insensitive" } },
              { party: { partyName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : undefined,
      include: {
        party: { select: { partyName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { grnDate: "desc" },
    });
    return Response.json(purchases);
  } catch (error) {
    console.error("Failed to fetch purchases:", error);
    return Response.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.partyId) {
      return Response.json({ error: "Party is required" }, { status: 400 });
    }

    // Auto-generate GRN number
    const lastPurchase = await db.yarnPurchase.findFirst({
      orderBy: { grnNo: "desc" },
      select: { grnNo: true },
    });
    let nextNum = 1;
    if (lastPurchase?.grnNo) {
      const match = lastPurchase.grnNo.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const grnNo = `GRN-2026-${String(nextNum).padStart(4, "0")}`;

    const items = (body.items || []).map((item: any, idx: number) => ({
      slNo: idx + 1,
      lotNo: item.lotNo || null,
      styleNo: item.styleNo || null,
      counts: item.counts || "",
      yarnType: item.yarnType || "",
      millName: item.millName || null,
      color: item.color || null,
      noOfBags: parseInt(item.noOfBags) || 0,
      qty: parseFloat(item.qty) || 0,
      uom: item.uom || "Kgs",
      rate: parseFloat(item.rate) || 0,
      amount: parseFloat(item.amount) || 0,
    }));

    const totalQty = items.reduce((s: number, i: any) => s + i.qty, 0);
    const totalAmount = items.reduce((s: number, i: any) => s + i.amount, 0);

    const purchase = await db.yarnPurchase.create({
      data: {
        grnNo,
        grnDate: new Date(body.grnDate || new Date()),
        partyId: body.partyId,
        storeId: body.storeId || null,
        invoiceNo: body.invoiceNo || null,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : null,
        narration: body.narration || null,
        vehicleNo: body.vehicleNo || null,
        totalQty,
        totalAmount,
        gstAmount: parseFloat(body.gstAmount) || 0,
        otherCharges: parseFloat(body.otherCharges) || 0,
        netAmount: totalAmount + (parseFloat(body.gstAmount) || 0) + (parseFloat(body.otherCharges) || 0),
        items: { create: items },
      },
      include: { party: { select: { partyName: true } } },
    });

    return Response.json(purchase, { status: 201 });
  } catch (error) {
    console.error("Failed to create purchase:", error);
    return Response.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}
