import { eq } from "drizzle-orm";

import { Role } from "../../constants/enums";
import { ApiRoutes } from "../../constants/routes";
import { pillarSchema, updatePillarSchema } from "../../constants/schemas";
import { pillars, users } from "../../db/schema";
import { db } from "../../lib/db";
import { withRole } from "../../lib/middleware";

const getPillars = withRole(Role.SUPER_ADMIN, async () => {
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
});

const createPillar = withRole(Role.SUPER_ADMIN, async (req) => {
  const body = pillarSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }

  const [pillar] = await db.insert(pillars).values(body.data).returning();
  if (!pillar) {
    return Response.json({ error: "Failed to create pillar" }, { status: 500 });
  }

  return Response.json(pillar, { status: 201 });
});

const updatePillar = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id } = req.params;

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
});

const deletePillar = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id } = req.params;

  const [deleted] = await db
    .delete(pillars)
    .where(eq(pillars.id, id))
    .returning({ id: pillars.id });

  if (!deleted) {
    return Response.json({ error: "Pillar not found" }, { status: 404 });
  }

  return Response.json({ success: true });
});

export const pillarRoutes = {
  [ApiRoutes.ADMIN_PILLARS]: { GET: getPillars, POST: createPillar },
  [ApiRoutes.ADMIN_PILLAR_BY_ID]: { PATCH: updatePillar, DELETE: deletePillar },
};
