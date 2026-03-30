import { asc, desc, eq } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { positionReorderSchema, positionSchema } from "@/constants/schemas";
import { positions, users } from "@/db/schema";
import { db } from "@/lib/db";
import { parseBody, withRole } from "@/lib/middleware";

const positionColumns = {
  id: positions.id,
  title: positions.title,
  userId: positions.userId,
  order: positions.order,
  createdAt: positions.createdAt,
};

const listPositions = withRole(Role.SUPER_ADMIN, async () => {
  const rows = await db
    .select({
      id: positions.id,
      title: positions.title,
      userId: positions.userId,
      userName: users.name,
      userImageUrl: users.imageUrl,
      order: positions.order,
      createdAt: positions.createdAt,
    })
    .from(positions)
    .innerJoin(users, eq(positions.userId, users.id))
    .orderBy(asc(positions.order));

  return Response.json(rows);
});

const createPosition = withRole(Role.SUPER_ADMIN, async (req) => {
  const data = await parseBody(req, positionSchema);

  const [last] = await db
    .select({ order: positions.order })
    .from(positions)
    .orderBy(desc(positions.order))
    .limit(1);
  const nextOrder = last ? last.order + 1 : 0;

  const [created] = await db
    .insert(positions)
    .values({ ...data, order: nextOrder })
    .returning(positionColumns);

  if (!created) {
    return Response.json({ error: "Failed to create position" }, { status: 500 });
  }

  const [user] = await db
    .select({ name: users.name, imageUrl: users.imageUrl })
    .from(users)
    .where(eq(users.id, created.userId))
    .limit(1);

  return Response.json(
    { ...created, userName: user?.name ?? null, userImageUrl: user?.imageUrl ?? null },
    { status: 201 }
  );
});

const updatePosition = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id } = req.params;
  const data = await parseBody(req, positionSchema);

  const [updated] = await db
    .update(positions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(positions.id, id))
    .returning(positionColumns);

  if (!updated) {
    return Response.json({ error: "Position not found" }, { status: 404 });
  }

  const [user] = await db
    .select({ name: users.name, imageUrl: users.imageUrl })
    .from(users)
    .where(eq(users.id, updated.userId))
    .limit(1);

  return Response.json({
    ...updated,
    userName: user?.name ?? null,
    userImageUrl: user?.imageUrl ?? null,
  });
});

const deletePosition = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id } = req.params;

  const [deleted] = await db
    .delete(positions)
    .where(eq(positions.id, id))
    .returning({ id: positions.id });

  if (!deleted) {
    return Response.json({ error: "Position not found" }, { status: 404 });
  }

  return Response.json({ id: deleted.id });
});

const reorderPositions = withRole(Role.SUPER_ADMIN, async (req) => {
  const { ids } = await parseBody(req, positionReorderSchema);

  await db.transaction(async (tx) => {
    await Promise.all(
      ids.map((id, index) =>
        tx
          .update(positions)
          .set({ order: index, updatedAt: new Date() })
          .where(eq(positions.id, id))
      )
    );
  });

  return Response.json({ success: true });
});

export const positionRoutes = {
  [ApiRoutes.ADMIN_POSITIONS_REORDER]: { PATCH: reorderPositions },
  [ApiRoutes.ADMIN_POSITIONS]: { GET: listPositions, POST: createPosition },
  [ApiRoutes.ADMIN_POSITION_BY_ID]: { PATCH: updatePosition, DELETE: deletePosition },
};
