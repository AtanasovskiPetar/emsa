import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import { type PublicProject } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted">
        <Layers className="size-16 opacity-20" />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <img src={images[0]} alt={title} className="aspect-video w-full rounded-xl object-cover" />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="aspect-video bg-muted">
        <img
          src={images[current]}
          alt={`${title} — image ${current + 1}`}
          className="size-full object-cover"
        />
      </div>

      <button
        onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow backdrop-blur hover:bg-background"
        aria-label="Previous image"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % images.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow backdrop-blur hover:bg-background"
        aria-label="Next image"
      >
        <ChevronRight className="size-5" />
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to image ${i + 1}`}
            className={cn(
              "size-2 rounded-full transition-colors",
              i === current ? "bg-white" : "bg-white/50 hover:bg-white/75"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ["public-project", id],
    queryFn: () => apiClient.get<PublicProject>(ApiRoutes.PROJECT_BY_ID.replace(":id", id!)),
    enabled: !!id,
  });

  const date = project
    ? new Date(project.startingAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link to={PageRoutes.PROJECTS}>
          <ArrowLeft className="mr-1 size-4" />
          All Projects
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ) : !project ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Project not found.</p>
          <Button asChild className="mt-4">
            <Link to={PageRoutes.PROJECTS}>Back to Projects</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <ImageCarousel images={project.images} title={project.title} />

          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              {project.pillarName && <Badge variant="secondary">{project.pillarName}</Badge>}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              {date}
            </div>
          </div>

          {project.description && (
            <div
              className="prose prose-neutral max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: project.description }}
            />
          )}
        </div>
      )}
    </div>
  );
}
