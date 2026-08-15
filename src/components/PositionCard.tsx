import { motion } from "motion/react";

import { SpotlightCard } from "@/components/SpotlightCard";
import { UserAvatar } from "@/components/UserAvatar";
import { type PublicPosition } from "@/constants/types";
import { revealTransition } from "@/lib/motion";

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
      viewport={{ once: true, margin: "-60px" }}
      transition={revealTransition(index)}
    >
      <SpotlightCard className="h-full p-6">
        <div className="flex h-full flex-col items-center gap-4 text-center">
          <UserAvatar
            name={position.userName}
            imageUrl={position.userImageUrl}
            className="size-20 rounded-full"
          />
          <div className="flex flex-col gap-1">
            <span className="font-semibold leading-tight">{position.userName}</span>
            <span className="text-sm text-muted-foreground">{position.title}</span>
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
