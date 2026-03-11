import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";
import { env } from "./env";

const sql = new SQL({
  hostname: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
});

export const db = drizzle(sql, { schema: {}, logger: env.ENV === "development" });
