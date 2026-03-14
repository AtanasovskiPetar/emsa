import { pillarRoutes } from "./pillars";
import { projectRoutes } from "./projects";
import { userRoutes } from "./users";

export const adminRoutes = {
  ...userRoutes,
  ...pillarRoutes,
  ...projectRoutes,
};
