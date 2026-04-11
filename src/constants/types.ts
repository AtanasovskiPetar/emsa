import type { Role } from "@/constants/enums";

export type ImageEntry =
  | { type: "none" }
  | { type: "existing"; url: string }
  | { type: "new"; file: File; previewUrl: string };

export interface UserActivation {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  index: string | null;
  yearOfStudies: number | null;
  profileCompleted: boolean;
  role: Role;
  isAlumni: boolean;
  isActive: boolean;
  activations: UserActivation[];
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
  index: string | null;
  yearOfStudies: number | null;
  profileCompleted: boolean;
  isAlumni: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  startingAt: string;
  pillarId: string | null;
  pillarName: string | null;
  images: string[];
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  maxParticipants: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRegistration {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userIndex: string | null;
  attended: boolean;
  createdAt: string;
}

export interface OrganizationPublic {
  name: string;
  logoUrl: string | null;
  description: string;
  aboutUs: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
}

export interface PublicProject {
  id: string;
  title: string;
  description: string;
  startingAt: string;
  pillarId: string | null;
  pillarName: string | null;
  images: string[];
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  maxParticipants: number | null;
  participantCount: number;
}

export interface MyRegistration {
  registered: boolean;
  id?: string;
  createdAt?: string;
}

export interface PublicPillar {
  id: string;
  name: string;
  description: string;
  directorName: string | null;
  directorImageUrl: string | null;
}

export interface PublicPillarDetail extends PublicPillar {
  projects: PublicProject[];
}

export interface Organization {
  id: number;
  name: string;
  logoUrl: string | null;
  description: string;
  aboutUs: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  updatedAt: string;
}

export interface DashboardStats {
  users: { total: number; active: number; inactive: number };
  projects: {
    total: number;
    upcoming: number;
    thisMonth: number;
    next: { title: string; startingAt: string } | null;
  };
  pillars: { total: number };
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

export interface PublicPosition {
  id: string;
  title: string;
  userName: string;
  userImageUrl: string | null;
  order: number;
}

export interface Position {
  id: string;
  title: string;
  userId: string;
  userName: string;
  userImageUrl: string | null;
  order: number;
  createdAt: string;
}

export type RegistrationStatus = "none" | "not_open" | "open" | "full" | "closed";
