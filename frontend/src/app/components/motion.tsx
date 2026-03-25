"use client";

import { motion, type Variants } from "framer-motion";

/* ── Variant presets ─────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const fadeDown: Variants = {
  hidden: { opacity: 0, y: -32 },
  visible: { opacity: 1, y: 0 },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

type Direction = "up" | "down" | "left" | "right" | "scale";

const variantMap: Record<Direction, Variants> = {
  up: fadeUp,
  down: fadeDown,
  left: fadeLeft,
  right: fadeRight,
  scale: scaleUp,
};

/* ── Components ──────────────────────────────────────────────── */

/**
 * Standalone fade-in triggered by viewport.
 * Use this for individual elements NOT inside a StaggerContainer.
 */
export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}) {
  return (
    <motion.div
      variants={variantMap[direction]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parent container that staggers its children's animations.
 * Only direct children using variants (StaggerItem) are staggered.
 */
export function StaggerContainer({
  children,
  className,
  stagger = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ staggerChildren: stagger }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * A child of StaggerContainer. Inherits hidden/visible from parent
 * and is delayed by the parent's staggerChildren timing.
 * Accepts a direction to control animation style.
 */
export function StaggerItem({
  children,
  className,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
}) {
  return (
    <motion.div
      variants={variantMap[direction]}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function CTAButton({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <motion.a
      href={href}
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.a>
  );
}

export function AnimatedStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <motion.div
      className="text-center px-4"
      variants={fadeUp}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="font-display text-4xl font-bold text-brand-orange">{value}</div>
      <div className="text-[10px] font-bold tracking-widest text-gray-400 mt-2 uppercase">{label}</div>
    </motion.div>
  );
}

export { motion };