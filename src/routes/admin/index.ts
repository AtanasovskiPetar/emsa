import { organizationRoutes } from "./organization";
import { pillarRoutes } from "./pillars";
import { projectRoutes } from "./projects";
import { userRoutes } from "./users";

export const adminRoutes = {
  ...userRoutes,
  ...pillarRoutes,
  ...projectRoutes,
  ...organizationRoutes,
};
