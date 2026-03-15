import { motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { PageRoutes } from "@/constants/routes";
import { type PublicPillar } from "@/constants/types";
import { cn } from "@/lib/utils";

interface PillarCardProps {
  pillar: PublicPillar;
  index: number;
  className?: string;
}

export function PillarCard({ pillar, index, className }: PillarCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
      className={cn("h-full", className)}
    >
      <Link to={PageRoutes.PILLAR_DETAIL.replace(":id", pillar.id)} className="group block h-full">
        <div
          className="relative h-full overflow-hidden rounded-xl border bg-background p-6 transition-shadow duration-300 hover:shadow-lg"
          onMouseMove={handleMouseMove}
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
          <span className="pointer-events-none absolute right-4 top-2 select-none text-7xl font-bold text-primary/10 transition-colors duration-300 group-hover:text-primary/15">
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col gap-3">
            <h3 className="text-base font-semibold">{pillar.name}</h3>
            <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
              {pillar.description}
            </p>
            {pillar.directorName && (
              <p className="text-xs text-muted-foreground">
                Director: <span className="font-medium text-foreground">{pillar.directorName}</span>
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
