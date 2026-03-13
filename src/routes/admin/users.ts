import { eq } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { updateUserSchema } from "@/constants/schemas";
import { users } from "@/db/schema";
import { db } from "@/lib/db";
import { parseBody, withRole } from "@/lib/middleware";

const userColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  activeMember: users.activeMember,
  imageUrl: users.imageUrl,
  createdAt: users.createdAt,
};

const getUsers = withRole(Role.SUPER_ADMIN, async () => {
  const allUsers = await db.select(userColumns).from(users).orderBy(users.createdAt);
  return Response.json(allUsers);
});

const updateUser = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id } = req.params;
  const data = await parseBody(req, updateUserSchema);

  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(userColumns);

  if (!updated) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(updated);
});

export const userRoutes = {
  [ApiRoutes.ADMIN_USERS]: { GET: getUsers },
  [ApiRoutes.ADMIN_USER_BY_ID]: { PATCH: updateUser },
};
