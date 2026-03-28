import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const authCheck = await requirePermission("canViewAccessory"); if (authCheck) return authCheck;
    const masters = await db.accessoryMaster.findMany({
      orderBy: { accessoryName: "asc" },
      include: { group: { select: { groupName: true } } },
    });
    return Response.json(masters);
  } catch (error) {
    console.error("Failed to fetch accessory masters:", error);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canEditAccessory"); if (authCheck) return authCheck;
    const body = await request.json();
    if (!body.accessoryName?.trim()) return Response.json({ error: "Accessory Name is required" }, { status: 400 });
    if (!body.groupId) return Response.json({ error: "Group is required" }, { status: 400 });
    const master = await db.accessoryMaster.create({
      data: {
        accessoryName: body.accessoryName.trim(),
        groupId: body.groupId,
        purchaseUom: body.purchaseUom || null,
        stockUom: body.stockUom || null,
        minimumStock: parseFloat(body.minimumStock) || 0,
        hsnCode: body.hsnCode || null,
        gstPercent: parseFloat(body.gstPercent) || 0,
        isActive: body.isActive !== false,
      },
    });
    return Response.json(master, { status: 201 });
  } catch (error) {
    console.error("Failed to create:", error);
    return Response.json({ error: "Failed to create" }, { status: 500 });
  }
}
