import "@/index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

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
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const AuthCallbackPage = lazy(() =>
  import("@/pages/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage }))
);
const UnauthorizedPage = lazy(() =>
  import("@/pages/UnauthorizedPage").then((m) => ({ default: m.UnauthorizedPage }))
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
                <Route
                  path={PageRoutes.ADMIN}
                  element={
                    <ProtectedRoute requiredRole={Role.ADMIN}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route path={PageRoutes.AUTH_CALLBACK} element={<AuthCallbackPage />} />
                <Route path={PageRoutes.HOME} element={<HomePage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
