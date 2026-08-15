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
  /** Snappy, no overshoot — buttons, menus, popovers, most UI. */
  snappy: { type: "spring", bounce: 0, duration: 0.35 },
  /** Smooth, no overshoot — larger surfaces, page/section transitions. */
  smooth: { type: "spring", bounce: 0, duration: 0.5 },
  /** Slight overshoot — only for gesture/momentum-driven motion. */
  gentle: { type: "spring", bounce: 0.18, duration: 0.5 },
  /** The navbar's proven feel (stiffness/damping form). */
  nav: { type: "spring", stiffness: 200, damping: 50 },
} satisfies Record<string, Transition>;

/** Apple-style ease-out for simple, non-interruptible tweens (opacity fades). */
export const easeFluid = [0.32, 0.72, 0, 1] as const;

/** Plain cross-fade — the reduced-motion fallback for any of the variants below. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: spring.snappy },
  exit: { opacity: 0, transition: { duration: 0.15, ease: easeFluid } },
};

/** Fade + rise — default entrance for content blocks and cards. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: spring.smooth },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15, ease: easeFluid } },
};

/** Scale + fade from a trigger — popovers/menus (caller sets transform-origin). */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.12, ease: easeFluid } },
};

/** Container that reveals children in sequence. Pair with `staggerItem`. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: spring.smooth },
};

/**
 * Scroll-reveal transition for a grid/list item. Springs in with a small,
 * capped per-index delay so a row arrives as a quick cascade, not a slow queue.
 * Pair with `initial`/`whileInView` and gate movement on reduced motion.
 */
export const revealTransition = (index = 0): Transition => ({
  ...spring.smooth,
  delay: Math.min(index * 0.08, 0.32),
});
