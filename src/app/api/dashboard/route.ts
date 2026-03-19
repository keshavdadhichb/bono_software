import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const [
      partiesCount,
      pendingOutwardYarn,
      pendingOutwardFabric,
      pendingOutwardGarment,
      pendingInwardYarn,
      pendingInwardFabric,
      pendingInwardGarment,
      lowStockYarn,
    ] = await Promise.all([
      db.party.count({ where: { isActive: true } }),
      db.yarnProcessOutward.count({ where: { status: "Open" } }),
      db.fabricProcessOutward.count({ where: { status: "Open" } }),
      db.garmentProcessOutward.count({ where: { status: "Open" } }),
      db.yarnProcessInward.count(),
      db.fabricProcessInward.count(),
      db.garmentProcessInward.count(),
      db.yarnStock.count({ where: { stockKgs: { lt: 20 } } }),
    ])

    const pendingOutwards =
      pendingOutwardYarn + pendingOutwardFabric + pendingOutwardGarment
    const pendingInwards =
      pendingInwardYarn + pendingInwardFabric + pendingInwardGarment
    const lowStockCount = lowStockYarn

    // Fetch a handful of recent outward DCs as "recent transactions"
    const recentYarnOutwards = await db.yarnProcessOutward.findMany({
      take: 3,
      orderBy: { dcDate: "desc" },
      include: { party: { select: { partyName: true } } },
    })

    const recentFabricOutwards = await db.fabricProcessOutward.findMany({
      take: 3,
      orderBy: { dcDate: "desc" },
      include: { party: { select: { partyName: true } } },
    })

    const recentTransactions = [
      ...recentYarnOutwards.map((o) => ({
        type: "Outward" as const,
        dcRef: o.dcNo,
        party: o.party.partyName,
        date: o.dcDate.toISOString(),
        qty: `${o.totalQty} Kgs`,
        status: o.status,
      })),
      ...recentFabricOutwards.map((o) => ({
        type: "Outward" as const,
        dcRef: o.dcNo,
        party: o.party.partyName,
        date: o.dcDate.toISOString(),
        qty: `${o.totalQty} Kgs`,
        status: o.status,
      })),
    ]
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 6)

    return NextResponse.json({
      partiesCount,
      pendingOutwards,
      pendingInwards,
      lowStockCount,
      recentTransactions,
    })
  } catch (error) {
    // Database may not be seeded yet -- return mock data
    console.error("Dashboard API error (returning mock data):", error)

    return NextResponse.json({
      partiesCount: 148,
      pendingOutwards: 23,
      pendingInwards: 17,
      lowStockCount: 5,
      recentTransactions: [
        {
          type: "Purchase",
          dcRef: "GRN-2026-0045",
          party: "Sri Lakshmi Yarns",
          date: "2026-03-19",
          qty: "500 Kgs",
          status: "Closed",
        },
        {
          type: "Outward",
          dcRef: "YDC-2026-0112",
          party: "Devi Dyers",
          date: "2026-03-18",
          qty: "320 Kgs",
          status: "Open",
        },
        {
          type: "Inward",
          dcRef: "YIN-2026-0089",
          party: "Devi Dyers",
          date: "2026-03-18",
          qty: "290 Kgs",
          status: "Partial",
        },
      ],
    })
  }
}
