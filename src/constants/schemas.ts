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
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  phone: z.string().trim().min(1, { message: "Phone is required" }),
  index: z.string().trim().min(1, { message: "Student index is required" }),
  yearOfStudies: z
    .number()
    .int()
    .min(1, { message: "Year must be between 1 and 6" })
    .max(6, { message: "Year must be between 1 and 6" }),
  university: z.string().trim().min(1).optional().nullable(),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export const updateUserSchema = z
  .object({
    role: z.enum(Object.values(Role) as [Role, ...Role[]]).optional(),
    isAlumni: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isAlumni !== undefined, {
    message: "At least one field must be provided",
  });

export type UpdateUserPayload = z.infer<typeof updateUserSchema>;

export const createActivationSchema = z
  .object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type CreateActivationPayload = z.infer<typeof createActivationSchema>;

export const updateActivationSchema = z
  .object({
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
  })
  .refine((data) => data.startDate !== undefined || data.endDate !== undefined, {
    message: "At least one field must be provided",
  })
  .refine((d) => !d.startDate || !d.endDate || d.startDate <= d.endDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type UpdateActivationPayload = z.infer<typeof updateActivationSchema>;

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
  imageUrl: z.url().nullable().optional(),
});

export const updatePillarSchema = pillarSchema
  .partial()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.directorId !== undefined ||
      data.imageUrl !== undefined,
    { message: "At least one field must be provided" }
  );

export type PillarFormValues = z.infer<typeof pillarSchema>;

export const projectSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().default(""),
    startingAt: z.iso.datetime({ message: "Starting date is required" }),
    endingAt: z.iso.datetime().nullable().optional(),
    pillarId: z.uuid().nullable().optional(),
    imageUrls: z.array(z.url()).default([]),
    registrationOpensAt: z.iso.datetime().nullable().optional(),
    registrationClosesAt: z.iso.datetime().nullable().optional(),
    maxParticipants: z.number().int().min(1).nullable().optional(),
    activeMembersOnly: z.boolean().default(false),
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
  )
  .refine((data) => !(data.endingAt && new Date(data.endingAt) <= new Date(data.startingAt)), {
    message: "Ending date must be after starting date",
    path: ["endingAt"],
  });

export const updateProjectSchema = z
  .object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    startingAt: z.iso.datetime().optional(),
    endingAt: z.iso.datetime().nullable().optional(),
    pillarId: z.uuid().nullable().optional(),
    imageUrls: z.array(z.url()).optional(),
    registrationOpensAt: z.iso.datetime().nullable().optional(),
    registrationClosesAt: z.iso.datetime().nullable().optional(),
    maxParticipants: z.number().int().min(1).nullable().optional(),
    activeMembersOnly: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.startingAt !== undefined ||
      data.endingAt !== undefined ||
      data.pillarId !== undefined ||
      data.imageUrls !== undefined ||
      data.registrationOpensAt !== undefined ||
      data.registrationClosesAt !== undefined ||
      data.maxParticipants !== undefined ||
      data.activeMembersOnly !== undefined,
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
  )
  .refine(
    (data) =>
      !(data.endingAt && data.startingAt && new Date(data.endingAt) <= new Date(data.startingAt)),
    { message: "Ending date must be after starting date", path: ["endingAt"] }
  );

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const updateMeSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
    phone: z.string().trim().min(1, { message: "Phone cannot be blank" }).optional().nullable(),
    imageUrl: z.url({ message: "Image URL must be a valid URL" }).optional().nullable(),
    index: z
      .string()
      .trim()
      .min(1, { message: "Student index cannot be blank" })
      .optional()
      .nullable(),
    yearOfStudies: z
      .number()
      .int()
      .min(1, { message: "Year must be between 1 and 6" })
      .max(6, { message: "Year must be between 1 and 6" })
      .optional()
      .nullable(),
    university: z.string().trim().min(1).optional().nullable(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.phone !== undefined ||
      data.imageUrl !== undefined ||
      data.index !== undefined ||
      data.yearOfStudies !== undefined ||
      data.university !== undefined,
    { message: "At least one field must be provided" }
  );

export type UpdateMePayload = z.infer<typeof updateMeSchema>;

export const updateOrganizationSchema = z
  .object({
    name: z.string().min(1, "Organization name is required").optional(),
    logoUrl: z.url().nullable().optional(),
    description: z.string().optional(),
    aboutUs: z.string().optional(),
    instagramUrl: z.url().nullable().optional(),
    facebookUrl: z.url().nullable().optional(),
    location: z.string().nullable().optional(),
    email: z.email().nullable().optional(),
    phone: z.string().nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.logoUrl !== undefined ||
      data.description !== undefined ||
      data.aboutUs !== undefined ||
      data.instagramUrl !== undefined ||
      data.facebookUrl !== undefined ||
      data.location !== undefined ||
      data.email !== undefined ||
      data.phone !== undefined,
    { message: "At least one field must be provided" }
  );

export const setupPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

export type SetupPasswordPayload = z.infer<typeof setupPasswordSchema>;

export const bulkImportRowSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.email({ message: "Invalid email address" }),
    phone: z.string().trim().min(1).optional(),
    role: z
      .enum(Object.values(Role) as [Role, ...Role[]])
      .optional()
      .default(Role.USER),
    imageUrl: z.url({ message: "Invalid image URL" }).optional(),
    index: z.string().trim().min(1).optional(),
    yearOfStudies: z
      .number()
      .int()
      .min(1, { message: "Year must be between 1 and 6" })
      .max(6, { message: "Year must be between 1 and 6" })
      .optional(),
    isAlumni: z.boolean().optional().default(false),
    activationStartDate: z.iso.date().optional(),
    activationEndDate: z.iso.date().optional(),
  })
  .refine((d) => !!d.activationStartDate === !!d.activationEndDate, {
    message: "Both activation dates must be provided or both omitted",
  })
  .refine(
    (d) =>
      !d.activationStartDate ||
      !d.activationEndDate ||
      d.activationEndDate >= d.activationStartDate,
    { message: "activationEndDate must be on or after activationStartDate" }
  );

export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;

export const resendWelcomeEmailsSchema = z.object({
  userIds: z.array(z.uuid()).min(1, "At least one user ID is required"),
});

export type ResendWelcomeEmailsPayload = z.infer<typeof resendWelcomeEmailsSchema>;

export const bulkImportSchema = z.object({
  users: z.array(bulkImportRowSchema).min(1).max(500),
  sendWelcomeEmails: z.boolean().default(true),
});

export type BulkImportPayload = z.infer<typeof bulkImportSchema>;
