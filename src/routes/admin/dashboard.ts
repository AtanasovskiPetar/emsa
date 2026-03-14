import { asc, count, gt, sql } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { pillars, projects, users } from "@/db/schema";
import { db } from "@/lib/db";
import { withRole } from "@/lib/middleware";

const getDashboardStats = withRole(Role.ADMIN, async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [userRow, projectRow, pillarRow, nextProjectRows] = await Promise.all([
    db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${users.activeMember} = true)`,
      })
      .from(users)
      .then(([r]) => r!),
    db
      .select({
        total: count(),
        upcoming: sql<number>`count(*) filter (where ${projects.startingAt} > now())`,
        thisMonth: sql<number>`count(*) filter (where ${projects.startingAt} >= ${startOfMonth} and ${projects.startingAt} < ${startOfNextMonth})`,
      })
      .from(projects)
      .then(([r]) => r!),
    db
      .select({ total: count() })
      .from(pillars)
      .then(([r]) => r!),
    db
      .select({ title: projects.title, startingAt: projects.startingAt })
      .from(projects)
      .where(gt(projects.startingAt, now))
      .orderBy(asc(projects.startingAt))
      .limit(1),
  ]);

  return Response.json({
    users: {
      total: userRow.total,
      active: Number(userRow.active),
      inactive: userRow.total - Number(userRow.active),
    },
    projects: {
      total: projectRow.total,
      upcoming: Number(projectRow.upcoming),
      thisMonth: Number(projectRow.thisMonth),
      next: nextProjectRows[0]
        ? {
            title: nextProjectRows[0].title,
            startingAt: nextProjectRows[0].startingAt.toISOString(),
          }
        : null,
    },
    pillars: { total: pillarRow.total },
  });
});

export const dashboardRoutes = {
  [ApiRoutes.ADMIN_DASHBOARD]: { GET: getDashboardStats },
};
