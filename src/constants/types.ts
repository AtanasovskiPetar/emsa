import type { Role } from "@/constants/enums";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  activeMember: boolean;
  createdAt: string;
}

export interface Pillar {
  id: string;
  name: string;
  description: string;
  directorId: string;
  directorName: string | null;
  createdAt: string;
  updatedAt: string;
}
