import { useQuery } from "@tanstack/react-query";
import { Images } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Lightbox } from "@/components/Lightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import type { GalleryImage } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const SKELETON_ASPECTS = [
  "aspect-[3/4]",
  "aspect-video",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-square",
  "aspect-video",
  "aspect-[3/4]",
  "aspect-square",
];

export function GalleryPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: queryKeys.gallery(),
    queryFn: () => apiClient.get<GalleryImage[]>(ApiRoutes.GALLERY),
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b bg-muted/30 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Gallery
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              A collection of moments from our projects and events.
            </p>
            {!isLoading && images.length > 0 && (
              <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Images className="size-4" />
                <span>{images.length} photos</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        {isLoading ? (
          <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
            {SKELETON_ASPECTS.map((aspect, i) => (
              <div key={i} className={cn("mb-3 break-inside-avoid", aspect)}>
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Images className="mb-4 size-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No images uploaded yet.</p>
          </div>
        ) : (
          <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
            {images.map((img, i) => (
              <motion.div
                key={img.url + i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
                className="group relative mb-3 cursor-pointer break-inside-avoid overflow-hidden rounded-xl"
                onClick={() => setLightboxIndex(i)}
              >
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="line-clamp-2 text-xs font-medium text-white drop-shadow">
                    {img.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={images.map((i) => i.url)}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
