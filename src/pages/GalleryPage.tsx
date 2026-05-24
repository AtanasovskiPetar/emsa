import { useInfiniteQuery } from "@tanstack/react-query";
import { Images, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Lightbox } from "@/components/Lightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import type { GalleryImage, GalleryResponse } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 30;

function GalleryItem({ img, onClick }: { img: GalleryImage; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl bg-muted"
      onClick={onClick}
    >
      <img
        src={img.url}
        alt={img.label}
        onLoad={() => setLoaded(true)}
        className={cn(
          "absolute inset-0 size-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-105",
          loaded ? "opacity-100" : "opacity-0"
        )}
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="line-clamp-2 text-xs font-medium text-white drop-shadow">{img.label}</span>
      </div>
    </div>
  );
}

export function GalleryPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: queryKeys.gallery(),
    queryFn: ({ pageParam }) =>
      apiClient.get<GalleryResponse>(`${ApiRoutes.GALLERY}?offset=${pageParam}&limit=${PAGE_SIZE}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage.hasMore) return undefined;
      return lastPageParam + lastPage.images.length;
    },
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const images = data?.pages.flatMap((p) => p.images) ?? [];
  const total = data?.pages[0]?.total ?? 0;

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
            {!isLoading && total > 0 && (
              <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Images className="size-4" />
                <span>{total} photos</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Images className="mb-4 size-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No images uploaded yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img, i) => (
                <GalleryItem key={img.url} img={img} onClick={() => setLightboxIndex(i)} />
              ))}
            </div>

            <div ref={sentinelRef} className="mt-4 flex justify-center py-4">
              {isFetchingNextPage && (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              )}
            </div>
          </>
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
