import { PrismaClient } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════
// PRISMA CLIENT INITIALIZATION
// ═══════════════════════════════════════════════════════════════

// Set default DATABASE_URL for SQLite if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

// Singleton pattern to ensure only one Prisma client instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
