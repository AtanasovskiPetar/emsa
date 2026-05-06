import { serve } from "bun";

import index from "./index.html";
import { env } from "./lib/env";
import { authRoutes } from "./routes/auth";
import { dashboardRoutes } from "./routes/dashboard";
import { organizationRoutes } from "./routes/organization";
import { pillarRoutes } from "./routes/pillars";
import { positionRoutes } from "./routes/positions";
import { projectRoutes } from "./routes/projects";
import { userRoutes } from "./routes/users";

const isProd = process.env.NODE_ENV === "production";

const server = serve({
  port: env.PORT,
  routes: {
    "/*": isProd
      ? async (req: Request) => {
          const pathname = new URL(req.url).pathname;
          const file = Bun.file(`./dist${pathname}`);
          if (await file.exists()) return new Response(file);
          return new Response(Bun.file("./dist/index.html"));
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
