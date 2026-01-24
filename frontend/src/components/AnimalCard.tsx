"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Animal } from "@/types/animal";
import { Lock, Check } from "lucide-react";

interface AnimalCardProps {
  animal: Animal;
  isCaptured?: boolean;
  userImage?: string;
  isLocked?: boolean;
  onClick?: () => void;
}

export function AnimalCard({
  animal,
  isCaptured = false,
  userImage,
  isLocked = false,
  onClick,
}: AnimalCardProps) {
  const displayImage = isCaptured && userImage ? userImage : animal.defaultImage;
  const showGrayscale = !isCaptured && !isLocked;

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-transform hover:scale-105 relative"
      onClick={onClick}
    >
      <div className="relative aspect-square">
        {isLocked ? (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
        ) : (
          <Image
            src={displayImage}
            alt={animal.commonName}
            fill
            className={`object-cover ${showGrayscale ? "grayscale opacity-50" : ""}`}
            unoptimized={displayImage.includes("supabase.co")}
          />
        )}
        {isCaptured && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">
          {isLocked ? "???" : animal.commonName}
        </h3>
        <p className="text-xs text-muted-foreground italic truncate">
          {isLocked ? "Sign in to discover" : animal.scientificName}
        </p>
      </CardContent>
    </Card>
  );
}
