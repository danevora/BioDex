"use client";

import { useState, useEffect } from "react";
import { DexGrid } from "@/components/DexGrid";
import { AnimalDetail } from "@/components/AnimalDetail";
import { Animal } from "@/types/animal";

export default function Home() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  useEffect(() => {
    fetch("/animals.json")
      .then((res) => res.json())
      .then(setAnimals);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">BioDex</h1>
          <p className="text-muted-foreground">
            {animals.length} species discovered
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <DexGrid animals={animals} onAnimalClick={setSelectedAnimal} />
      </main>

      {selectedAnimal && (
        <AnimalDetail
          animal={selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
        />
      )}
    </div>
  );
}
