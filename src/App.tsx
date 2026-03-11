import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { HomePage } from "@/pages/HomePage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AdminPage } from "@/pages/AdminPage";
import { UnauthorizedPage } from "@/pages/UnauthorizedPage";
import { PageRoutes } from "@/constants/routes";
import { Role } from "@/constants/enums";
import "@/index.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}
