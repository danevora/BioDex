"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Animal } from "@/types/animal";
import { Check, HelpCircle } from "lucide-react";

interface AnimalCardProps {
  animal: Animal;
  isCaptured?: boolean;
  userImage?: string;
  onClick?: () => void;
}

export function AnimalCard({
  animal,
  isCaptured = false,
  userImage,
  onClick,
}: AnimalCardProps) {
  return (
    <Card
      className={`overflow-hidden relative ${isCaptured ? "cursor-pointer transition-transform hover:scale-105" : ""}`}
      onClick={isCaptured ? onClick : undefined}
    >
      <div className="relative aspect-square">
        {isCaptured && userImage ? (
          <Image
            src={userImage}
            alt={animal.commonName}
            fill
            className="object-cover"
            unoptimized={userImage.includes("supabase.co")}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <HelpCircle className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {isCaptured && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        {isCaptured ? (
          <>
            <h3 className="font-semibold text-sm truncate">{animal.commonName}</h3>
            <p className="text-xs text-muted-foreground italic truncate">
              {animal.scientificName}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            {animal.hint || "A mysterious creature..."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
