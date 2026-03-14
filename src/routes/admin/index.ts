import { dashboardRoutes } from "./dashboard";
import { organizationRoutes } from "./organization";
import { pillarRoutes } from "./pillars";
import { projectRoutes } from "./projects";
import { userRoutes } from "./users";

export const adminRoutes = {
  ...dashboardRoutes,
  ...userRoutes,
  ...pillarRoutes,
  ...projectRoutes,
  ...organizationRoutes,
};
