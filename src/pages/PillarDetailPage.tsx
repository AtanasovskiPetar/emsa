import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mountain, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import { type PublicPillarDetail } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

export function PillarDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: pillar, isLoading } = useQuery({
    queryKey: ["public-pillar", id],
    queryFn: () => apiClient.get<PublicPillarDetail>(ApiRoutes.PILLAR_BY_ID.replace(":id", id!)),
    enabled: !!id,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-8">
        <Link to={PageRoutes.HOME}>
          <ArrowLeft className="mr-1 size-4" />
          Back to Home
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      ) : !pillar ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Pillar not found.</p>
          <Button asChild className="mt-4">
            <Link to={PageRoutes.HOME}>Back to Home</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Header */}
          <div>
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mountain className="size-6" />
              </div>
              <h1 className="text-3xl font-bold">{pillar.name}</h1>
            </div>
            {pillar.directorName && (
              <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserRound className="size-4" />
                Director: <span className="font-medium text-foreground">{pillar.directorName}</span>
              </div>
            )}
            <p className="mt-4 text-muted-foreground">{pillar.description}</p>
          </div>

          <Separator />

          {/* Projects */}
          <div>
            <h2 className="mb-6 text-xl font-semibold">Projects</h2>
            {pillar.projects.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pillar.projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No projects for this pillar yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
