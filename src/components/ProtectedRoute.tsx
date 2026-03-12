import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import type { Role } from "@/constants/enums";
import { PageRoutes } from "@/constants/routes";
import { useAuth } from "@/context/auth";

interface Props {
  children: ReactNode;
  requiredRole?: Role;
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to={PageRoutes.LOGIN} replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={PageRoutes.UNAUTHORIZED} replace />;
  }

  return <>{children}</>;
}
