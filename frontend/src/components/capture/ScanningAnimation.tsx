"use client";

import { motion } from "framer-motion";

export function ScanningAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative size-32">
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Middle rotating ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Inner pulsing circle */}
        <motion.div
          className="absolute inset-6 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="size-8 rounded-full bg-primary"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>

      <motion.p
        className="mt-6 text-lg font-medium text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Scanning...
      </motion.p>

      <p className="mt-2 text-sm text-muted-foreground/70">
        Identifying your creature
      </p>
    </div>
  );
}
