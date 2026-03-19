import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get("storeId");
    const styleNo = searchParams.get("styleNo");
    const process = searchParams.get("process");
    const color = searchParams.get("color");

    const where: Record<string, unknown> = {};
    if (storeId) {
      where.storeId = storeId;
    }
    if (styleNo) {
      where.styleNo = { contains: styleNo, mode: "insensitive" };
    }
    if (process && process !== "All") {
      where.process = process;
    }
    if (color) {
      where.color = { contains: color, mode: "insensitive" };
    }

    const stock = await db.garmentStock.findMany({
      where,
      orderBy: [{ styleNo: "asc" }, { lotNo: "asc" }],
    });

    return Response.json(stock);
  } catch (error) {
    console.error("Failed to fetch garment stock:", error);
    return Response.json(
      { error: "Failed to fetch garment stock" },
      { status: 500 }
    );
  }
}
