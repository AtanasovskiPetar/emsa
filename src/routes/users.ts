import { eq } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { ALLOWED_IMAGE_TYPES, updateMeSchema, updateUserSchema } from "@/constants/schemas";
import { users } from "@/db/schema";
import { db } from "@/lib/db";
import { signJwt } from "@/lib/jwt";
import { parseBody, withRole } from "@/lib/middleware";
import { getPresignedUploadUrl } from "@/lib/s3";

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
  activeUntil: users.activeUntil,
  imageUrl: users.imageUrl,
  createdAt: users.createdAt,
};

// Self
const getMe = withRole(
  Role.USER,
  async (_req, user) => {
    const [me] = await db.select(meColumns).from(users).where(eq(users.id, user.sub)).limit(1);

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

    const [updated] = await db
      .update(users)
      .set({ ...data, phone, index, yearOfStudies, profileCompleted, updatedAt: new Date() })
      .where(eq(users.id, user.sub))
      .returning(meColumns);

    if (!updated) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (profileCompleted === current.profileCompleted) {
      return Response.json(updated);
    }

    // profileCompleted changed — re-issue JWT so the client is in sync
    const token = await signJwt({
      sub: user.sub,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      profileCompleted,
    });

    return Response.json({ ...updated, token });
  },
  { allowIncomplete: true }
);

const getPresignedUrl = withRole(
  Role.USER,
  async (req, user) => {
    const contentType = new URL(req.url).searchParams.get("contentType") ?? "image/jpeg";

    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)) {
      return Response.json({ error: "Unsupported image type" }, { status: 400 });
    }

    const ext = contentType.split("/")[1] ?? "jpg";
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
  const allUsers = await db.select(adminUserColumns).from(users).orderBy(users.createdAt);
  const today = new Date().toISOString().slice(0, 10);
  return Response.json(
    allUsers.map((u) => ({
      ...u,
      isActive: u.activeUntil != null && u.activeUntil >= today,
    }))
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

  const today = new Date().toISOString().slice(0, 10);
  return Response.json({
    ...updated,
    isActive: updated.activeUntil != null && updated.activeUntil >= today,
  });
});

export const userRoutes = {
  [ApiRoutes.USERS_ME]: { GET: getMe, PATCH: updateMe },
  [ApiRoutes.UPLOAD_PRESIGNED]: { GET: getPresignedUrl },
  [ApiRoutes.ADMIN_USERS]: { GET: getUsers },
  [ApiRoutes.ADMIN_USER_BY_ID]: { PATCH: updateUser },
};
