"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface MotionWrapperProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    y?: number;
}

export default function MotionWrapper({
    children,
    className = "",
    delay = 0,
    duration = 0.6,
    y = 30,
}: MotionWrapperProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
            transition={{ duration, delay, ease: "easeOut" }}
            // CSS fallback: if framer-motion never resolves, element becomes
            // visible after (delay + 1.5s) via this animation
            style={{
                // After 1.5s + delay, force opacity 1 if framer-motion doesn't take over
                animationName: isInView ? "none" : "motionFallback",
                animationDuration: "0.01s",
                animationDelay: `${delay + 1.5}s`,
                animationFillMode: "forwards",
            } as React.CSSProperties}
        >
            {children}
        </motion.div>
    );
}
