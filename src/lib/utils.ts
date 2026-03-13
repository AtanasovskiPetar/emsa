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

export function getPageNumbers(totalPages: number, currentPage: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  if (currentPage >= totalPages - 3)
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}
