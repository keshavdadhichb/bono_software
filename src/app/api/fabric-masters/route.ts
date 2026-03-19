import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const fabrics = await db.fabricMaster.findMany({ orderBy: { clothDescription: "asc" } });
    return Response.json(fabrics);
  } catch (error) {
    console.error("Failed to fetch fabric masters:", error);
    return Response.json({ error: "Failed to fetch fabric masters" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.clothDescription?.trim()) {
      return Response.json({ error: "Cloth Description is required" }, { status: 400 });
    }
    const fabric = await db.fabricMaster.create({
      data: {
        clothDescription: body.clothDescription.trim(),
        dia: body.dia || null,
        gsm: body.gsm ? parseInt(body.gsm) : null,
        content: body.content || null,
        isActive: body.isActive !== false,
      },
    });
    return Response.json(fabric, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "This fabric combination already exists" }, { status: 400 });
    }
    console.error("Failed to create fabric master:", error);
    return Response.json({ error: "Failed to create fabric master" }, { status: 500 });
  }
}
