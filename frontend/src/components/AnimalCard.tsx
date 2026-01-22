"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Animal } from "@/types/animal";

interface AnimalCardProps {
  animal: Animal;
  onClick?: () => void;
}

export function AnimalCard({ animal, onClick }: AnimalCardProps) {
  return (
    <Card
      className="cursor-pointer overflow-hidden transition-transform hover:scale-105"
      onClick={onClick}
    >
      <div className="relative aspect-square">
        <Image
          src={animal.image}
          alt={animal.commonName}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{animal.commonName}</h3>
        <p className="text-xs text-muted-foreground italic truncate">
          {animal.scientificName}
        </p>
      </CardContent>
    </Card>
  );
}
