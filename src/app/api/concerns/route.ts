import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const authCheck = await requirePermission("canViewMaster"); if (authCheck) return authCheck;
    const concerns = await db.concern.findMany({ orderBy: { concernName: "asc" } });
    return Response.json(concerns);
  } catch (error) {
    console.error("Failed to fetch concerns:", error);
    return Response.json({ error: "Failed to fetch concerns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canEditMaster"); if (authCheck) return authCheck;
    const body = await request.json();
    if (!body.concernName?.trim()) {
      return Response.json({ error: "Concern Name is required" }, { status: 400 });
    }
    const concern = await db.concern.create({
      data: { concernName: body.concernName.trim(), isActive: body.isActive !== false },
    });
    return Response.json(concern, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "Concern already exists" }, { status: 400 });
    }
    console.error("Failed to create concern:", error);
    return Response.json({ error: "Failed to create concern" }, { status: 500 });
  }
}
