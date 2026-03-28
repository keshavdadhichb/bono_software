import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const authCheck = await requirePermission("canViewAccessory"); if (authCheck) return authCheck;
    const groups = await db.accessoryGroup.findMany({
      orderBy: { groupName: "asc" },
      include: { _count: { select: { items: true } } },
    });
    return Response.json(groups);
  } catch (error) {
    console.error("Failed to fetch accessory groups:", error);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canEditAccessory"); if (authCheck) return authCheck;
    const body = await request.json();
    if (!body.groupName?.trim()) {
      return Response.json({ error: "Group Name is required" }, { status: 400 });
    }
    const group = await db.accessoryGroup.create({
      data: {
        groupName: body.groupName.trim(),
        hsnCode: body.hsnCode || null,
        gstPercent: parseFloat(body.gstPercent) || 0,
      },
    });
    return Response.json(group, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return Response.json({ error: "Group already exists" }, { status: 400 });
    console.error("Failed to create group:", error);
    return Response.json({ error: "Failed to create" }, { status: 500 });
  }
}
