import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL uses session-mode pooler (port 5432) for migrations/db push
    // DATABASE_URL uses transaction-mode pooler (port 6543) for runtime queries
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
