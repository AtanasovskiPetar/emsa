import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { Provider, Role } from "@/constants/enums";

export const providerEnum = pgEnum("provider", [Provider.CREDENTIALS, Provider.GOOGLE]);
export const roleEnum = pgEnum("role", [Role.USER, Role.ADMIN, Role.SUPER_ADMIN]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: varchar("google_id", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }).unique(),
  provider: providerEnum("provider").notNull(),
  role: roleEnum("role").notNull().default(Role.USER),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
