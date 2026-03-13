import { pillarRoutes } from "./pillars";
import { userRoutes } from "./users";

export const adminRoutes = {
  ...userRoutes,
  ...pillarRoutes,
};
