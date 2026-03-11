import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { PageRoutes } from "@/constants/routes";
import { Role } from "@/constants/enums";

export function AuthCallbackPage() {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      login(token);
    } else {
      navigate(PageRoutes.LOGIN, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (isLoading || !user) return;
    navigate(user.role === Role.ADMIN ? PageRoutes.ADMIN : PageRoutes.HOME, { replace: true });
  }, [user, isLoading]);

  return null;
}
