import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { Role } from "@/constants/enums";
import { PageRoutes } from "@/constants/routes";
import { useAuth } from "@/context/auth";

interface Props {
  children: ReactNode;
  requiredRole?: Role;
}

export function hasAccess(userRole: Role, requiredRole: Role): boolean {
  if (userRole === requiredRole) return true;
  if (userRole === Role.SUPER_ADMIN) return true;
  return false;
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to={PageRoutes.LOGIN} replace />;

  if (requiredRole && !hasAccess(user.role, requiredRole)) {
    return <Navigate to={PageRoutes.UNAUTHORIZED} replace />;
  }

  return <>{children}</>;
}
