import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import { type OrganizationPublic } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { data: org } = useQuery({
    queryKey: queryKeys.organization(),
    queryFn: () => apiClient.get<OrganizationPublic>(ApiRoutes.ORGANIZATION),
    staleTime: Infinity,
  });

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 size-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 size-[500px] translate-y-1/4 -translate-x-1/4 rounded-full bg-chart-2/10 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[80px]" />
      </div>

      {/* Back to home link */}
      <Link
        to={PageRoutes.HOME}
        className="relative mb-8 flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {org?.logoUrl ? (
          <img src={org.logoUrl} alt="Logo" className="size-6 rounded object-cover" />
        ) : (
          <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {org?.name?.charAt(0) ?? "?"}
          </div>
        )}
        <span className="font-medium">{org?.name ?? "Home"}</span>
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
