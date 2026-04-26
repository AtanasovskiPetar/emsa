import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { PageRoutes } from "@/constants/routes";
import { type Newspaper } from "@/constants/types";

interface LatestNewspaperSectionProps {
  newspaper: Newspaper;
}

export function LatestNewspaperSection({ newspaper }: LatestNewspaperSectionProps) {
  return (
    <section className="border-t py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <span className="h-px w-6 bg-primary" />
              Newspapers
            </div>
            <h2 className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-3xl font-bold text-transparent">
              Latest Publication
            </h2>
            <p className="mt-1 font-medium">{newspaper.title}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(newspaper.releaseDate).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link to={PageRoutes.NEWSPAPERS}>
              View all
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="overflow-hidden rounded-xl border shadow-sm"
        >
          <iframe
            src={newspaper.pdfUrl}
            className="w-full"
            style={{ height: 600 }}
            title={newspaper.title}
          />
        </motion.div>
      </div>
    </section>
  );
}
