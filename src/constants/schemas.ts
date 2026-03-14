import { z } from "zod";

import { Role } from "@/constants/enums";

export const loginSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const updateUserSchema = z
  .object({
    role: z.enum(Object.values(Role) as [Role, ...Role[]]).optional(),
    activeMember: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.activeMember !== undefined, {
    message: "At least one field must be provided",
  });

export type UpdateUserPayload = z.infer<typeof updateUserSchema>;

export const pillarSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  directorId: z.uuid("Director must be a valid user"),
});

export const updatePillarSchema = pillarSchema
  .partial()
  .refine(
    (data) =>
      data.name !== undefined || data.description !== undefined || data.directorId !== undefined,
    { message: "At least one field must be provided" }
  );

export type PillarFormValues = z.infer<typeof pillarSchema>;

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  startingAt: z.string().min(1, "Starting date is required"),
  pillarId: z.string().nullable().optional(),
  imageUrls: z.array(z.url()).default([]),
});

export const updateProjectSchema = projectSchema.partial();

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type UpdateProjectPayload = z.infer<typeof updateProjectSchema>;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const updateMeSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
    phone: z.string().min(1).optional().nullable(),
    imageUrl: z.url({ message: "Image URL must be a valid URL" }).optional().nullable(),
  })
  .refine(
    (data) => data.name !== undefined || data.phone !== undefined || data.imageUrl !== undefined,
    { message: "At least one field must be provided" }
  );

export type UpdateMePayload = z.infer<typeof updateMeSchema>;
