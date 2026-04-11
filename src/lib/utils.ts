import { type ClassValue, clsx } from "clsx";
import { type NavigateFunction } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import { Role } from "@/constants/enums";
import { PageRoutes } from "@/constants/routes";
import { type ImageEntry, type PublicProject, type RegistrationStatus } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 0,
  [Role.ADMIN]: 1,
  [Role.SUPER_ADMIN]: 2,
};

export function hasAccess(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function navigateAfterLogin(
  user: { role: Role } | null | undefined,
  navigate: NavigateFunction
) {
  navigate(user && hasAccess(user.role, Role.ADMIN) ? PageRoutes.ADMIN : PageRoutes.HOME);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getImageSrc(img: ImageEntry): string | null {
  if (img.type === "existing") return img.url;
  if (img.type === "new") return img.previewUrl;
  return null;
}

export function getImageId(img: Exclude<ImageEntry, { type: "none" }>): string {
  return img.type === "existing" ? img.url : img.previewUrl;
}

export function toDatetimeLocalValue(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function uploadImageToS3(file: File, uploadRoute: string): Promise<string> {
  const { uploadUrl, fileUrl } = await apiClient.get<{
    uploadUrl: string;
    fileUrl: string;
    key: string;
  }>(`${uploadRoute}?contentType=${encodeURIComponent(file.type)}`);

  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  return fileUrl;
}

export function getRegistrationStatus(project: PublicProject): RegistrationStatus {
  if (!project.registrationOpensAt) return "none";
  const now = new Date();
  const opensAt = new Date(project.registrationOpensAt);
  if (opensAt > now) return "not_open";
  if (project.registrationClosesAt && new Date(project.registrationClosesAt) < now) return "closed";
  if (project.maxParticipants !== null && project.participantCount >= project.maxParticipants)
    return "full";
  return "open";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

export function toDateStr(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getPageNumbers(totalPages: number, currentPage: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  if (currentPage >= totalPages - 3)
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}
