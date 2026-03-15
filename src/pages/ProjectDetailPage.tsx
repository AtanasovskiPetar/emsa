import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Images,
  Layers,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import { type PublicProject } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function Lightbox({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setCurrent((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>

      {/* Image */}
      <motion.img
        key={current}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        src={images[current]}
        alt={`Image ${current + 1}`}
        className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((i) => (i - 1 + images.length) % images.length);
            }}
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((i) => (i + 1) % images.length);
            }}
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
        {current + 1} / {images.length}
      </div>
    </motion.div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ["public-project", id],
    queryFn: () => apiClient.get<PublicProject>(ApiRoutes.PROJECT_BY_ID.replace(":id", id!)),
    enabled: !!id,
  });

  const isUpcoming = project ? new Date(project.startingAt) >= new Date() : false;
  const date = project
    ? new Date(project.startingAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const cover = project?.images[0];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="relative h-[55vh] min-h-72 overflow-hidden bg-muted">
        {isLoading ? (
          <Skeleton className="size-full rounded-none" />
        ) : cover ? (
          <img
            src={cover}
            alt={project!.title}
            className="size-full cursor-pointer object-cover transition-transform duration-500 hover:scale-105"
            onClick={() => setLightboxIndex(0)}
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/20 via-background to-chart-2/20">
            <div className="flex size-full items-center justify-center">
              <Layers className="size-20 text-muted-foreground/20" />
            </div>
          </div>
        )}

        {/* Scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        {/* Back button */}
        <div className="absolute left-4 top-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
          >
            <Link to={PageRoutes.PROJECTS}>
              <ArrowLeft className="mr-1 size-4" />
              All Projects
            </Link>
          </Button>
        </div>

        {/* Overlay metadata */}
        {!isLoading && project && (
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                {isUpcoming && (
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                    Upcoming
                  </Badge>
                )}
                {project.pillarName && (
                  <Badge className="border-0 bg-white/20 text-white hover:bg-white/30">
                    {project.pillarName}
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white drop-shadow md:text-4xl">
                {project.title}
              </h1>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
                <CalendarDays className="size-4" />
                {date}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className={cn("h-4", i === 0 ? "w-3/4" : "w-full")} />
            ))}
          </div>
        ) : !project ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">Project not found.</p>
            <Button asChild className="mt-4">
              <Link to={PageRoutes.PROJECTS}>Back to Projects</Link>
            </Button>
          </div>
        ) : (
          <>
            {project.description && (
              <div
                className="prose prose-neutral max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            )}
          </>
        )}
      </div>

      {/* Parallax gallery */}
      {project && project.images.length > 1 && (
        <div className="border-t px-4 pb-16 pt-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h2 className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-2xl font-bold text-transparent">
                  Photos
                </h2>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Images className="size-4" />
                  {project.images.length} images
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {project.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Image ${i + 1}`}
                  className="aspect-video w-full cursor-pointer rounded-xl object-cover transition-opacity hover:opacity-90"
                  onClick={() => setLightboxIndex(i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && project && (
          <Lightbox
            images={project.images}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
