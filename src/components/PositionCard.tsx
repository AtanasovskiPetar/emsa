import { motion } from "motion/react";

import { SpotlightCard } from "@/components/SpotlightCard";
import { UserAvatar } from "@/components/UserAvatar";
import { type PublicPosition } from "@/constants/types";

interface PositionCardProps {
  position: PublicPosition;
  index: number;
}

export function PositionCard({ position, index }: PositionCardProps) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut", delay: Math.min(index * 0.1, 0.4) }}
    >
      <SpotlightCard className="h-full p-6">
        <div className="pointer-events-none absolute right-4 top-4">
          <UserAvatar
            name={position.userName}
            imageUrl={position.userImageUrl}
            className="size-16 rounded-full"
          />
        </div>

        <div className="relative z-10 flex flex-col gap-3 pr-20">
          <h3 className="text-base font-semibold">{position.title}</h3>
          <span className="text-sm text-muted-foreground">{position.userName}</span>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
