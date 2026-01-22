"use client";

import Image from "next/image";
import { Animal } from "@/types/animal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnimalDetailProps {
  animal: Animal;
  onClose: () => void;
}

export function AnimalDetail({ animal, onClose }: AnimalDetailProps) {
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
            src={animal.image}
            alt={animal.commonName}
            fill
            className="object-cover rounded-t-lg"
          />
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
