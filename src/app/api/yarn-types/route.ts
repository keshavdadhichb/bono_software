import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const yarnTypes = await db.yarnType.findMany({
      orderBy: { typeName: "asc" },
    });
    return Response.json(yarnTypes);
  } catch (error) {
    console.error("Failed to fetch yarn types:", error);
    return Response.json(
      { error: "Failed to fetch yarn types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.typeName) {
      return Response.json(
        { error: "Type Name is required" },
        { status: 400 }
      );
    }

    const yarnType = await db.yarnType.create({
      data: {
        typeName: body.typeName,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return Response.json(yarnType, { status: 201 });
  } catch (error) {
    console.error("Failed to create yarn type:", error);
    return Response.json(
      { error: "Failed to create yarn type" },
      { status: 500 }
    );
  }
}
