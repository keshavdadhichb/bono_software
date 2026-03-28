import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST() {
  try {
    // Only allow seeding if no users exist (first-time setup)
    const userCount = await db.user.count()
    if (userCount > 0) {
      return NextResponse.json(
        { error: "Seed is only allowed during first-time setup when no users exist" },
        { status: 403 }
      )
    }

    const results: Record<string, unknown> = {}

    // 1. Default admin user
    const existingAdmin = await db.user.findUnique({
      where: { username: "admin" },
    })

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("admin123", 12)
      results.user = await db.user.create({
        data: {
          username: "admin",
          passwordHash,
          fullName: "Administrator",
          role: "ADMIN",
          isActive: true,
        },
      })
    } else {
      results.user = { message: "Admin user already exists", id: existingAdmin.id }
    }

    // 2. Default financial year (26-27, April 2026 - March 2027)
    const existingFY = await db.financialYear.findUnique({
      where: { yearCode: "26-27" },
    })

    if (!existingFY) {
      results.financialYear = await db.financialYear.create({
        data: {
          yearCode: "26-27",
          startDate: new Date("2026-04-01T00:00:00.000Z"),
          endDate: new Date("2027-03-31T23:59:59.999Z"),
          isActive: true,
        },
      })
    } else {
      results.financialYear = {
        message: "FY 26-27 already exists",
        id: existingFY.id,
      }
    }

    // 3. Default company
    const existingCompany = await db.company.findFirst({
      where: { companyName: "BonoStyle" },
    })

    if (!existingCompany) {
      results.company = await db.company.create({
        data: {
          companyName: "BonoStyle",
          city: "Tirupur",
          state: "Tamil Nadu",
          country: "India",
        },
      })
    } else {
      results.company = {
        message: "Company already exists",
        id: existingCompany.id,
      }
    }

    // 4. UOMs
    const uoms = [
      { uomCode: "Kgs", description: "Kilograms" },
      { uomCode: "Nos", description: "Numbers" },
      { uomCode: "Pcs", description: "Pieces" },
      { uomCode: "Rolls", description: "Rolls" },
      { uomCode: "Box", description: "Box" },
      { uomCode: "Meters", description: "Meters" },
    ]

    const uomResults = []
    for (const uom of uoms) {
      const existing = await db.uom.findUnique({
        where: { uomCode: uom.uomCode },
      })
      if (!existing) {
        uomResults.push(await db.uom.create({ data: uom }))
      } else {
        uomResults.push({ message: `UOM ${uom.uomCode} already exists`, id: existing.id })
      }
    }
    results.uoms = uomResults

    // 5. Stores
    const stores = [
      { storeName: "Main Store", storeLocation: "Main Building" },
      { storeName: "Yarn Store", storeLocation: "Yarn Section" },
      { storeName: "Fabric Store", storeLocation: "Fabric Section" },
      { storeName: "Cut Store", storeLocation: "Cutting Section" },
      { storeName: "Accessory Store", storeLocation: "Accessory Section" },
    ]

    const storeResults = []
    for (const store of stores) {
      const existing = await db.store.findUnique({
        where: { storeName: store.storeName },
      })
      if (!existing) {
        storeResults.push(await db.store.create({ data: store }))
      } else {
        storeResults.push({
          message: `Store ${store.storeName} already exists`,
          id: existing.id,
        })
      }
    }
    results.stores = storeResults

    // 6. Basic colors
    const colors = [
      { colorCode: "WHT", colorName: "White" },
      { colorCode: "BLK", colorName: "Black" },
      { colorCode: "RED", colorName: "Red" },
      { colorCode: "BLU", colorName: "Blue" },
      { colorCode: "GRN", colorName: "Green" },
      { colorCode: "YLW", colorName: "Yellow" },
      { colorCode: "GRY", colorName: "Grey" },
      { colorCode: "NVY", colorName: "Navy" },
      { colorCode: "MRN", colorName: "Maroon" },
      { colorCode: "PNK", colorName: "Pink" },
      { colorCode: "ORG", colorName: "Orange" },
      { colorCode: "CRM", colorName: "Cream" },
    ]

    const colorResults = []
    for (const color of colors) {
      const existing = await db.color.findUnique({
        where: { colorName: color.colorName },
      })
      if (!existing) {
        colorResults.push(await db.color.create({ data: color }))
      } else {
        colorResults.push({
          message: `Color ${color.colorName} already exists`,
          id: existing.id,
        })
      }
    }
    results.colors = colorResults

    return NextResponse.json(
      { success: true, data: results },
      { status: 201 }
    )
  } catch (error) {
    console.error("Seed error:", error)
    const message =
      error instanceof Error ? error.message : "Unknown error during seeding"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
