import { motion } from "motion/react";
import type React from "react";

import { spring } from "@/lib/motion";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Bold, consistent page header for the admin panel — an uppercase eyebrow, a
 * large title, an optional description, and a slot for actions. Springs in on
 * mount; movement degrades to a cross-fade under reduced motion (global
 * MotionConfig).
 */
export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.smooth}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-3 inline-flex items-center gap-2 text-eyebrow text-primary uppercase">
            <span className="h-px w-6 bg-primary" />
            {eyebrow}
          </div>
        )}
        <h1 className="text-title text-foreground">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </motion.div>
  );
}
