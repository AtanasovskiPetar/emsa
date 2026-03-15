import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

import { PillarCard } from "@/components/PillarCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import { type OrganizationPublic, type PublicPillar, type PublicProject } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

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
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden py-12">
        {/* Background atmosphere */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 size-[700px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/15 blur-[120px]" />
          <div className="absolute bottom-0 left-0 size-[500px] translate-y-1/4 -translate-x-1/4 rounded-full bg-chart-2/15 blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[80px]" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: text */}
            <motion.div
              className="flex flex-col items-start"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            >
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                  <span className="size-2 animate-pulse rounded-full bg-primary" />
                  Student Medical Platform
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mt-6 text-5xl font-bold tracking-tight lg:text-6xl"
              >
                {org?.name ?? "Welcome"}
              </motion.h1>

              {org?.description && (
                <motion.p
                  variants={fadeUp}
                  className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground"
                >
                  {org.description}
                </motion.p>
              )}

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to={PageRoutes.PROJECTS}>
                    Explore Projects
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#about">Learn more</a>
                </Button>
              </motion.div>

              {projects?.length || pillars?.length ? (
                <motion.div variants={fadeUp} className="mt-12 flex gap-8 border-t pt-8">
                  {(projects?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-3xl font-bold">{projects!.length}+</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">Projects</div>
                    </div>
                  )}
                  {(pillars?.length ?? 0) > 0 && (
                    <div className="border-l pl-8">
                      <div className="text-3xl font-bold">{pillars!.length}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">Pillars</div>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </motion.div>

            {/* Right: logo visual */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Decorative rings */}
              <div className="absolute size-[380px] rounded-full border border-accent/50" />
              <div className="absolute size-[280px] rounded-full border border-chart-2/50" />
              <div className="absolute size-[180px] rounded-full border border-primary/50" />

              {/* Ambient glow */}
              <div className="absolute size-56 rounded-full bg-primary/8 blur-3xl" />

              {org?.logoUrl ? (
                <motion.img
                  src={org.logoUrl}
                  alt={org.name}
                  className="relative size-52 object-contain drop-shadow-2xl lg:size-64"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : (
                <motion.div
                  className="relative flex size-52 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2 text-6xl font-bold text-white shadow-2xl lg:size-64"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  {org?.name?.charAt(0) ?? "E"}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* About */}
      {org?.aboutUs && (
        <section id="about" className="border-t py-16">
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
