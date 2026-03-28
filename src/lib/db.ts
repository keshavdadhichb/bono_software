import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
