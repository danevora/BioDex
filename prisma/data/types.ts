// TypeScript types for animal data validation

export interface AnimalData {
  id: string;
  commonName: string;
  scientificName: string;
  class: TaxonomicClass;
  order: string;
  family: string;
  dietaryGroup: DietaryGroup;
  habitat: string;
  regions: Region[];
  blurb: string;
  hint: string;
}

export type TaxonomicClass =
  | "Mammalia"      // Mammals
  | "Aves"          // Birds
  | "Reptilia"      // Reptiles
  | "Amphibia"      // Amphibians
  | "Actinopterygii" // Ray-finned fish
  | "Chondrichthyes" // Cartilaginous fish (sharks, rays)
  | "Insecta"       // Insects
  | "Arachnida"     // Spiders, scorpions
  | "Malacostraca"  // Crustaceans (crabs, lobsters, crayfish)
  | "Gastropoda"    // Snails, slugs
  | "Cephalopoda";  // Octopus, squid

export type DietaryGroup =
  | "Carnivore"
  | "Herbivore"
  | "Omnivore"
  | "Insectivore"
  | "Piscivore"     // Fish-eater
  | "Frugivore"     // Fruit-eater
  | "Nectarivore"   // Nectar-eater
  | "Detritivore"   // Decomposer
  | "Filter Feeder";

export type Region =
  | "Northeast"
  | "Southeast"
  | "Midwest"
  | "Great Plains"
  | "Southwest"
  | "Pacific"
  | "Alaska"
  | "Hawaii"
  | "Worldwide"
  | "North America";

export interface AnimalFile {
  version: string;
  class: TaxonomicClass;
  animals: AnimalData[];
}

// Validation function
export function validateAnimalData(animal: unknown): animal is AnimalData {
  if (typeof animal !== "object" || animal === null) return false;

  const a = animal as Record<string, unknown>;

  return (
    typeof a.id === "string" &&
    typeof a.commonName === "string" &&
    typeof a.scientificName === "string" &&
    typeof a.class === "string" &&
    typeof a.order === "string" &&
    typeof a.family === "string" &&
    typeof a.dietaryGroup === "string" &&
    typeof a.habitat === "string" &&
    Array.isArray(a.regions) &&
    a.regions.every((r) => typeof r === "string") &&
    typeof a.blurb === "string" &&
    typeof a.hint === "string"
  );
}

export function validateAnimalFile(file: unknown): file is AnimalFile {
  if (typeof file !== "object" || file === null) return false;

  const f = file as Record<string, unknown>;

  return (
    typeof f.version === "string" &&
    typeof f.class === "string" &&
    Array.isArray(f.animals) &&
    f.animals.every(validateAnimalData)
  );
}
