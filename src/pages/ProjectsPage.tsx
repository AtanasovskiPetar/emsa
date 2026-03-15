import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { useState } from "react";

import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRoutes } from "@/constants/routes";
import { type PublicPillar, type PublicProject } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

export function ProjectsPage() {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["public-projects"],
    queryFn: () => apiClient.get<PublicProject[]>(ApiRoutes.PROJECTS),
  });

  const { data: pillars } = useQuery({
    queryKey: ["public-pillars"],
    queryFn: () => apiClient.get<PublicPillar[]>(ApiRoutes.PILLARS),
  });

  const filtered = selectedPillar
    ? (projects ?? []).filter((p) => p.pillarId === selectedPillar)
    : (projects ?? []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="mt-2 text-muted-foreground">Discover all our initiatives and events</p>
      </div>

      {pillars && pillars.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Button
            variant={selectedPillar === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPillar(null)}
          >
            All
          </Button>
          {pillars.map((pillar) => (
            <Button
              key={pillar.id}
              variant={selectedPillar === pillar.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPillar(pillar.id)}
            >
              {pillar.name}
            </Button>
          ))}
        </div>
      )}

      {projectsLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <Layers className="mx-auto mb-3 size-10 opacity-30" />
          <p className="text-sm">No projects found.</p>
        </div>
      )}
    </div>
  );
}
