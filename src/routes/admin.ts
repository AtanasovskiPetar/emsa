import { eq } from "drizzle-orm";
import { z } from "zod";

import { Role } from "../constants/enums";
import { ApiRoutes } from "../constants/routes";
import { users } from "../db/schema";
import { db } from "../lib/db";
import { verifyJwt } from "../lib/jwt";

async function getAuthUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return await verifyJwt(auth.slice(7));
  } catch {
    return null;
  }
}

const userColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  activeMember: users.activeMember,
  createdAt: users.createdAt,
};

// GET /api/admin/users
async function getUsers(req: Request): Promise<Response> {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== Role.SUPER_ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db.select(userColumns).from(users).orderBy(users.createdAt);
  return Response.json(allUsers);
}

const updateUserSchema = z
  .object({
    role: z.enum(Object.values(Role) as [Role, ...Role[]]).optional(),
    activeMember: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.activeMember !== undefined, {
    message: "At least one field must be provided",
  });

// PATCH /api/admin/users/:id
async function updateUser(req: Request): Promise<Response> {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== Role.SUPER_ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = (req as Request & { params: { id: string } }).params;

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
}

export const adminRoutes = {
  [ApiRoutes.ADMIN_USERS]: { GET: getUsers },
  [ApiRoutes.ADMIN_USER_BY_ID]: { PATCH: updateUser },
};
