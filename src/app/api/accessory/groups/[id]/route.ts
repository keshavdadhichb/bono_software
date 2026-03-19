import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.groupName?.trim()) return Response.json({ error: "Group Name is required" }, { status: 400 });
    const group = await db.accessoryGroup.update({
      where: { id },
      data: { groupName: body.groupName.trim(), hsnCode: body.hsnCode || null, gstPercent: parseFloat(body.gstPercent) || 0 },
    });
    return Response.json(group);
  } catch (error: any) {
    if (error?.code === "P2002") return Response.json({ error: "Group already exists" }, { status: 400 });
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.accessoryGroup.delete({ where: { id } });
    return Response.json({ message: "Deleted" });
  } catch (error) {
    console.error("Failed to delete:", error);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
