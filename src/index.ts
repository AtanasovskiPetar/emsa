import { serve } from "bun";

import index from "./index.html";
import { env } from "./lib/env";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { organizationRoutes } from "./routes/organization";
import { userRoutes } from "./routes/users";

const server = serve({
  port: env.PORT,
  routes: {
    "/*": index,
    ...authRoutes,
    ...organizationRoutes,
    ...adminRoutes,
    ...userRoutes,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
