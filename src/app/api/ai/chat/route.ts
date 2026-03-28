import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// ---------------------------------------------------------------------------
// System prompt — the AI's persona and knowledge base
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the AI assistant for **BONOSTYLE CREATIONS LLP**, a garment manufacturing company based in Tirupur, Tamil Nadu, India. The company manages the full production pipeline: yarn procurement, dyeing/processing, fabric knitting & processing, garment cutting/stitching/finishing, and accessory management.

## Your role
- Answer questions about the ERP data concisely and helpfully.
- Help users navigate to the right pages.
- Assist with creating records by suggesting pre-filled form navigation.
- Provide summaries, reports, and insights from the data.
- Always respond in the context of garment manufacturing. Use industry terms naturally (DC = Delivery Challan, GRN = Goods Receipt Note, PO = Purchase Order, Kgs = kilograms, Pcs = pieces).

## Available Modules & Pages

### Dashboard
- /dashboard — Main overview

### Master Data
- /master/parties — Parties (Suppliers, Customers, Contractors, Transporters, Job Workers)
- /master/stores — Stores / Warehouses
- /master/colors — Color master
- /master/yarn-types — Yarn type master
- /master/yarn-counts — Yarn count master
- /master/style-numbers — Style number master
- /master/fabric-masters — Fabric description master
- /master/gst-slabs — GST tax slab master
- /master/concerns — Concerns master

### Yarn Module
- /yarn/purchase-orders — Yarn Purchase Orders (POs)
- /yarn/purchases — Yarn Purchases / GRN
- /yarn/process-outward — Yarn Process Outward DCs (Dyeing, Winding, Twisting, Knitting)
- /yarn/process-inward — Yarn Process Inward DCs
- /yarn/sales — Yarn Sales
- /yarn/stock — Yarn Stock register

### Fabric Module
- /fabric/process-outward — Fabric Process Outward DCs (Dyeing, Compacting, Cutting, etc.)
- /fabric/process-inward — Fabric Process Inward DCs
- /fabric/stock — Fabric Stock register

### Garment Module
- /garment/price-list — Garment Price List
- /garment/process-outward — Garment Process Outward DCs (Printing, Stitching, Washing, Packing)
- /garment/process-inward — Garment Process Inward DCs
- /garment/stock — Garment Stock register

### Accessory Module
- /accessory/masters — Accessory masters & groups
- /accessory/stock — Accessory Stock register

### Reports
- /reports — Reporting dashboard

## Response format
Respond with a JSON object (and ONLY the JSON object, no markdown fences):
{
  "message": "Your natural language response here",
  "action": {
    "type": "navigate" | "prefill" | "data",
    "payload": { ... }
  }
}

### Action types:
1. **navigate** — When the user wants to go somewhere. payload: { "url": "/yarn/stock" }
2. **prefill** — When the user wants to create a record. payload: { "url": "/yarn/process-outward/new", "params": { "partyName": "...", "qty": "..." } }
3. **data** — When you're showing queried data inline. payload: { "summary": "brief label", "rows": [...] } where rows is an array of simple objects.

If no action is needed (just answering a question), omit the "action" field entirely.

## Guidelines
- Keep messages concise — 1-3 sentences for simple answers.
- When showing data, summarize the key numbers in the message and put details in the action payload.
- For navigation, always confirm where you're sending them.
- For form prefills, describe what you're pre-filling.
- Use INR (₹) for currency values. Format large numbers with commas (Indian numbering: 1,00,000).
- If you're uncertain about data, say so. Never fabricate numbers.
- When data is provided via [DATA CONTEXT], use those real numbers in your response.
`

// ---------------------------------------------------------------------------
// Data-fetching helpers — called based on parsed user intent
// ---------------------------------------------------------------------------

type DataContext = { label: string; data: unknown }

async function fetchDataForIntent(message: string): Promise<DataContext[]> {
  const lower = message.toLowerCase()
  const contexts: DataContext[] = []

  try {
    // Yarn stock queries
    if (lower.includes("yarn") && (lower.includes("stock") || lower.includes("inventory"))) {
      const stock = await db.yarnStock.findMany({
        select: {
          yarnType: true,
          counts: true,
          color: true,
          stockKgs: true,
          noOfBags: true,
          lotNo: true,
          storeId: true,
        },
        where: { stockKgs: { gt: 0 } },
        take: 50,
        orderBy: { updatedAt: "desc" },
      })
      const totalKgs = stock.reduce((s, r) => s + r.stockKgs, 0)
      const totalBags = stock.reduce((s, r) => s + r.noOfBags, 0)
      contexts.push({
        label: "Yarn Stock",
        data: { totalKgs, totalBags, totalItems: stock.length, items: stock.slice(0, 20) },
      })
    }

    // Fabric stock queries
    if (lower.includes("fabric") && (lower.includes("stock") || lower.includes("inventory"))) {
      const stock = await db.fabricStock.findMany({
        select: {
          clothDescription: true,
          dia: true,
          color: true,
          weight: true,
          rolls: true,
          lotNo: true,
        },
        where: { weight: { gt: 0 } },
        take: 50,
        orderBy: { updatedAt: "desc" },
      })
      const totalKgs = stock.reduce((s, r) => s + r.weight, 0)
      const totalRolls = stock.reduce((s, r) => s + r.rolls, 0)
      contexts.push({
        label: "Fabric Stock",
        data: { totalKgs, totalRolls, totalItems: stock.length, items: stock.slice(0, 20) },
      })
    }

    // Garment stock queries
    if (lower.includes("garment") && (lower.includes("stock") || lower.includes("inventory"))) {
      const stock = await db.garmentStock.findMany({
        select: {
          styleNo: true,
          styleRef: true,
          part: true,
          color: true,
          size: true,
          qty: true,
        },
        where: { qty: { gt: 0 } },
        take: 50,
        orderBy: { updatedAt: "desc" },
      })
      const totalPcs = stock.reduce((s, r) => s + r.qty, 0)
      contexts.push({
        label: "Garment Stock",
        data: { totalPcs, totalItems: stock.length, items: stock.slice(0, 20) },
      })
    }

    // Pending DCs (outwards that are still "Open")
    if (lower.includes("pending") && (lower.includes("dc") || lower.includes("challan") || lower.includes("outward"))) {
      const [yarnDCs, fabricDCs, garmentDCs] = await Promise.all([
        db.yarnProcessOutward.count({ where: { status: "Open" } }),
        db.fabricProcessOutward.count({ where: { status: "Open" } }),
        db.garmentProcessOutward.count({ where: { status: "Open" } }),
      ])
      contexts.push({
        label: "Pending DCs",
        data: { yarnOutwards: yarnDCs, fabricOutwards: fabricDCs, garmentOutwards: garmentDCs, total: yarnDCs + fabricDCs + garmentDCs },
      })
    }

    // Party queries
    if (lower.includes("party") || lower.includes("parties") || lower.includes("supplier") || lower.includes("customer")) {
      const parties = await db.party.findMany({
        select: { partyName: true, partyType: true, mobile: true, gstNo: true, isActive: true },
        where: { isActive: true },
        take: 30,
        orderBy: { partyName: "asc" },
      })
      const byType: Record<string, number> = {}
      for (const p of parties) {
        byType[p.partyType] = (byType[p.partyType] || 0) + 1
      }
      contexts.push({
        label: "Parties",
        data: { total: parties.length, byType, items: parties.slice(0, 15) },
      })
    }

    // Yarn purchase orders
    if (lower.includes("purchase order") || lower.includes("po")) {
      const pos = await db.yarnPurchaseOrder.findMany({
        select: { poNo: true, poDate: true, status: true, totalQty: true, netAmount: true, party: { select: { partyName: true } } },
        take: 20,
        orderBy: { poDate: "desc" },
      })
      const openPOs = pos.filter((p) => p.status === "Open").length
      contexts.push({
        label: "Yarn Purchase Orders",
        data: { total: pos.length, openPOs, items: pos.slice(0, 10) },
      })
    }

    // Summary / overview / today
    if (lower.includes("summary") || lower.includes("overview") || lower.includes("today") || lower.includes("this week")) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const dateFilter = lower.includes("today") ? { gte: today } : { gte: weekAgo }

      const [yarnOutToday, yarnInToday, fabricOutToday, fabricInToday, garmentOutToday, garmentInToday, purchasesToday] = await Promise.all([
        db.yarnProcessOutward.count({ where: { dcDate: dateFilter } }),
        db.yarnProcessInward.count({ where: { dcDate: dateFilter } }),
        db.fabricProcessOutward.count({ where: { dcDate: dateFilter } }),
        db.fabricProcessInward.count({ where: { dcDate: dateFilter } }),
        db.garmentProcessOutward.count({ where: { dcDate: dateFilter } }),
        db.garmentProcessInward.count({ where: { dcDate: dateFilter } }),
        db.yarnPurchase.count({ where: { grnDate: dateFilter } }),
      ])

      const [openYarnDCs, openFabricDCs, openGarmentDCs] = await Promise.all([
        db.yarnProcessOutward.count({ where: { status: "Open" } }),
        db.fabricProcessOutward.count({ where: { status: "Open" } }),
        db.garmentProcessOutward.count({ where: { status: "Open" } }),
      ])

      contexts.push({
        label: "Activity Summary",
        data: {
          period: lower.includes("today") ? "Today" : "This Week",
          yarnOutwards: yarnOutToday,
          yarnInwards: yarnInToday,
          fabricOutwards: fabricOutToday,
          fabricInwards: fabricInToday,
          garmentOutwards: garmentOutToday,
          garmentInwards: garmentInToday,
          purchases: purchasesToday,
          pendingDCs: { yarn: openYarnDCs, fabric: openFabricDCs, garment: openGarmentDCs },
        },
      })
    }

    // Yarn sales
    if (lower.includes("yarn") && lower.includes("sale")) {
      const sales = await db.yarnSale.findMany({
        select: { billNo: true, billDate: true, billType: true, totalQty: true, netAmount: true, party: { select: { partyName: true } } },
        take: 20,
        orderBy: { billDate: "desc" },
      })
      const totalAmount = sales.reduce((s, r) => s + r.netAmount, 0)
      contexts.push({
        label: "Yarn Sales",
        data: { total: sales.length, totalAmount, items: sales.slice(0, 10) },
      })
    }

    // Accessory stock
    if (lower.includes("accessor") && (lower.includes("stock") || lower.includes("inventory"))) {
      const stock = await db.accessoryStock.findMany({
        select: { accessoryId: true, accColor: true, qty: true, uom: true },
        where: { qty: { gt: 0 } },
        take: 30,
        orderBy: { updatedAt: "desc" },
      })
      const totalQty = stock.reduce((s, r) => s + r.qty, 0)
      contexts.push({
        label: "Accessory Stock",
        data: { totalQty, totalItems: stock.length, items: stock.slice(0, 15) },
      })
    }

    // Most pending DCs by party
    if (lower.includes("most") && lower.includes("pending")) {
      const yarnOutwards = await db.yarnProcessOutward.findMany({
        where: { status: "Open" },
        select: { partyId: true, party: { select: { partyName: true } } },
      })
      const partyCount: Record<string, { name: string; count: number }> = {}
      for (const o of yarnOutwards) {
        if (!partyCount[o.partyId]) partyCount[o.partyId] = { name: o.party.partyName, count: 0 }
        partyCount[o.partyId].count++
      }
      const sorted = Object.values(partyCount).sort((a, b) => b.count - a.count).slice(0, 10)
      contexts.push({
        label: "Parties with Most Pending DCs",
        data: { items: sorted },
      })
    }

    // Colors
    if (lower.includes("color") && !lower.includes("dye")) {
      const colors = await db.color.findMany({ take: 50, orderBy: { colorName: "asc" } })
      contexts.push({ label: "Colors", data: { total: colors.length, items: colors.slice(0, 25) } })
    }

    // Stores
    if (lower.includes("store") || lower.includes("warehouse") || lower.includes("godown")) {
      const stores = await db.store.findMany({ where: { isActive: true }, orderBy: { storeName: "asc" } })
      contexts.push({ label: "Stores", data: { total: stores.length, items: stores } })
    }

  } catch (error) {
    console.error("Error fetching data for AI context:", error)
  }

  return contexts
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { message, history } = body as {
      message: string
      history?: { role: string; content: string }[]
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // 1. Fetch relevant data based on intent
    const dataContexts = await fetchDataForIntent(message)

    // 2. Build the conversation for Gemini
    let contextBlock = ""
    if (dataContexts.length > 0) {
      contextBlock = "\n\n[DATA CONTEXT — Real data from the database]\n"
      for (const ctx of dataContexts) {
        contextBlock += `\n### ${ctx.label}\n${JSON.stringify(ctx.data, null, 2)}\n`
      }
      contextBlock += "\n[END DATA CONTEXT]\n\nUse the data above to answer the user's question. These are real, live numbers from the database."
    }

    // Build conversation history for Gemini
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

    // Add prior conversation history
    if (history && history.length > 0) {
      for (const msg of history.slice(-10)) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })
      }
    }

    // Add the current user message with data context
    contents.push({
      role: "user",
      parts: [{ text: message + contextBlock }],
    })

    // 3. Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        message: "AI service is not configured. Please set GEMINI_API_KEY in your environment variables.",
        action: undefined,
      })
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error("Gemini API error:", errText)
      return NextResponse.json(
        { message: "I'm having trouble connecting to the AI service right now. Please try again in a moment." },
        { status: 503 }
      )
    }

    const geminiData = await geminiResponse.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

    // 4. Parse the AI response
    let parsed: { message: string; action?: { type: string; payload: unknown } }

    try {
      // Try to extract JSON from the response (handle markdown fences)
      let jsonStr = rawText.trim()
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
      }
      parsed = JSON.parse(jsonStr)
    } catch {
      // If the AI didn't return valid JSON, wrap the raw text
      parsed = { message: rawText }
    }

    // 5. Save messages to database
    await db.aiChatMessage.createMany({
      data: [
        {
          userId,
          role: "user",
          content: message,
        },
        {
          userId,
          role: "assistant",
          content: parsed.message,
          metadata: parsed.action ? JSON.stringify(parsed.action) : null,
        },
      ],
    })

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
