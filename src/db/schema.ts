import { relations } from "drizzle-orm";
import { boolean, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { Role } from "@/constants/enums";

export const roleEnum = pgEnum("role", [Role.USER, Role.ADMIN, Role.SUPER_ADMIN]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: varchar("google_id", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }).unique(),
  role: roleEnum("role").notNull().default(Role.USER),
  activeMember: boolean("active_member").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pillars = pgTable("pillars", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  directorId: uuid("director_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pillarsRelations = relations(pillars, ({ one }) => ({
  director: one(users, { fields: [pillars.directorId], references: [users.id] }),
}));
