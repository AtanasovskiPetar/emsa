import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { PillarCard } from "@/components/PillarCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import { type OrganizationPublic, type PublicPillar, type PublicProject } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

function getPreviewProjects(projects: PublicProject[]): PublicProject[] {
  const now = new Date();
  const upcoming = projects.filter((p) => new Date(p.startingAt) >= now);
  const past = projects.filter((p) => new Date(p.startingAt) < now);
  return [
    ...upcoming.slice(0, 3),
    ...[...past].reverse().slice(0, Math.max(0, 3 - upcoming.length)),
  ];
}

export function HomePage() {
  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: () => apiClient.get<OrganizationPublic>(ApiRoutes.ORGANIZATION),
    staleTime: Infinity,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["public-projects"],
    queryFn: () => apiClient.get<PublicProject[]>(ApiRoutes.PROJECTS),
  });

  const { data: pillars, isLoading: pillarsLoading } = useQuery({
    queryKey: ["public-pillars"],
    queryFn: () => apiClient.get<PublicPillar[]>(ApiRoutes.PILLARS),
  });

  const previewProjects = projects ? getPreviewProjects(projects) : [];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            {org?.logoUrl && (
              <img
                src={org.logoUrl}
                alt="Logo"
                className="mx-auto mb-6 size-20 rounded-xl object-cover shadow-md"
              />
            )}
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {org?.name ?? "Welcome"}
            </h1>
            {org?.aboutUs && (
              <p className="mt-4 text-lg text-muted-foreground">
                {org.aboutUs.replace(/<[^>]*>/g, "").slice(0, 200)}
                {org.aboutUs.replace(/<[^>]*>/g, "").length > 200 ? "…" : ""}
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to={PageRoutes.PROJECTS}>
                  Explore Projects
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      {org?.aboutUs && (
        <section className="border-t py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-2xl font-semibold">About Us</h2>
            <div
              className="prose prose-neutral max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: org.aboutUs }}
            />
          </div>
        </section>
      )}

      {/* Projects preview */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Projects</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upcoming events and recent initiatives
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={PageRoutes.PROJECTS}>
                View all
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>

          {projectsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : previewProjects.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {previewProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          )}
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold">Our Pillars</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The focus areas that drive our work
            </p>
          </div>

          {pillarsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : pillars?.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map((p) => (
                <PillarCard key={p.id} pillar={p} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pillars yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
