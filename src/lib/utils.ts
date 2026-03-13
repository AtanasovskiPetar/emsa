import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { Role } from "@/constants/enums";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasAccess(userRole: Role, requiredRole: Role): boolean {
  if (userRole === requiredRole) return true;
  if (userRole === Role.SUPER_ADMIN) return true;
  return false;
}
