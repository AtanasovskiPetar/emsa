export const PageRoutes = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_DASHBOARD_SEGMENT: "dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_USERS_SEGMENT: "users",
  ADMIN_PILLARS: "/admin/pillars",
  ADMIN_PILLARS_SEGMENT: "pillars",
  UNAUTHORIZED: "/unauthorized",
  AUTH_CALLBACK: "/auth/callback",
} as const;

export const ApiRoutes = {
  AUTH_REGISTER: "/api/auth/register",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_GOOGLE: "/api/auth/google",
  AUTH_GOOGLE_CALLBACK: "/api/auth/google/callback",
  ADMIN_USERS: "/api/admin/users",
  ADMIN_USER_BY_ID: "/api/admin/users/:id",
  ADMIN_PILLARS: "/api/admin/pillars",
  ADMIN_PILLAR_BY_ID: "/api/admin/pillars/:id",
} as const;
