import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { Role } from "@/constants/enums";

export const roleEnum = pgEnum("role", [Role.USER, Role.ADMIN, Role.SUPER_ADMIN]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: varchar("google_id", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }),
  role: roleEnum("role").notNull().default(Role.USER),
  imageUrl: varchar("image_url", { length: 2048 }),
  index: varchar("student_index", { length: 50 }),
  yearOfStudies: integer("year_of_studies"),
  profileCompleted: boolean("profile_completed").notNull().default(false),
  activeMember: boolean("active_member").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pillars = pgTable("pillars", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  directorId: uuid("director_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pillarsRelations = relations(pillars, ({ one }) => ({
  director: one(users, { fields: [pillars.directorId], references: [users.id] }),
}));

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  startingAt: timestamp("starting_at").notNull(),
  pillarId: uuid("pillar_id").references(() => pillars.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projectImages = pgTable("project_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 2048 }).notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  pillar: one(pillars, { fields: [projects.pillarId], references: [pillars.id] }),
  images: many(projectImages),
}));

export const projectImagesRelations = relations(projectImages, ({ one }) => ({
  project: one(projects, { fields: [projectImages.projectId], references: [projects.id] }),
}));

export const organization = pgTable("organization", {
  id: integer("id").primaryKey().default(1),
  name: varchar("name", { length: 255 }).notNull().default(""),
  logoUrl: varchar("logo_url", { length: 2048 }),
  description: text("description").notNull().default(""),
  aboutUs: text("about_us").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
