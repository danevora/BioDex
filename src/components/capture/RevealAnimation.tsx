"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import type { Animal } from "@/types/animal";

interface RevealAnimationProps {
  animal: Animal;
  imageUrl: string;
  onClose: () => void;
}

export function RevealAnimation({ animal, imageUrl, onClose }: RevealAnimationProps) {
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#22c55e", "#3b82f6", "#f59e0b"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#22c55e", "#3b82f6", "#f59e0b"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="flex flex-col items-center py-4">
      {/* Celebration text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <motion.h2
          className="text-2xl font-bold text-primary"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15,
            delay: 0.2,
          }}
        >
          Discovered!
        </motion.h2>
      </motion.div>

      {/* Card reveal */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotateY: 180 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
          delay: 0.3,
        }}
        className="relative w-full max-w-xs bg-card rounded-xl overflow-hidden shadow-xl border"
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Animal image */}
        <div className="relative aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={animal.commonName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Animal info */}
        <div className="p-4 text-center relative">
          <motion.h3
            className="text-xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {animal.commonName}
          </motion.h3>
          <motion.p
            className="text-sm text-muted-foreground italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {animal.scientificName}
          </motion.p>
        </div>
      </motion.div>

      {/* Action button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-6"
      >
        <Button onClick={onClose} size="lg">
          Add to BioDex
        </Button>
      </motion.div>
    </div>
  );
}

interface NoMatchResultProps {
  detectedAnimal: string | null;
  onTryAgain: () => void;
}

export function NoMatchResult({
  detectedAnimal,
  onTryAgain,
}: NoMatchResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-8 text-center"
    >
      <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <span className="text-4xl">?</span>
      </div>

      <h3 className="text-xl font-semibold mb-2">Not in BioDex</h3>

      {detectedAnimal ? (
        <p className="text-muted-foreground mb-6">
          We detected a <span className="font-medium">{detectedAnimal}</span>,
          but it&apos;s not in your BioDex catalog yet.
        </p>
      ) : (
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t identify an animal in this image. Try a clearer photo
          of a dog, cat, or frog.
        </p>
      )}

      <Button onClick={onTryAgain} variant="outline">
        Try Another Photo
      </Button>
    </motion.div>
  );
}
