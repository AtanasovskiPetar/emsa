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

const server = serve({
  port: env.PORT,
  routes: {
    "/*": index,
    ...authRoutes,
    ...organizationRoutes,
    ...pillarRoutes,
    ...positionRoutes,
    ...projectRoutes,
    ...userRoutes,
    ...dashboardRoutes,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
