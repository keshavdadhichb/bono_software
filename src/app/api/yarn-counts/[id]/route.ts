import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.countName?.trim()) {
      return Response.json({ error: "Count Name is required" }, { status: 400 });
    }
    const count = await db.yarnCount.update({
      where: { id },
      data: { countName: body.countName.trim(), isActive: body.isActive !== false },
    });
    return Response.json(count);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "Yarn Count already exists" }, { status: 400 });
    }
    console.error("Failed to update yarn count:", error);
    return Response.json({ error: "Failed to update yarn count" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.yarnCount.delete({ where: { id } });
    return Response.json({ message: "Deleted" });
  } catch (error) {
    console.error("Failed to delete yarn count:", error);
    return Response.json({ error: "Failed to delete yarn count" }, { status: 500 });
  }
}
