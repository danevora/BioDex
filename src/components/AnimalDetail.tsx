"use client";

import Image from "next/image";
import { Animal } from "@/types/animal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface AnimalDetailProps {
  animal: Animal;
  userImage?: string;
  onClose: () => void;
}

export function AnimalDetail({ animal, userImage, onClose }: AnimalDetailProps) {
  const displayImage = userImage || animal.defaultImage;
  const isCaptured = !!userImage;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-video">
          <Image
            src={displayImage}
            alt={animal.commonName}
            fill
            className="object-cover rounded-t-lg"
            unoptimized={displayImage.includes("supabase.co")}
          />
          {isCaptured && (
            <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Check className="h-4 w-4" />
              Your Capture
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle>{animal.commonName}</CardTitle>
          <p className="text-sm text-muted-foreground italic">
            {animal.scientificName}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{animal.blurb}</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Class:</span> {animal.class}
            </div>
            <div>
              <span className="font-medium">Order:</span> {animal.order}
            </div>
            <div>
              <span className="font-medium">Family:</span> {animal.family}
            </div>
            <div>
              <span className="font-medium">Diet:</span> {animal.dietaryGroup}
            </div>
          </div>

          <div className="text-sm">
            <span className="font-medium">Habitat:</span> {animal.habitat}
          </div>

          <div className="text-sm">
            <span className="font-medium">Regions:</span>{" "}
            {animal.regions.join(", ")}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
