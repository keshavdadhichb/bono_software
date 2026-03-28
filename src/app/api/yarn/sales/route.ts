import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canViewYarn"); if (authCheck) return authCheck;
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";

    const sales = await db.yarnSale.findMany({
      where: search
        ? {
            OR: [
              { billNo: { contains: search, mode: "insensitive" } },
              { party: { partyName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : undefined,
      include: {
        party: { select: { partyName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { billDate: "desc" },
    });
    return Response.json(sales);
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    return Response.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canEditYarn"); if (authCheck) return authCheck;
    const body = await request.json();

    if (!body.partyId) {
      return Response.json({ error: "Party is required" }, { status: 400 });
    }

    const lastSale = await db.yarnSale.findFirst({
      orderBy: { billNo: "desc" },
      select: { billNo: true },
    });
    let nextNum = 1;
    if (lastSale?.billNo) {
      const match = lastSale.billNo.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const billNo = `INV-2026-${String(nextNum).padStart(4, "0")}`;

    const items = (body.items || []).map((item: any, idx: number) => ({
      slNo: idx + 1,
      lotNo: item.lotNo || null,
      styleNo: item.styleNo || null,
      counts: item.counts || null,
      yarnType: item.yarnType || null,
      millName: item.millName || null,
      color: item.color || null,
      noOfBags: parseInt(item.noOfBags) || 0,
      stockQty: parseFloat(item.stockQty) || 0,
      weight: parseFloat(item.weight) || 0,
      uom: item.uom || "Kgs",
      netRate: parseFloat(item.netRate) || 0,
      rate: parseFloat(item.rate) || 0,
      amount: parseFloat(item.amount) || 0,
    }));

    const totalQty = items.reduce((s: number, i: any) => s + i.weight, 0);
    const totalAmount = items.reduce((s: number, i: any) => s + i.amount, 0);
    const gstAmount = parseFloat(body.gstAmount) || 0;
    const freight = parseFloat(body.freight) || 0;
    const packing = parseFloat(body.packing) || 0;
    const otherCharges = parseFloat(body.otherCharges) || 0;
    const roundOff = parseFloat(body.roundOff) || 0;

    const sale = await db.yarnSale.create({
      data: {
        billNo,
        billDate: new Date(body.billDate || new Date()),
        billType: body.billType || "GST",
        partyId: body.partyId,
        storeId: body.storeId || null,
        creditDays: parseInt(body.creditDays) || 0,
        deliveryTo: body.deliveryTo || null,
        hsnCode: body.hsnCode || null,
        narration: body.narration || null,
        vehicleNo: body.vehicleNo || null,
        transport: body.transport || null,
        totalQty,
        totalAmount,
        gstAmount,
        freight,
        packing,
        otherCharges,
        roundOff,
        netAmount: totalAmount + gstAmount + freight + packing + otherCharges + roundOff,
        items: { create: items },
      },
      include: { party: { select: { partyName: true } } },
    });

    return Response.json(sale, { status: 201 });
  } catch (error) {
    console.error("Failed to create sale:", error);
    return Response.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
