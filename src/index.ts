import { serve } from "bun";
import { eq } from "drizzle-orm";

import { organization } from "./db/schema";
import index from "./index.html";
import { db } from "./lib/db";
import { env } from "./lib/env";
import { authRoutes } from "./routes/auth";
import { dashboardRoutes } from "./routes/dashboard";
import { organizationRoutes } from "./routes/organization";
import { pillarRoutes } from "./routes/pillars";
import { positionRoutes } from "./routes/positions";
import { projectRoutes } from "./routes/projects";
import { userRoutes } from "./routes/users";

const isProd = process.env.NODE_ENV === "production";

type OrgMeta = { name: string; logoUrl: string; description: string };
let orgMetaCache: OrgMeta | null = null;

async function getOrgMeta(): Promise<OrgMeta> {
  if (orgMetaCache) return orgMetaCache;
  const [org] = await db
    .select({
      name: organization.name,
      logoUrl: organization.logoUrl,
      description: organization.description,
    })
    .from(organization)
    .where(eq(organization.id, 1))
    .limit(1);
  orgMetaCache = {
    name: org?.name || "EMSA Macedonia",
    logoUrl: org?.logoUrl || `${env.APP_URL}/logo.png`,
    description:
      org?.description || "EMSA Macedonia — European Medical Students' Association Macedonia.",
  };
  return orgMetaCache;
}

const server = serve({
  port: env.PORT,
  routes: {
    "/*": isProd
      ? async (req: Request) => {
          const pathname = new URL(req.url).pathname;
          const file = Bun.file(`./dist${pathname}`);
          if (await file.exists()) return new Response(file);
          const org = await getOrgMeta();
          const html = (await Bun.file("./dist/index.html").text())
            .replaceAll("%APP_URL%", env.APP_URL)
            .replaceAll("%ORG_NAME%", org.name)
            .replaceAll("%ORG_LOGO_URL%", org.logoUrl)
            .replaceAll("%ORG_DESCRIPTION%", org.description);
          return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
        }
      : index,
    ...authRoutes,
    ...organizationRoutes,
    ...pillarRoutes,
    ...positionRoutes,
    ...projectRoutes,
    ...userRoutes,
    ...dashboardRoutes,
  },

  development: !isProd && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
