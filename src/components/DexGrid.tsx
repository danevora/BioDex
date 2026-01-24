"use client";

import { Animal } from "@/types/animal";
import { AnimalCard } from "./AnimalCard";

interface DexGridProps {
  animals: Animal[];
  captureMap?: Map<string, string>;
  onAnimalClick?: (animal: Animal) => void;
}

export function DexGrid({
  animals,
  captureMap = new Map(),
  onAnimalClick,
}: DexGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {animals.map((animal) => {
        const userImage = captureMap.get(animal.id);
        const isCaptured = !!userImage;

        return (
          <AnimalCard
            key={animal.id}
            animal={animal}
            isCaptured={isCaptured}
            userImage={userImage}
            onClick={() => onAnimalClick?.(animal)}
          />
        );
      })}
    </div>
  );
}
