import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Layers } from "lucide-react";
import { useMemo, useState } from "react";

import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { type PublicPillar, type PublicProject } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function ProjectsPage() {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: queryKeys.publicProjects(),
    queryFn: () => apiClient.get<PublicProject[]>(ApiRoutes.PROJECTS),
  });

  const { data: pillars } = useQuery({
    queryKey: queryKeys.publicPillars(),
    queryFn: () => apiClient.get<PublicPillar[]>(ApiRoutes.PILLARS),
  });

  const { filtered, upcomingCount } = useMemo(() => {
    const now = new Date();
    const all = projects ?? [];
    return {
      filtered: all.filter((p) => {
        if (selectedPillar && p.pillarId !== selectedPillar) return false;
        if (onlyUpcoming && new Date(p.startingAt) < now) return false;
        return true;
      }),
      upcomingCount: all.filter((p) => new Date(p.startingAt) >= now).length,
    };
  }, [projects, selectedPillar, onlyUpcoming]);

  return (
    <div className="relative overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 size-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute left-0 top-1/3 size-[400px] -translate-x-1/4 rounded-full bg-chart-2/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 text-eyebrow text-primary uppercase">
            <span className="h-px w-6 bg-primary" />
            Projects
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-display text-foreground">Initiatives &amp; Events</h1>
            <span className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "project" : "projects"}
            </span>
          </div>
        </div>

        {/* Filters */}
        {(pillars && pillars.length > 0) || upcomingCount > 0 ? (
          <div className="-mx-4 mb-10 flex items-center gap-2 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {/* Upcoming toggle */}
            <button
              onClick={() => setOnlyUpcoming((v) => !v)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                onlyUpcoming
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              <CalendarClock className="size-3.5" />
              Upcoming
              {upcomingCount > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    onlyUpcoming ? "bg-white/20" : "bg-primary/10 text-primary"
                  )}
                >
                  {upcomingCount}
                </span>
              )}
            </button>

            {pillars && pillars.length > 0 && (
              <>
                <span className="h-4 w-px shrink-0 bg-border" />

                <Button
                  variant={selectedPillar === null ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSelectedPillar(null)}
                >
                  All pillars
                </Button>
                {pillars.map((pillar) => (
                  <Button
                    key={pillar.id}
                    variant={selectedPillar === pillar.id ? "default" : "outline"}
                    size="sm"
                    className="shrink-0"
                    onClick={() => setSelectedPillar(pillar.id)}
                  >
                    {pillar.name}
                  </Button>
                ))}
              </>
            )}
          </div>
        ) : null}

        {/* Grid */}
        {projectsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <Layers className="mx-auto mb-4 size-12 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No projects found.</p>
            {(selectedPillar || onlyUpcoming) && (
              <button
                className="mt-3 text-xs text-primary hover:underline"
                onClick={() => {
                  setSelectedPillar(null);
                  setOnlyUpcoming(false);
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
