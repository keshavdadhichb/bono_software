import { db } from "@/lib/db"

export async function GET() {
  try {
    const [
      partiesCount, storesCount,
      pendingOutwardYarn, pendingOutwardFabric, pendingOutwardGarment,
      yarnStockAgg, lowStockYarn,
      overdueYarnDCs, overdueFabricDCs,
    ] = await Promise.all([
      db.party.count({ where: { isActive: true } }),
      db.store.count(),
      db.yarnProcessOutward.count({ where: { status: "Open" } }),
      db.fabricProcessOutward.count({ where: { status: "Open" } }),
      db.garmentProcessOutward.count({ where: { status: "Open" } }),
      db.yarnStock.aggregate({ _sum: { stockKgs: true }, _count: true }),
      db.yarnStock.findMany({ where: { stockKgs: { lt: 20 } }, take: 5, orderBy: { stockKgs: "asc" } }),
      db.yarnProcessOutward.findMany({ where: { status: "Open", targetDate: { lt: new Date() } }, take: 5, include: { party: { select: { partyName: true } } } }),
      db.fabricProcessOutward.findMany({ where: { status: "Open", targetDate: { lt: new Date() } }, take: 5, include: { party: { select: { partyName: true } } } }),
    ])

    const [recentYarnOut, recentFabricOut, recentGarmentOut, recentYarnIn] = await Promise.all([
      db.yarnProcessOutward.findMany({ take: 4, orderBy: { dcDate: "desc" }, include: { party: { select: { partyName: true } } } }),
      db.fabricProcessOutward.findMany({ take: 3, orderBy: { dcDate: "desc" }, include: { party: { select: { partyName: true } } } }),
      db.garmentProcessOutward.findMany({ take: 3, orderBy: { dcDate: "desc" }, include: { party: { select: { partyName: true } } } }),
      db.yarnProcessInward.findMany({ take: 3, orderBy: { dcDate: "desc" }, include: { party: { select: { partyName: true } } } }),
    ])

    const recentTransactions = [
      ...recentYarnOut.map((dc: any) => ({ type: "Yarn Outward", dcRef: dc.dcNo, party: dc.party.partyName, date: dc.dcDate.toISOString(), qty: `${dc.totalQty} Kgs`, status: dc.status })),
      ...recentFabricOut.map((dc: any) => ({ type: "Fabric Outward", dcRef: dc.dcNo, party: dc.party.partyName, date: dc.dcDate.toISOString(), qty: `${dc.totalQty} Kgs`, status: dc.status })),
      ...recentGarmentOut.map((dc: any) => ({ type: "Garment Outward", dcRef: dc.dcNo, party: dc.party.partyName, date: dc.dcDate.toISOString(), qty: `${dc.totalQty} Pcs`, status: dc.status })),
      ...recentYarnIn.map((dc: any) => ({ type: "Yarn Inward", dcRef: dc.dcNo, party: dc.party.partyName, date: dc.dcDate.toISOString(), qty: `${dc.totalQty} Kgs`, status: "Received" })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

    const notifications = [
      ...overdueYarnDCs.map((dc: any) => ({ type: "overdue" as const, message: `Yarn DC ${dc.dcNo} to ${dc.party.partyName} is overdue`, time: dc.dcDate.toISOString() })),
      ...overdueFabricDCs.map((dc: any) => ({ type: "overdue" as const, message: `Fabric DC ${dc.dcNo} to ${dc.party.partyName} is overdue`, time: dc.dcDate.toISOString() })),
      ...lowStockYarn.map((s: any) => ({ type: "stock" as const, message: `${s.counts} ${s.yarnType} yarn stock low (${s.stockKgs} Kgs)`, time: s.updatedAt.toISOString() })),
    ]

    return Response.json({
      stats: {
        totalParties: partiesCount,
        totalStores: storesCount,
        pendingOutward: pendingOutwardYarn + pendingOutwardFabric + pendingOutwardGarment,
        yarnStockKgs: yarnStockAgg._sum.stockKgs ?? 0,
      },
      recentTransactions,
      notifications,
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return Response.json({
      stats: { totalParties: 0, totalStores: 0, pendingOutward: 0, yarnStockKgs: 0 },
      recentTransactions: [],
      notifications: [],
    })
  }
}
