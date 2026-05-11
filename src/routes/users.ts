import { and, asc, desc, eq, gte, inArray, isNotNull, lte, ne } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import {
  bulkImportSchema,
  createActivationSchema,
  updateActivationSchema,
  updateMeSchema,
  updateUserSchema,
} from "@/constants/schemas";
import { userActivations, users } from "@/db/schema";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { createUserToken } from "@/lib/jwt";
import { parseBody, withRole } from "@/lib/middleware";
import { getPresignedUploadUrl, validateImageContentType } from "@/lib/s3";

const meColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  phone: users.phone,
  imageUrl: users.imageUrl,
  index: users.index,
  yearOfStudies: users.yearOfStudies,
  profileCompleted: users.profileCompleted,
  isAlumni: users.isAlumni,
  createdAt: users.createdAt,
};

const adminUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  phone: users.phone,
  index: users.index,
  yearOfStudies: users.yearOfStudies,
  profileCompleted: users.profileCompleted,
  role: users.role,
  isAlumni: users.isAlumni,
  imageUrl: users.imageUrl,
  createdAt: users.createdAt,
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function activePeriodCondition(date: string) {
  return and(
    eq(userActivations.userId, users.id),
    lte(userActivations.startDate, date),
    gte(userActivations.endDate, date)
  );
}

// Self
const getMe = withRole(
  Role.USER,
  async (_req, user) => {
    const today = todayStr();
    const [me] = await db
      .select({ ...meColumns, isActive: isNotNull(userActivations.id) })
      .from(users)
      .leftJoin(userActivations, activePeriodCondition(today))
      .where(eq(users.id, user.sub))
      .limit(1);

    if (!me) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(me);
  },
  { allowIncomplete: true }
);

const updateMe = withRole(
  Role.USER,
  async (req, user) => {
    const data = await parseBody(req, updateMeSchema);

    const [current] = await db
      .select({
        phone: users.phone,
        index: users.index,
        yearOfStudies: users.yearOfStudies,
        profileCompleted: users.profileCompleted,
      })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (!current) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const phone = data.phone !== undefined ? data.phone : current.phone;
    const index = data.index !== undefined ? data.index : current.index;
    const yearOfStudies =
      data.yearOfStudies !== undefined ? data.yearOfStudies : current.yearOfStudies;
    const profileCompleted = !!(phone && index && yearOfStudies);

    const today = todayStr();
    const [updated] = await db
      .update(users)
      .set({ ...data, phone, index, yearOfStudies, profileCompleted, updatedAt: new Date() })
      .where(eq(users.id, user.sub))
      .returning(meColumns);

    if (!updated) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const [activeRow] = await db
      .select({ isActive: isNotNull(userActivations.id) })
      .from(users)
      .leftJoin(userActivations, activePeriodCondition(today))
      .where(eq(users.id, user.sub))
      .limit(1);

    const isActive = activeRow?.isActive ?? false;

    if (profileCompleted === current.profileCompleted) {
      return Response.json({ ...updated, isActive });
    }

    // profileCompleted changed — re-issue JWT so the client is in sync
    const token = await createUserToken({
      id: user.sub,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      profileCompleted,
    });

    return Response.json({ ...updated, isActive, token });
  },
  { allowIncomplete: true }
);

const getPresignedUrl = withRole(
  Role.USER,
  async (req, user) => {
    const contentType = new URL(req.url).searchParams.get("contentType") ?? "image/jpeg";
    const ext = validateImageContentType(contentType);
    const { uploadUrl, fileUrl } = await getPresignedUploadUrl(
      `avatars/${user.sub}.${ext}`,
      contentType
    );
    return Response.json({ uploadUrl, fileUrl: `${fileUrl}?v=${Date.now()}` });
  },
  { allowIncomplete: true }
);

// Admin
const getUsers = withRole(Role.ADMIN, async () => {
  const today = todayStr();
  const [allUsers, allActivations] = await Promise.all([
    db.select(adminUserColumns).from(users).orderBy(asc(users.createdAt)),
    db.select().from(userActivations).orderBy(desc(userActivations.startDate)),
  ]);

  const activationsByUser = new Map<string, typeof allActivations>();
  for (const a of allActivations) {
    const list = activationsByUser.get(a.userId) ?? [];
    list.push(a);
    activationsByUser.set(a.userId, list);
  }

  return Response.json(
    allUsers.map((u) => {
      const activations = activationsByUser.get(u.id) ?? [];
      return {
        ...u,
        activations,
        isActive: activations.some((a) => a.startDate <= today && a.endDate >= today),
      };
    })
  );
});

const updateUser = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id } = req.params;
  const data = await parseBody(req, updateUserSchema);

  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(adminUserColumns);

  if (!updated) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const today = todayStr();
  const activationRows = await db
    .select()
    .from(userActivations)
    .where(eq(userActivations.userId, id))
    .orderBy(desc(userActivations.startDate));

  return Response.json({
    ...updated,
    activations: activationRows,
    isActive: activationRows.some((a) => a.startDate <= today && a.endDate >= today),
  });
});

// Activations
async function checkOverlap(
  userId: string,
  startDate: string,
  endDate: string,
  excludeId?: string
): Promise<boolean> {
  const conditions = [
    eq(userActivations.userId, userId),
    lte(userActivations.startDate, endDate),
    gte(userActivations.endDate, startDate),
  ];
  if (excludeId) conditions.push(ne(userActivations.id, excludeId));

  const [overlap] = await db
    .select({ id: userActivations.id })
    .from(userActivations)
    .where(and(...conditions))
    .limit(1);

  return !!overlap;
}

const createActivation = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id: userId } = req.params;
  const data = await parseBody(req, createActivationSchema);

  const hasOverlap = await checkOverlap(userId, data.startDate, data.endDate);
  if (hasOverlap) {
    return Response.json({ error: "Activation period overlaps an existing one" }, { status: 422 });
  }

  const [activation] = await db
    .insert(userActivations)
    .values({ userId, startDate: data.startDate, endDate: data.endDate })
    .returning();

  return Response.json(activation, { status: 201 });
});

const updateActivation = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id: activationId } = req.params;
  const data = await parseBody(req, updateActivationSchema);

  const [existing] = await db
    .select()
    .from(userActivations)
    .where(eq(userActivations.id, activationId))
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Activation not found" }, { status: 404 });
  }

  const newStart = data.startDate ?? existing.startDate;
  const newEnd = data.endDate ?? existing.endDate;

  if (newStart > newEnd) {
    return Response.json({ error: "End date must be on or after start date" }, { status: 400 });
  }

  const hasOverlap = await checkOverlap(existing.userId, newStart, newEnd, activationId);
  if (hasOverlap) {
    return Response.json({ error: "Activation period overlaps an existing one" }, { status: 422 });
  }

  const [updated] = await db
    .update(userActivations)
    .set({ startDate: newStart, endDate: newEnd })
    .where(eq(userActivations.id, activationId))
    .returning();

  return Response.json(updated);
});

const deleteActivation = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id: activationId } = req.params;

  const [deleted] = await db
    .delete(userActivations)
    .where(eq(userActivations.id, activationId))
    .returning({ id: userActivations.id });

  if (!deleted) {
    return Response.json({ error: "Activation not found" }, { status: 404 });
  }

  return Response.json({ id: deleted.id });
});

const bulkImportUsers = withRole(Role.SUPER_ADMIN, async (req) => {
  const data = await parseBody(req, bulkImportSchema);

  const emails = data.users.map((u) => u.email);
  const existing = await db
    .select({ email: users.email })
    .from(users)
    .where(inArray(users.email, emails));
  const existingEmails = new Set(existing.map((e) => e.email));

  const toCreate = data.users.filter((u) => !existingEmails.has(u.email));
  const skipped = data.users
    .filter((u) => existingEmails.has(u.email))
    .map((u) => ({ email: u.email, reason: "already exists" }));

  if (toCreate.length === 0) {
    return Response.json({ created: 0, skipped });
  }

  const created = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(users)
      .values(
        toCreate.map((u) => ({
          name: u.name,
          email: u.email,
          phone: u.phone ?? null,
          role: u.role ?? Role.USER,
          imageUrl: u.imageUrl ?? null,
          index: u.index ?? null,
          yearOfStudies: u.yearOfStudies ?? null,
          isAlumni: u.isAlumni ?? false,
          profileCompleted: !!(u.phone && u.index && u.yearOfStudies),
        }))
      )
      .returning();

    const toCreateByEmail = new Map(toCreate.map((u) => [u.email, u]));
    const activationRows = inserted.flatMap((user) => {
      const src = toCreateByEmail.get(user.email);
      if (!src?.activationStartDate || !src?.activationEndDate) return [];
      return [
        { userId: user.id, startDate: src.activationStartDate, endDate: src.activationEndDate },
      ];
    });

    if (activationRows.length > 0) {
      await tx.insert(userActivations).values(activationRows);
    }

    return inserted;
  });

  if (data.sendWelcomeEmails) {
    await Promise.allSettled(created.map((u) => sendWelcomeEmail(u.email, u.name)));
  }

  return Response.json({ created: created.length, skipped }, { status: 201 });
});

export const userRoutes = {
  [ApiRoutes.USERS_ME]: { GET: getMe, PATCH: updateMe },
  [ApiRoutes.UPLOAD_PRESIGNED]: { GET: getPresignedUrl },
  [ApiRoutes.ADMIN_USERS]: { GET: getUsers },
  [ApiRoutes.ADMIN_USER_BY_ID]: { PATCH: updateUser },
  [ApiRoutes.ADMIN_USER_ACTIVATIONS]: { POST: createActivation },
  [ApiRoutes.ADMIN_ACTIVATION_BY_ID]: { PATCH: updateActivation, DELETE: deleteActivation },
  [ApiRoutes.ADMIN_USERS_BULK_IMPORT]: { POST: bulkImportUsers },
};
