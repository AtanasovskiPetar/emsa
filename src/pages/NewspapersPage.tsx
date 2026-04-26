import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { type Newspaper } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

interface NewspaperLightboxProps {
  newspaper: Newspaper;
  onClose: () => void;
}

function NewspaperLightbox({ newspaper, onClose }: NewspaperLightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="font-medium text-white">{newspaper.title}</p>
          <p className="text-sm text-white/60">
            {new Date(newspaper.releaseDate).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          aria-label="Close"
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          onClick={onClose}
        >
          <X className="size-5" />
        </button>
      </div>
      <iframe src={newspaper.pdfUrl} className="h-full w-full" title={newspaper.title} />
    </motion.div>
  );
}

interface NewspaperCardProps {
  newspaper: Newspaper;
  index: number;
  onClick: () => void;
}

function NewspaperCard({ newspaper, index, onClick }: NewspaperCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 24, rotateZ: -3 }}
      animate={{ opacity: 1, y: 0, rotateZ: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ y: -6, rotateZ: 0.5, transition: { duration: 0.2 } }}
      style={{ transformOrigin: "bottom center" }}
      className="group w-full overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted">
        <span className="text-5xl">📰</span>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 font-semibold leading-tight transition-colors group-hover:text-primary">
          {newspaper.title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(newspaper.releaseDate).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </motion.button>
  );
}

export function NewspapersPage() {
  const [selected, setSelected] = useState<Newspaper | null>(null);

  const { data: newspapers = [], isLoading } = useQuery({
    queryKey: queryKeys.newspapers(),
    queryFn: () => apiClient.get<Newspaper[]>(ApiRoutes.NEWSPAPERS),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-12">
        <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
          <span className="h-px w-6 bg-primary" />
          Newspapers
        </div>
        <h1 className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-3xl font-bold text-transparent">
          Our Publications
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse all our published newspapers and newsletters.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border">
              <Skeleton className="aspect-[3/4] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : newspapers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="mb-4 text-6xl">📰</span>
          <p className="text-lg font-medium">No newspapers yet</p>
          <p className="text-sm text-muted-foreground">Check back soon for our publications.</p>
        </div>
      ) : (
        <div
          className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          style={{ perspective: "1200px" }}
        >
          {newspapers.map((newspaper, i) => (
            <NewspaperCard
              key={newspaper.id}
              newspaper={newspaper}
              index={i}
              onClick={() => setSelected(newspaper)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && <NewspaperLightbox newspaper={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
