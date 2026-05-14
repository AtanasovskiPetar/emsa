import { motion } from "motion/react";
import { Link } from "react-router-dom";

import { SpotlightCard } from "@/components/SpotlightCard";
import { UserAvatar } from "@/components/UserAvatar";
import { PageRoutes } from "@/constants/routes";
import { type PublicPillar } from "@/constants/types";
import { cn } from "@/lib/utils";

interface PillarCardProps {
  pillar: PublicPillar;
  index: number;
  className?: string;
}

export function PillarCard({ pillar, index, className }: PillarCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut", delay: Math.min(index * 0.1, 0.4) }}
      className={cn("h-full", className)}
    >
      <Link to={PageRoutes.PILLAR_DETAIL.replace(":id", pillar.id)} className="group block h-full">
        <SpotlightCard className="h-full p-6">
          {pillar.imageUrl ? (
            <div className="pointer-events-none absolute right-4 top-4">
              <img src={pillar.imageUrl} alt="" className="size-16 rounded-lg object-cover" />
            </div>
          ) : (
            <span className="pointer-events-none absolute right-4 top-2 select-none text-7xl font-bold text-primary/10 transition-colors duration-300 group-hover:text-primary/15">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}

          {/* Content */}
          <div
            className={cn("relative z-10 flex h-full flex-col gap-3", pillar.imageUrl && "pr-20")}
          >
            <h3 className="text-base font-semibold">{pillar.name}</h3>
            <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
              {pillar.description}
            </p>
            {pillar.directorName && (
              <div className="flex items-center gap-2">
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
