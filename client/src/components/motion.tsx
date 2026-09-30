// Motion system: a small set of quick, consistent animations used across the
// app. Durations stay between 150 and 350ms and everything respects the OS
// "reduce motion" setting (via <MotionConfig reducedMotion="user"> in App).
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE_OUT } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: EASE_OUT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.28, ease: EASE_OUT } },
};

/** Wraps a page so route changes fade and lift in. Key it by route. */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Children marked with <StaggerItem> animate in one after another. */
export function Stagger({ children, className, delay = 0, gap = 0.05, as = "div", ...rest }: {
  children: ReactNode; className?: string; delay?: number; gap?: number; as?: "div" | "ul" | "section";
} & Omit<HTMLMotionProps<"div">, "children">) {
  const Comp: any = as === "ul" ? motion.ul : as === "section" ? motion.section : motion.div;
  return (
    <Comp
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className, variants = fadeUp, as = "div", ...rest }: {
  children: ReactNode; className?: string; variants?: Variants; as?: "div" | "li";
} & Omit<HTMLMotionProps<"div">, "children">) {
  const Comp: any = as === "li" ? motion.li : motion.div;
  return <Comp className={className} variants={variants} {...rest}>{children}</Comp>;
}

/** Reveals content once when it scrolls into view (marketing pages). */
export function Reveal({ children, className, delay = 0, y = 16 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Subtle press feedback for custom buttons and cards. */
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 500, damping: 30 },
} as const;
