import "@/index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Role } from "@/constants/enums";
import { PageRoutes } from "@/constants/routes";
import { AuthProvider } from "@/context/auth";

const STALE_TIME_5_MINUTES = 1000 * 60 * 5;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_5_MINUTES,
      retry: 1,
    },
  },
});

const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import("@/pages/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const AuthCallbackPage = lazy(() =>
  import("@/pages/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage }))
);
const UnauthorizedPage = lazy(() =>
  import("@/pages/UnauthorizedPage").then((m) => ({ default: m.UnauthorizedPage }))
);
const AdminLayout = lazy(() =>
  import("@/components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout }))
);
const DashboardPage = lazy(() =>
  import("@/pages/admin/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const UsersPage = lazy(() =>
  import("@/pages/admin/UsersPage").then((m) => ({ default: m.UsersPage }))
);
const PillarsPage = lazy(() =>
  import("@/pages/admin/PillarsPage").then((m) => ({ default: m.PillarsPage }))
);
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route path={PageRoutes.LOGIN} element={<LoginPage />} />
                <Route path={PageRoutes.REGISTER} element={<RegisterPage />} />
                <Route path={PageRoutes.UNAUTHORIZED} element={<UnauthorizedPage />} />
                <Route path={PageRoutes.AUTH_CALLBACK} element={<AuthCallbackPage />} />
                <Route path={PageRoutes.HOME} element={<HomePage />} />
                <Route
                  path={PageRoutes.PROFILE}
                  element={
                    <ProtectedRoute requiredRole={Role.USER}>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path={PageRoutes.ADMIN}
                  element={
                    <ProtectedRoute requiredRole={Role.ADMIN}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to={PageRoutes.ADMIN_DASHBOARD} replace />} />
                  <Route path={PageRoutes.ADMIN_DASHBOARD_SEGMENT} element={<DashboardPage />} />
                  <Route
                    path={PageRoutes.ADMIN_USERS_SEGMENT}
                    element={
                      <ProtectedRoute requiredRole={Role.ADMIN}>
                        <UsersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={PageRoutes.ADMIN_PILLARS_SEGMENT}
                    element={
                      <ProtectedRoute requiredRole={Role.SUPER_ADMIN}>
                        <PillarsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
