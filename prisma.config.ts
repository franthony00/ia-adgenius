import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Load .env.local so Prisma CLI picks up DATABASE_URL
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Use unpooled direct connection for migrations — Neon
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});