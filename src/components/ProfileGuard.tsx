import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { PageRoutes } from "@/constants/routes";
import { useAuth } from "@/context/auth";

export function ProfileGuard({ children }: { children: ReactNode }) {
  const { user, isLoadingUser } = useAuth();
  const location = useLocation();

  if (
    !isLoadingUser &&
    user &&
    !user.profileCompleted &&
    location.pathname !== PageRoutes.PROFILE
  ) {
    return <Navigate to={PageRoutes.PROFILE} replace />;
  }

  return <>{children}</>;
}
