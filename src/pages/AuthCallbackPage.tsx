import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { hasAccess } from "@/lib/utils";
import { Role } from "@/constants/enums";
import { PageRoutes } from "@/constants/routes";
import { useAuth } from "@/context/auth";

export function AuthCallbackPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      login(token);
    } else {
      navigate(PageRoutes.LOGIN, { replace: true });
    }
  }, [login, navigate]);

  useEffect(() => {
    if (!user) return;
    navigate(hasAccess(user.role, Role.ADMIN) ? PageRoutes.ADMIN : PageRoutes.HOME, {
      replace: true,
    });
  }, [user, navigate]);

  return null;
}
