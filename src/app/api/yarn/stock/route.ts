import { requirePermission } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canViewYarn"); if (authCheck) return authCheck;
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get("storeId");
    const lotNo = searchParams.get("lotNo");
    const yarnType = searchParams.get("yarnType");
    const color = searchParams.get("color");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (storeId) where.storeId = storeId;
    if (lotNo) where.lotNo = { contains: lotNo, mode: "insensitive" };
    if (yarnType && yarnType !== "All")
      where.yarnType = { contains: yarnType, mode: "insensitive" };
    if (color && color !== "All")
      where.color = { contains: color, mode: "insensitive" };
    if (search) {
      where.OR = [
        { lotNo: { contains: search, mode: "insensitive" } },
        { styleNo: { contains: search, mode: "insensitive" } },
        { counts: { contains: search, mode: "insensitive" } },
        { yarnType: { contains: search, mode: "insensitive" } },
        { millName: { contains: search, mode: "insensitive" } },
        { color: { contains: search, mode: "insensitive" } },
      ];
    }

    const stock = await db.yarnStock.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(stock);
  } catch (error) {
    console.error("Failed to fetch yarn stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch yarn stock" },
      { status: 500 }
    );
  }
}
