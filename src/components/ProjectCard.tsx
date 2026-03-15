import { CalendarDays, Layers } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { PageRoutes } from "@/constants/routes";
import { type PublicProject } from "@/constants/types";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: PublicProject;
  index: number;
  featured?: boolean;
  className?: string;
}

export function ProjectCard({ project, index, featured = false, className }: ProjectCardProps) {
  const cover = project.images[0];
  const isUpcoming = new Date(project.startingAt) >= new Date();
  const date = new Date(project.startingAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
      className={cn("h-full", !isUpcoming && !featured && "opacity-85 hover:opacity-100 transition-opacity", className)}
    >
      <Link
        to={PageRoutes.PROJECT_DETAIL.replace(":id", project.id)}
        className="group block h-full"
      >
        {featured ? (
          /* Featured: image-overlay layout */
          <div
            className={cn(
              "relative h-full min-h-72 overflow-hidden rounded-xl border transition-all duration-300",
              isUpcoming
                ? "border-primary/40 shadow-[0_0_32px_color-mix(in_srgb,var(--primary)_15%,transparent)]"
                : "border-border"
            )}
          >
            {cover ? (
              <img
                src={cover}
                alt={project.title}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted">
                <Layers className="size-16 opacity-20" />
              </div>
            )}

            {/* Gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            {/* Overlay content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-wrap items-center gap-2">
                {isUpcoming && (
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                    Upcoming
                  </Badge>
                )}
                {project.pillarName && (
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                    {project.pillarName}
                  </Badge>
                )}
              </div>
              <h3 className="mt-2 text-xl font-bold text-white drop-shadow line-clamp-2">
                {project.title}
              </h3>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
                <CalendarDays className="size-3.5" />
                {date}
              </div>
            </div>
          </div>
        ) : (
          /* Regular card */
          <div
            className={cn(
              "relative h-full overflow-hidden rounded-xl border bg-background transition-all duration-300 hover:shadow-md",
              isUpcoming
                ? "border-primary/40 shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
                : "border-border"
            )}
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              {cover ? (
                <img
                  src={cover}
                  alt={project.title}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Layers className="size-10 opacity-30" />
                </div>
              )}
              {isUpcoming && (
                <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground hover:bg-primary">
                  Upcoming
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-2 p-4">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{project.title}</h3>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {date}
                </div>
                {project.pillarName && (
                  <Badge variant="secondary" className="text-xs">
                    {project.pillarName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
