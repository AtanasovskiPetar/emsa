import { eq } from "drizzle-orm";

import { Role } from "../constants/enums";
import { ApiRoutes } from "../constants/routes";
import { pillarSchema, updatePillarSchema, updateUserSchema } from "../constants/schemas";
import { pillars, users } from "../db/schema";
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

// GET /api/admin/pillars
async function getPillars(req: Request): Promise<Response> {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== Role.SUPER_ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: pillars.id,
      name: pillars.name,
      description: pillars.description,
      directorId: pillars.directorId,
      directorName: users.name,
      createdAt: pillars.createdAt,
      updatedAt: pillars.updatedAt,
    })
    .from(pillars)
    .leftJoin(users, eq(pillars.directorId, users.id))
    .orderBy(pillars.createdAt);

  return Response.json(rows);
}

// POST /api/admin/pillars
async function createPillar(req: Request): Promise<Response> {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== Role.SUPER_ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = pillarSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }

  const [pillar] = await db.insert(pillars).values(body.data).returning();
  if (!pillar) {
    return Response.json({ error: "Failed to create pillar" }, { status: 500 });
  }

  return Response.json(pillar, { status: 201 });
}

// PATCH /api/admin/pillars/:id
async function updatePillar(req: Request): Promise<Response> {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== Role.SUPER_ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = (req as Request & { params: { id: string } }).params;

  const body = updatePillarSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }

  const [updated] = await db
    .update(pillars)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(pillars.id, id))
    .returning();

  if (!updated) {
    return Response.json({ error: "Pillar not found" }, { status: 404 });
  }

  return Response.json(updated);
}

// DELETE /api/admin/pillars/:id
async function deletePillar(req: Request): Promise<Response> {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== Role.SUPER_ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = (req as Request & { params: { id: string } }).params;

  const [deleted] = await db.delete(pillars).where(eq(pillars.id, id)).returning({ id: pillars.id });

  if (!deleted) {
    return Response.json({ error: "Pillar not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}

export const adminRoutes = {
  [ApiRoutes.ADMIN_USERS]: { GET: getUsers },
  [ApiRoutes.ADMIN_USER_BY_ID]: { PATCH: updateUser },
  [ApiRoutes.ADMIN_PILLARS]: { GET: getPillars, POST: createPillar },
  [ApiRoutes.ADMIN_PILLAR_BY_ID]: { PATCH: updatePillar, DELETE: deletePillar },
};
