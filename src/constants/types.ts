import type { Role } from "@/constants/enums";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  activeMember: boolean;
  imageUrl: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  imageUrl: string | null;
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
