import { defineConfig } from "drizzle-kit";

import { env } from "./src/lib/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
    ssl: false,
  },
  schemaFilter: env.DB_SCHEMA,
});
