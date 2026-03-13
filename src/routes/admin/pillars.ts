import { eq } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { pillarSchema, updatePillarSchema } from "@/constants/schemas";
import { pillars, users } from "@/db/schema";
import { db } from "@/lib/db";
import { parseBody, withRole } from "@/lib/middleware";

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
  const data = await parseBody(req, pillarSchema);

  const [pillar] = await db.insert(pillars).values(data).returning();
  if (!pillar) {
    return Response.json({ error: "Failed to create pillar" }, { status: 500 });
  }

  return Response.json(pillar, { status: 201 });
});

const updatePillar = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id } = req.params;
  const data = await parseBody(req, updatePillarSchema);

  const [updated] = await db
    .update(pillars)
    .set({ ...data, updatedAt: new Date() })
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
