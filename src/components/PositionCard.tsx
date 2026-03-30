import { motion } from "motion/react";
import { useState } from "react";

import { UserAvatar } from "@/components/UserAvatar";
import { type PublicPosition } from "@/constants/types";

interface PositionCardProps {
  position: PublicPosition;
  index: number;
}

export function PositionCard({ position, index }: PositionCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut", delay: Math.min(index * 0.1, 0.4) }}
    >
      <div
        className="relative overflow-hidden rounded-xl border bg-background p-6 transition-shadow duration-300 hover:shadow-lg"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Spotlight overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(250px circle at ${mousePos.x}px ${mousePos.y}px, color-mix(in srgb, var(--primary) 10%, transparent), transparent 70%)`,
          }}
        />

        {/* Large faint index number */}
        <span className="pointer-events-none absolute right-4 top-2 select-none text-7xl font-bold text-primary/10">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="relative z-10 flex flex-col gap-3">
          <h3 className="text-base font-semibold">{position.title}</h3>
          <div className="flex items-center gap-2">
            <UserAvatar
              name={position.userName}
              imageUrl={position.userImageUrl}
              className="size-6"
            />
            <span className="text-sm text-muted-foreground">{position.userName}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
