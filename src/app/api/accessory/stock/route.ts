import { db } from "@/lib/db";

export async function GET() {
  try {
    const stock = await db.accessoryStock.findMany({
      orderBy: { createdAt: "desc" },
    });
    const summary = await db.accessoryStock.aggregate({
      _sum: { qty: true, weight: true },
      _count: true,
    });
    return Response.json({ stock, summary: { totalItems: summary._count, totalQty: summary._sum.qty ?? 0, totalWeight: summary._sum.weight ?? 0 } });
  } catch (error) {
    console.error("Failed to fetch accessory stock:", error);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
