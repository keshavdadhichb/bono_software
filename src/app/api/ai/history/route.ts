import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// GET — return the last 50 messages for the current user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const messages = await db.aiChatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true,
        role: true,
        content: true,
        metadata: true,
        createdAt: true,
      },
    })

    // Parse metadata JSON strings back into objects
    const parsed = messages.map((m) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
    }))

    return NextResponse.json({ messages: parsed })
  } catch (error) {
    console.error("AI history GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    )
  }
}

// DELETE — clear all chat history for the current user
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.aiChatMessage.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("AI history DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to clear chat history" },
      { status: 500 }
    )
  }
}
