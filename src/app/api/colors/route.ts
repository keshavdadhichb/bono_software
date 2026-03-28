import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const authCheck = await requirePermission("canViewMaster"); if (authCheck) return authCheck;
    const colors = await db.color.findMany({ orderBy: { colorName: "asc" } });
    return Response.json(colors);
  } catch (error) {
    console.error("Failed to fetch colors:", error);
    return Response.json({ error: "Failed to fetch colors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canEditMaster"); if (authCheck) return authCheck;
    const body = await request.json();
    if (!body.colorName?.trim()) {
      return Response.json({ error: "Color Name is required" }, { status: 400 });
    }
    const color = await db.color.create({
      data: {
        colorCode: body.colorCode || null,
        colorName: body.colorName.trim(),
      },
    });
    return Response.json(color, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "Color already exists" }, { status: 400 });
    }
    console.error("Failed to create color:", error);
    return Response.json({ error: "Failed to create color" }, { status: 500 });
  }
}
