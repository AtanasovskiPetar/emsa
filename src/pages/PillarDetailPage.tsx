import { useQuery } from "@tanstack/react-query";
import { Mountain } from "lucide-react";
import { motion } from "motion/react";
import { Link, useParams } from "react-router-dom";

import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
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
    <div className="flex flex-col">
      {/* Hero banner */}
      <div className="relative overflow-hidden border-b bg-primary/5 py-16">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[500px] rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -right-20 -top-20 size-[300px] rounded-full border border-chart-2/10" />
        <div className="pointer-events-none absolute bottom-0 left-0 size-[400px] translate-y-1/2 -translate-x-1/4 rounded-full bg-chart-2/8 blur-[80px]" />

        <div className="relative mx-auto max-w-6xl px-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-16 w-3/4" />
            </div>
          ) : pillar ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                <span className="h-px w-6 bg-primary" />
                Pillar
              </div>

              <div className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-4xl font-bold text-transparent">
                {pillar.name}
              </div>

              {pillar.directorName && (
                <div className="mt-4 flex items-center gap-2.5 text-sm text-muted-foreground">
                  <UserAvatar
                    name={pillar.directorName}
                    imageUrl={pillar.directorImageUrl}
                    className="size-7 rounded-full"
                  />
                  Director:{" "}
                  <span className="font-medium text-foreground">{pillar.directorName}</span>
                </div>
              )}

              {pillar.description && (
                <p className="mt-5 max-w-2xl text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              )}
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Projects */}
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : !pillar ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">Pillar not found.</p>
            <Button asChild className="mt-4">
              <Link to={PageRoutes.HOME}>Back to Home</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
                <span className="h-px w-6 bg-primary" />
                Projects
              </div>
              <div className="flex items-end justify-between gap-4">
                <h2 className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-2xl font-bold text-transparent">
                  Initiatives under this pillar
                </h2>
                {pillar.projects.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {pillar.projects.length} {pillar.projects.length === 1 ? "project" : "projects"}
                  </span>
                )}
              </div>
            </div>

            {pillar.projects.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pillar.projects.map((p, i) => (
                  <ProjectCard key={p.id} project={p} index={i} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Mountain className="mx-auto mb-4 size-12 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No projects for this pillar yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
