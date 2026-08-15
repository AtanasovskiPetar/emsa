import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";

import { SpotlightCard } from "@/components/SpotlightCard";
import { UserAvatar } from "@/components/UserAvatar";
import { PageRoutes } from "@/constants/routes";
import { type PublicPillar } from "@/constants/types";
import { revealTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PillarCardProps {
  pillar: PublicPillar;
  index: number;
  className?: string;
}

export function PillarCard({ pillar, index, className }: PillarCardProps) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={prefersReduced ? { duration: 0.2 } : revealTransition(index)}
      className={cn("h-full", className)}
    >
      <Link to={PageRoutes.PILLAR_DETAIL.replace(":id", pillar.id)} className="group block h-full">
        <SpotlightCard className="flex h-full flex-col p-0">
          {/* Image */}
          <div className="h-40 shrink-0 overflow-hidden">
            {pillar.imageUrl ? (
              <img
                src={pillar.imageUrl}
                alt={pillar.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-primary/10 to-chart-2/10" />
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 p-5">
            <h3 className="text-base font-semibold">{pillar.name}</h3>
            <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
              {pillar.description}
            </p>
            {pillar.directorName && (
              <div className="mt-2 flex items-center gap-2 border-t pt-3">
                <UserAvatar
                  name={pillar.directorName}
                  imageUrl={pillar.directorImageUrl}
                  className="size-6"
                />
                <span className="text-sm text-muted-foreground">{pillar.directorName}</span>
              </div>
            )}
          </div>
        </SpotlightCard>
      </Link>
    </motion.div>
  );
}
