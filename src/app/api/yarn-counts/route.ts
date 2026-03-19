import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const counts = await db.yarnCount.findMany({ orderBy: { countName: "asc" } });
    return Response.json(counts);
  } catch (error) {
    console.error("Failed to fetch yarn counts:", error);
    return Response.json({ error: "Failed to fetch yarn counts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.countName?.trim()) {
      return Response.json({ error: "Count Name is required" }, { status: 400 });
    }
    const count = await db.yarnCount.create({
      data: { countName: body.countName.trim(), isActive: body.isActive !== false },
    });
    return Response.json(count, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "Yarn Count already exists" }, { status: 400 });
    }
    console.error("Failed to create yarn count:", error);
    return Response.json({ error: "Failed to create yarn count" }, { status: 500 });
  }
}
