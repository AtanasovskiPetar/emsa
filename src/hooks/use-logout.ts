import { useNavigate } from "react-router-dom";

import { PageRoutes } from "@/constants/routes";
import { useAuth } from "@/context/auth";

export function useLogout(onClose?: () => void) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return function handleLogout() {
    logout();
    onClose?.();
    navigate(PageRoutes.LOGIN);
  };
}
