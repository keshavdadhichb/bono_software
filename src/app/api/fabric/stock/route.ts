import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get("storeId");
    const clothDescription = searchParams.get("clothDescription");
    const color = searchParams.get("color");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (storeId) where.storeId = storeId;
    if (clothDescription) {
      where.clothDescription = {
        contains: clothDescription,
        mode: "insensitive",
      };
    }
    if (color) {
      where.color = { contains: color, mode: "insensitive" };
    }
    if (search) {
      where.OR = [
        { lotNo: { contains: search, mode: "insensitive" } },
        { styleNo: { contains: search, mode: "insensitive" } },
        { clothDescription: { contains: search, mode: "insensitive" } },
        { color: { contains: search, mode: "insensitive" } },
      ];
    }

    const stock = await db.fabricStock.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(stock);
  } catch (error) {
    console.error("Failed to fetch fabric stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch fabric stock" },
      { status: 500 }
    );
  }
}
