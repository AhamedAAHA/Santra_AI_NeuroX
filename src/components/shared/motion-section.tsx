"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function MotionSection({
  children,
  className,
  delay = 0,
  ...props
}: PropsWithChildren<HTMLMotionProps<"section"> & { delay?: number }>) {
  return (
    <motion.section
      className={cn(className)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    >
      {children}
    </motion.section>
  );
}
