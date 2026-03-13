import { eq } from "drizzle-orm";

import { Role } from "../../constants/enums";
import { ApiRoutes } from "../../constants/routes";
import { updateUserSchema } from "../../constants/schemas";
import { users } from "../../db/schema";
import { db } from "../../lib/db";
import { withRole } from "../../lib/middleware";

const userColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  activeMember: users.activeMember,
  createdAt: users.createdAt,
};

const getUsers = withRole(Role.SUPER_ADMIN, async () => {
  const allUsers = await db.select(userColumns).from(users).orderBy(users.createdAt);
  return Response.json(allUsers);
});

const updateUser = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id } = req.params;

  const body = updateUserSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({ ...body.data, updatedAt: new Date() })
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
