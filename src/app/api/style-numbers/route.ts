import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const styles = await db.styleNumber.findMany({ orderBy: { styleNo: "asc" } });
    return Response.json(styles);
  } catch (error) {
    console.error("Failed to fetch style numbers:", error);
    return Response.json({ error: "Failed to fetch style numbers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.styleNo?.trim()) {
      return Response.json({ error: "Style No is required" }, { status: 400 });
    }
    const style = await db.styleNumber.create({
      data: {
        styleNo: body.styleNo.trim(),
        styleReference: body.styleReference || null,
        styleType: body.styleType || null,
        description: body.description || null,
      },
    });
    return Response.json(style, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "Style No already exists" }, { status: 400 });
    }
    console.error("Failed to create style number:", error);
    return Response.json({ error: "Failed to create style number" }, { status: 500 });
  }
}
