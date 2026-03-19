import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const stores = await db.store.findMany({
      orderBy: { storeName: "asc" },
    });
    return Response.json(stores);
  } catch (error) {
    console.error("Failed to fetch stores:", error);
    return Response.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.storeName) {
      return Response.json(
        { error: "Store Name is required" },
        { status: 400 }
      );
    }

    const store = await db.store.create({
      data: {
        storeName: body.storeName,
        storeLocation: body.storeLocation || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return Response.json(store, { status: 201 });
  } catch (error) {
    console.error("Failed to create store:", error);
    return Response.json(
      { error: "Failed to create store" },
      { status: 500 }
    );
  }
}
