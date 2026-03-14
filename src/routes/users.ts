import { eq } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { ALLOWED_IMAGE_TYPES, updateMeSchema } from "@/constants/schemas";
import { users } from "@/db/schema";
import { db } from "@/lib/db";
import { parseBody, withRole } from "@/lib/middleware";
import { getPresignedUploadUrl } from "@/lib/s3";

const meColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  phone: users.phone,
  imageUrl: users.imageUrl,
  createdAt: users.createdAt,
};

const getMe = withRole(Role.USER, async (_req, user) => {
  const [me] = await db.select(meColumns).from(users).where(eq(users.id, user.sub)).limit(1);

  if (!me) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(me);
});

const updateMe = withRole(Role.USER, async (req, user) => {
  const data = await parseBody(req, updateMeSchema);

  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, user.sub))
    .returning(meColumns);

  if (!updated) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(updated);
});

const getPresignedUrl = withRole(Role.USER, async (req, user) => {
  const url = new URL(req.url);
  const contentType = url.searchParams.get("contentType") ?? "image/jpeg";

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)) {
    return Response.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const ext = contentType.split("/")[1] ?? "jpg";
  const { uploadUrl, fileUrl } = await getPresignedUploadUrl(
    `avatars/${user.sub}.${ext}`,
    contentType
  );
  return Response.json({ uploadUrl, fileUrl: `${fileUrl}?v=${Date.now()}` });
});

export const userRoutes = {
  [ApiRoutes.USERS_ME]: { GET: getMe, PATCH: updateMe },
  [ApiRoutes.UPLOAD_PRESIGNED]: { GET: getPresignedUrl },
};
