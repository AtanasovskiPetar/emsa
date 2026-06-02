export const queryKeys = {
  organization: () => ["organization"] as const,
  me: () => ["me"] as const,
  positions: () => ["positions"] as const,
  publicProjects: () => ["public-projects"] as const,
  publicPillars: () => ["public-pillars"] as const,
  publicProject: (id: string) => ["public-project", id] as const,
  publicPillar: (id: string) => ["public-pillar", id] as const,
  gallery: () => ["gallery"] as const,
  universities: () => ["universities"] as const,
  myRegistration: (projectId: string) => ["my-registration", projectId] as const,
  admin: {
    users: () => ["admin", "users"] as const,
    projects: () => ["admin", "projects"] as const,
    pillars: () => ["admin", "pillars"] as const,
    organization: () => ["admin", "organization"] as const,
    dashboard: () => ["admin", "dashboard"] as const,
    projectRegistrations: (projectId: string) =>
      ["admin", "projects", projectId, "registrations"] as const,
    projectPackages: (projectId: string) => ["admin", "projects", projectId, "packages"] as const,
    projectCapacityPools: (projectId: string) =>
      ["admin", "projects", projectId, "capacity-pools"] as const,
  },
};
