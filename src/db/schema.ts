import { pgTable, pgEnum, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider", ["CREDENTIALS", "GOOGLE"]);
export const roleEnum = pgEnum("role", ["USER", "ADMIN"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: varchar("google_id", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }).unique(),
  provider: providerEnum("provider").notNull(),
  role: roleEnum("role").notNull().default("USER"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
