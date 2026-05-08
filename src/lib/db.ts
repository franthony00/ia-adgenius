import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

// Next.js loads .env.local automatically — DATABASE_URL is available here
const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
