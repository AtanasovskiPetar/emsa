import type { Transition, Variants } from "motion/react";

/**
 * Shared motion language for the app. Springs are the default because they are
 * interruptible and velocity-aware; use them for anything a user can touch
 * (sheets, dialogs, menus, drags). Reserve overshoot (`bounce`) for motion that
 * follows a real gesture — a flick or a drag release — never for a plain enter.
 *
 * Motion's `bounce` + `duration` map closely to Apple's damping + response:
 *   bounce 0    ≈ critically damped (no overshoot)  — the house default
 *   bounce 0.2  ≈ slight overshoot                  — momentum interactions
 */
export const spring = {
  snappy: { type: "spring", bounce: 0, duration: 0.35 },
  smooth: { type: "spring", bounce: 0, duration: 0.5 },
  gentle: { type: "spring", bounce: 0.18, duration: 0.5 },
  nav: { type: "spring", stiffness: 200, damping: 50 },
} satisfies Record<string, Transition>;

export const easeFluid = [0.32, 0.72, 0, 1] as const;

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: spring.snappy },
  exit: { opacity: 0, transition: { duration: 0.15, ease: easeFluid } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: spring.smooth },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15, ease: easeFluid } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.12, ease: easeFluid } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: spring.smooth },
};

// Capped per-index delay so a row arrives as a quick cascade, not a slow queue.
export const revealTransition = (index = 0): Transition => ({
  ...spring.smooth,
  delay: Math.min(index * 0.08, 0.32),
});
