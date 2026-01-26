// Aggregates all animal JSON files for seeding

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { AnimalData, AnimalFile, validateAnimalFile } from "./types";

const ANIMALS_DIR = join(__dirname, "animals");

export function loadAllAnimals(): AnimalData[] {
  const allAnimals: AnimalData[] = [];
  const files = readdirSync(ANIMALS_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = join(ANIMALS_DIR, file);
    const content = readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    if (!validateAnimalFile(data)) {
      throw new Error(`Invalid animal file format: ${file}`);
    }

    allAnimals.push(...data.animals);
  }

  return allAnimals;
}

export function loadAnimalsByClass(taxonomicClass: string): AnimalData[] {
  const allAnimals = loadAllAnimals();
  return allAnimals.filter((a) => a.class === taxonomicClass);
}

export function getAnimalStats(): Record<string, number> {
  const allAnimals = loadAllAnimals();
  const stats: Record<string, number> = {};

  for (const animal of allAnimals) {
    stats[animal.class] = (stats[animal.class] || 0) + 1;
  }

  stats.total = allAnimals.length;
  return stats;
}

export { AnimalData, AnimalFile } from "./types";
