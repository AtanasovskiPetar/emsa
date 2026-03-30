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
  phone: z.string().min(1, { message: "Phone is required" }),
  index: z.string().min(1, { message: "Student index is required" }),
  yearOfStudies: z
    .number()
    .int()
    .min(1, { message: "Year must be between 1 and 6" })
    .max(6, { message: "Year must be between 1 and 6" }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export const updateUserSchema = z
  .object({
    role: z.enum(Object.values(Role) as [Role, ...Role[]]).optional(),
    activeUntil: z.iso.date().nullable().optional(),
    isAlumni: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.role !== undefined || data.activeUntil !== undefined || data.isAlumni !== undefined,
    { message: "At least one field must be provided" }
  );

export type UpdateUserPayload = z.infer<typeof updateUserSchema>;

export const positionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  userId: z.uuid("User must be a valid user"),
});

export const positionReorderSchema = z.object({
  ids: z.array(z.uuid()).min(1, "At least one position required"),
});

export type PositionFormValues = z.infer<typeof positionSchema>;

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

export const projectSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().default(""),
    startingAt: z.iso.datetime({ message: "Starting date is required" }),
    pillarId: z.uuid().nullable().optional(),
    imageUrls: z.array(z.url()).default([]),
    registrationOpensAt: z.iso.datetime().nullable().optional(),
    registrationClosesAt: z.iso.datetime().nullable().optional(),
    maxParticipants: z.number().int().min(1).nullable().optional(),
  })
  .refine(
    (data) => !(!data.registrationOpensAt && (data.registrationClosesAt || data.maxParticipants)),
    { message: "Registration open date is required when close date or max participants is set" }
  )
  .refine(
    (data) =>
      !(
        data.registrationOpensAt &&
        data.registrationClosesAt &&
        new Date(data.registrationClosesAt) <= new Date(data.registrationOpensAt)
      ),
    { message: "Registration close date must be after open date", path: ["registrationClosesAt"] }
  );

export const updateProjectSchema = z
  .object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    startingAt: z.iso.datetime().optional(),
    pillarId: z.uuid().nullable().optional(),
    imageUrls: z.array(z.url()).optional(),
    registrationOpensAt: z.iso.datetime().nullable().optional(),
    registrationClosesAt: z.iso.datetime().nullable().optional(),
    maxParticipants: z.number().int().min(1).nullable().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.startingAt !== undefined ||
      data.pillarId !== undefined ||
      data.imageUrls !== undefined ||
      data.registrationOpensAt !== undefined ||
      data.registrationClosesAt !== undefined ||
      data.maxParticipants !== undefined,
    { message: "At least one field must be provided" }
  )
  .refine(
    (data) =>
      !(
        data.registrationOpensAt === null &&
        (data.registrationClosesAt != null || data.maxParticipants != null)
      ),
    { message: "Registration open date is required when close date or max participants is set" }
  )
  .refine(
    (data) =>
      !(
        data.registrationOpensAt &&
        data.registrationClosesAt &&
        new Date(data.registrationClosesAt) <= new Date(data.registrationOpensAt)
      ),
    { message: "Registration close date must be after open date", path: ["registrationClosesAt"] }
  );

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type UpdateProjectPayload = z.infer<typeof updateProjectSchema>;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const updateMeSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
    phone: z.string().optional().nullable(),
    imageUrl: z.url({ message: "Image URL must be a valid URL" }).optional().nullable(),
    index: z.string().optional().nullable(),
    yearOfStudies: z
      .number()
      .int()
      .min(1, { message: "Year must be between 1 and 6" })
      .max(6, { message: "Year must be between 1 and 6" })
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.phone !== undefined ||
      data.imageUrl !== undefined ||
      data.index !== undefined ||
      data.yearOfStudies !== undefined,
    { message: "At least one field must be provided" }
  );

export type UpdateMePayload = z.infer<typeof updateMeSchema>;

export const updateOrganizationSchema = z
  .object({
    name: z.string().min(1, "Organization name is required").optional(),
    logoUrl: z.url().nullable().optional(),
    description: z.string().optional(),
    aboutUs: z.string().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.logoUrl !== undefined ||
      data.description !== undefined ||
      data.aboutUs !== undefined,
    { message: "At least one field must be provided" }
  );

export type UpdateOrganizationPayload = z.infer<typeof updateOrganizationSchema>;
