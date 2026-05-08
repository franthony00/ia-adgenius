import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

// DATABASE_URL is only available at runtime (not during Turbopack static analysis).
// Do NOT throw at module level — let it fail at request time if missing.
const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED ?? '';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient(
    connectionString ? { adapter: new PrismaPg({ connectionString }) } : undefined,
  );

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
