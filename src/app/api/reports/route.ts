import { requirePermission } from "@/lib/api-auth"
import { db } from "@/lib/db";

export async function GET() {
  try {
    const authCheck = await requirePermission("canViewReports"); if (authCheck) return authCheck;
    const [
      yarnStockAgg, fabricStockAgg, garmentStockAgg, accessoryStockAgg,
      pendingYarnOut, pendingFabricOut, pendingGarmentOut,
      overdueYarn, overdueFabric, overdueGarment,
    ] = await Promise.all([
      db.yarnStock.aggregate({ _sum: { stockKgs: true }, _count: true }),
      db.fabricStock.aggregate({ _sum: { weight: true }, _count: true }),
      db.garmentStock.aggregate({ _sum: { qty: true }, _count: true }),
      db.accessoryStock.aggregate({ _sum: { qty: true }, _count: true }),
      db.yarnProcessOutward.count({ where: { status: "Open" } }),
      db.fabricProcessOutward.count({ where: { status: "Open" } }),
      db.garmentProcessOutward.count({ where: { status: "Open" } }),
      db.yarnProcessOutward.count({ where: { status: "Open", targetDate: { lt: new Date() } } }),
      db.fabricProcessOutward.count({ where: { status: "Open", targetDate: { lt: new Date() } } }),
      db.garmentProcessOutward.count({ where: { status: "Open", targetDate: { lt: new Date() } } }),
    ]);

    return Response.json({
      yarnStock: { items: yarnStockAgg._count, totalKgs: yarnStockAgg._sum.stockKgs ?? 0 },
      fabricStock: { items: fabricStockAgg._count, totalKgs: fabricStockAgg._sum.weight ?? 0 },
      garmentStock: { items: garmentStockAgg._count, totalPcs: garmentStockAgg._sum.qty ?? 0 },
      accessoryStock: { items: accessoryStockAgg._count, totalQty: accessoryStockAgg._sum.qty ?? 0 },
      pendingOutward: pendingYarnOut + pendingFabricOut + pendingGarmentOut,
      pendingOutwardBreakdown: { yarn: pendingYarnOut, fabric: pendingFabricOut, garment: pendingGarmentOut },
      overdueDCs: overdueYarn + overdueFabric + overdueGarment,
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return Response.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
