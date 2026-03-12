export const PageRoutes = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_DASHBOARD_SEGMENT: "dashboard",
  UNAUTHORIZED: "/unauthorized",
  AUTH_CALLBACK: "/auth/callback",
} as const;

export const ApiRoutes = {
  AUTH_REGISTER: "/api/auth/register",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_GOOGLE: "/api/auth/google",
  AUTH_GOOGLE_CALLBACK: "/api/auth/google/callback",
} as const;
