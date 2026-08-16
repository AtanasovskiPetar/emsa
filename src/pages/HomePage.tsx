import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

import { PillarCard } from "@/components/PillarCard";
import { PinnedProjectSpotlight } from "@/components/PinnedProjectSpotlight";
import { PositionCard } from "@/components/PositionCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import {
  type OrganizationPublic,
  type PublicPillar,
  type PublicPosition,
  type PublicProject,
} from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

function getPreviewProjects(projects: PublicProject[]): PublicProject[] {
  const now = new Date().getTime();
  const upcoming = projects.filter((p) => new Date(p.startingAt).getTime() >= now);
  // Array is DESC so the soonest upcoming is the last element
  const soonest = upcoming.at(-1) ?? null;

  const rest = soonest ? projects.filter((p) => p.id !== soonest.id) : projects;
  const fillers = [...rest]
    .sort(
      (a, b) =>
        Math.abs(new Date(a.startingAt).getTime() - now) -
        Math.abs(new Date(b.startingAt).getTime() - now)
    )
    .slice(0, soonest ? 2 : 3);

  return soonest ? [soonest, ...fillers] : fillers;
}

export function HomePage() {
  const { data: org } = useQuery({
    queryKey: queryKeys.organization(),
    queryFn: () => apiClient.get<OrganizationPublic>(ApiRoutes.ORGANIZATION),
    staleTime: Infinity,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: queryKeys.publicProjects(),
    queryFn: () => apiClient.get<PublicProject[]>(ApiRoutes.PROJECTS),
  });

  const { data: pillars, isLoading: pillarsLoading } = useQuery({
    queryKey: queryKeys.publicPillars(),
    queryFn: () => apiClient.get<PublicPillar[]>(ApiRoutes.PILLARS),
  });

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: queryKeys.positions(),
    queryFn: () => apiClient.get<PublicPosition[]>(ApiRoutes.POSITIONS),
  });

  const pinnedProject = projects?.find((p) => p.isPinned) ?? null;
  const nonPinned = projects ? projects.filter((p) => !p.isPinned) : [];
  const previewProjects = getPreviewProjects(nonPinned);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-3.6rem)] items-center overflow-hidden py-12">
        {/* Background atmosphere */}
        <div className="pointer-events-none absolute inset-0 border-t border-b">
          <div className="absolute right-0 top-0 size-[700px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/15 blur-[120px]" />
          <div className="absolute bottom-0 left-0 size-[500px] translate-y-1/4 -translate-x-1/4 rounded-full bg-chart-2/15 blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-3/15 blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center">
          <motion.div
            className="flex flex-col items-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {org?.logoUrl && (
              <motion.div variants={staggerItem} className="relative mb-8">
                <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-primary/15 blur-2xl" />
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="size-24 object-contain drop-shadow-xl sm:size-28"
                />
              </motion.div>
            )}

            {org?.tagline && (
              <motion.div variants={staggerItem}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-eyebrow text-primary uppercase">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  {org.tagline}
                </span>
              </motion.div>
            )}

            <motion.h1
              variants={staggerItem}
              className="mt-7 text-hero text-balance text-foreground"
            >
              {org?.name ?? "Welcome"}
            </motion.h1>

            {org?.description && (
              <motion.p
                variants={staggerItem}
                className="mt-6 max-w-2xl text-balance text-body-lg text-muted-foreground"
              >
                {org.description}
              </motion.p>
            )}

            <motion.div
              variants={staggerItem}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <Button size="lg" asChild>
                <Link to={PageRoutes.PROJECTS}>
                  Explore Projects
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#pillars">Our Pillars</a>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <a href="#about">About Us</a>
              </Button>
            </motion.div>

            {projects?.length || pillars?.length ? (
              <motion.div variants={staggerItem} className="mt-16 flex items-center gap-10">
                {(projects?.length ?? 0) > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-bold tabular-nums">{projects!.length}+</div>
                    <div className="mt-1.5 text-eyebrow text-muted-foreground uppercase">
                      Projects
                    </div>
                  </div>
                )}
                {(pillars?.length ?? 0) > 0 && (
                  <>
                    {(projects?.length ?? 0) > 0 && <div className="h-10 w-px bg-border" />}
                    <div className="flex flex-col items-center">
                      <div className="text-4xl font-bold tabular-nums">{pillars!.length}</div>
                      <div className="mt-1.5 text-eyebrow text-muted-foreground uppercase">
                        Pillars
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* Pinned project spotlight */}
      {pinnedProject && <PinnedProjectSpotlight project={pinnedProject} />}

      {/* Projects preview */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 text-eyebrow text-primary uppercase">
                <span className="h-px w-6 bg-primary" />
                Projects
              </div>
              <h2 className="text-title text-foreground">
                Upcoming events &amp; recent initiatives
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0 self-start sm:self-auto">
              <Link to={PageRoutes.PROJECTS}>
                View all
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>

          {projectsLoading ? (
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Skeleton className="h-96 rounded-xl" />
              <div className="flex flex-col gap-6">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            </div>
          ) : previewProjects.length ? (
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              {previewProjects[0] && (
                <ProjectCard project={previewProjects[0]} index={0} featured />
              )}
              {previewProjects.length > 1 && (
                <div className="flex flex-col gap-6">
                  {previewProjects.slice(1).map((p, i) => (
                    <ProjectCard key={p.id} project={p} index={i + 1} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          )}
        </div>
      </section>

      {/* About */}
      {(org?.aboutUs || (positions && positions.length > 0)) && (
        <section id="about" className="relative overflow-hidden border-t bg-primary/5 py-20">
          {/* Decorative ring */}
          <div className="pointer-events-none absolute -right-32 -top-32 size-[500px] rounded-full border border-primary/10" />
          <div className="pointer-events-none absolute -right-20 -top-20 size-[300px] rounded-full border border-chart-2/10" />

          <div className="relative mx-auto max-w-6xl px-4">
            <div className="mb-12">
              <div className="mb-4 inline-flex items-center gap-2 text-eyebrow text-primary uppercase">
                <span className="h-px w-6 bg-primary" />
                About Us
              </div>
              <h2 className="text-title text-foreground">Who we are</h2>
            </div>

            {org?.aboutUs && (
              <div
                className="prose prose-neutral max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(org.aboutUs) }}
              />
            )}

            {(positionsLoading || (positions && positions.length > 0)) && (
              <div className={cn("flex flex-col gap-6", org?.aboutUs && "mt-12")}>
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 text-eyebrow text-primary uppercase">
                    <span className="h-px w-6 bg-primary" />
                    Board
                  </div>
                  <h3 className="text-heading text-foreground">
                    The people leading our organization
                  </h3>
                </div>

                {positionsLoading ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {positions!.map((p, i) => (
                      <PositionCard key={p.id} position={p} index={i} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Pillars */}
      <section id="pillars" className={cn("py-20", org?.aboutUs ? "bg-primary/5" : "border-t")}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12">
            <div className="mb-4 inline-flex items-center gap-2 text-eyebrow text-primary uppercase">
              <span className="h-px w-6 bg-primary" />
              Our Pillars
            </div>
            <h2 className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-3xl font-bold text-transparent">
              The focus areas that drive our work
            </h2>
          </div>

          {pillarsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : pillars?.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map((p, i) => (
                <PillarCard key={p.id} pillar={p} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pillars yet.</p>
          )}
        </div>
      </section>

      {/* Contact */}
      {(org?.location || org?.email || org?.phone) && (
        <section id="contact" className="border-t py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12">
              <div className="mb-4 inline-flex items-center gap-2 text-eyebrow text-primary uppercase">
                <span className="h-px w-6 bg-primary" />
                Contact
              </div>
              <h2 className="text-title text-foreground">Get in touch</h2>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              {/* Contact details */}
              <div className="flex flex-col gap-6">
                {org.email && (
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <a
                        href={`mailto:${org.email}`}
                        className="mt-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {org.email}
                      </a>
                    </div>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <a
                        href={`tel:${org.phone}`}
                        className="mt-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {org.phone}
                      </a>
                    </div>
                  </div>
                )}
                {org.location && (
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{org.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Embedded map */}
              {org.location && (
                <div className="h-72 overflow-hidden rounded-xl border lg:h-full">
                  <iframe
                    title="Location map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(org.location)}&output=embed`}
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
