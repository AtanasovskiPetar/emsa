import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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
  isAlumni: boolean("is_alumni").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pillars = pgTable("pillars", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  directorId: uuid("director_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pillarsRelations = relations(pillars, ({ one }) => ({
  director: one(users, { fields: [pillars.directorId], references: [users.id] }),
}));

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  startingAt: timestamp("starting_at", { withTimezone: true }).notNull(),
  pillarId: uuid("pillar_id").references(() => pillars.id, { onDelete: "set null" }),
  registrationOpensAt: timestamp("registration_opens_at", { withTimezone: true }),
  registrationClosesAt: timestamp("registration_closes_at", { withTimezone: true }),
  maxParticipants: integer("max_participants"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectImages = pgTable("project_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 2048 }).notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectRegistrations = pgTable(
  "project_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attended: boolean("attended").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("project_registrations_project_user_unique").on(table.projectId, table.userId),
    index("project_registrations_project_id_idx").on(table.projectId),
  ]
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  pillar: one(pillars, { fields: [projects.pillarId], references: [pillars.id] }),
  images: many(projectImages),
  registrations: many(projectRegistrations),
}));

export const projectRegistrationsRelations = relations(projectRegistrations, ({ one }) => ({
  project: one(projects, { fields: [projectRegistrations.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectRegistrations.userId], references: [users.id] }),
}));

export const projectImagesRelations = relations(projectImages, ({ one }) => ({
  project: one(projects, { fields: [projectImages.projectId], references: [projects.id] }),
}));

export const positions = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const positionsRelations = relations(positions, ({ one }) => ({
  user: one(users, { fields: [positions.userId], references: [users.id] }),
}));

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accountSetupTokens = pgTable("account_setup_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userActivations = pgTable("user_activations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  activations: many(userActivations),
}));

export const userActivationsRelations = relations(userActivations, ({ one }) => ({
  user: one(users, { fields: [userActivations.userId], references: [users.id] }),
}));

export const organization = pgTable("organization", {
  id: integer("id").primaryKey().default(1),
  name: varchar("name", { length: 255 }).notNull().default(""),
  logoUrl: varchar("logo_url", { length: 2048 }),
  description: text("description").notNull().default(""),
  aboutUs: text("about_us").notNull().default(""),
  instagramUrl: varchar("instagram_url", { length: 2048 }),
  facebookUrl: varchar("facebook_url", { length: 2048 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
