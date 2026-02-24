import { motion, type Variants } from "framer-motion";
import React from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  duration?: number;
}

const variants: Record<string, Variants> = {
  up: {
    hidden: { opacity: 0, y: 40 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  },
  left: {
    hidden: { opacity: 0, x: -40 },
    visible: (delay: number) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  },
  right: {
    hidden: { opacity: 0, x: 40 },
    visible: (delay: number) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  },
  none: {
    hidden: { opacity: 0 },
    visible: (delay: number) => ({
      opacity: 1,
      transition: { duration: 0.5, delay },
    }),
  },
};

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  delay = 0,
  direction = "up",
}) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
    custom={delay}
    variants={variants[direction]}
  >
    {children}
  </motion.div>
);

export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}> = ({ children, className, stagger = 0.1 }) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: stagger } },
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
      },
    }}
  >
    {children}
  </motion.div>
);
