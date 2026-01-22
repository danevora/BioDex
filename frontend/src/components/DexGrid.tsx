"use client";

import { Animal } from "@/types/animal";
import { AnimalCard } from "./AnimalCard";

interface DexGridProps {
  animals: Animal[];
  onAnimalClick?: (animal: Animal) => void;
}

export function DexGrid({ animals, onAnimalClick }: DexGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {animals.map((animal) => (
        <AnimalCard
          key={animal.id}
          animal={animal}
          onClick={() => onAnimalClick?.(animal)}
        />
      ))}
    </div>
  );
}
