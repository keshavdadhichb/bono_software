import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"

// Static pages list
const PAGES = [
  { label: "Dashboard", href: "/dashboard", description: "Overview & analytics" },
  { label: "Parties", href: "/master/parties", description: "Master › Manage suppliers, customers, contractors" },
  { label: "Stores", href: "/master/stores", description: "Master › Warehouse and store locations" },
  { label: "Colors", href: "/master/colors", description: "Master › Color master list" },
  { label: "Yarn Types", href: "/master/yarn-types", description: "Master › Yarn type definitions" },
  { label: "Yarn Counts", href: "/master/yarn-counts", description: "Master › Yarn count definitions" },
  { label: "Style Numbers", href: "/master/style-numbers", description: "Master › Style number catalog" },
  { label: "Fabric Masters", href: "/master/fabric-masters", description: "Master › Fabric master definitions" },
  { label: "GST Slabs", href: "/master/gst-slabs", description: "Master › GST tax slab configuration" },
  { label: "Concerns", href: "/master/concerns", description: "Master › Business concern management" },
  { label: "Purchase Orders", href: "/yarn/purchase-orders", description: "Yarn › Yarn purchase orders" },
  { label: "Yarn Purchases", href: "/yarn/purchases", description: "Yarn › GRN / yarn purchase entries" },
  { label: "Yarn Process Outward", href: "/yarn/process-outward", description: "Yarn › Send yarn for processing (DC)" },
  { label: "Yarn Process Inward", href: "/yarn/process-inward", description: "Yarn › Receive processed yarn back" },
  { label: "Yarn Sales", href: "/yarn/sales", description: "Yarn › Yarn sales bills" },
  { label: "Yarn Stock", href: "/yarn/stock", description: "Yarn › Current yarn stock ledger" },
  { label: "Fabric Process Outward", href: "/fabric/process-outward", description: "Fabric › Send fabric for processing" },
  { label: "Fabric Process Inward", href: "/fabric/process-inward", description: "Fabric › Receive processed fabric" },
  { label: "Fabric Stock", href: "/fabric/stock", description: "Fabric › Current fabric stock ledger" },
  { label: "Garment Price List", href: "/garment/price-list", description: "Garment › Style-wise price list" },
  { label: "Garment Process Outward", href: "/garment/process-outward", description: "Garment › Send garments for processing" },
  { label: "Garment Process Inward", href: "/garment/process-inward", description: "Garment › Receive processed garments" },
  { label: "Garment Stock", href: "/garment/stock", description: "Garment › Current garment stock" },
  { label: "Accessory Masters", href: "/accessory/masters", description: "Accessory › Accessory item master" },
  { label: "Accessory Stock", href: "/accessory/stock", description: "Accessory › Current accessory stock" },
  { label: "Reports", href: "/reports", description: "Reports › Business reports & analytics" },
  { label: "Users", href: "/admin/users", description: "Admin › User management & permissions" },
]

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? ""

    if (!q) {
      // Return all pages as quick navigation when query is empty
      return NextResponse.json({ parties: [], stock: [], pages: PAGES })
    }

    const lower = q.toLowerCase()

    // Page search (in-memory, fast)
    const pages = PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower)
    ).slice(0, 6)

    // Party search
    const parties = await db.party.findMany({
      where: {
        partyName: { contains: q, mode: "insensitive" },
        isActive: true,
      },
      take: 5,
      select: { id: true, partyName: true, partyType: true },
      orderBy: { partyName: "asc" },
    })

    // Yarn stock search
    const yarnStock = await db.yarnStock.findMany({
      where: {
        OR: [
          { counts: { contains: q, mode: "insensitive" } },
          { yarnType: { contains: q, mode: "insensitive" } },
          { lotNo: { contains: q, mode: "insensitive" } },
          { millName: { contains: q, mode: "insensitive" } },
          { color: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: {
        id: true,
        counts: true,
        yarnType: true,
        stockKgs: true,
        storeId: true,
        lotNo: true,
        color: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ parties, stock: yarnStock, pages })
  } catch (err) {
    console.error("Search error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
