export interface Animal {
  id: string;
  commonName: string;
  scientificName: string;
  class: string;
  order: string;
  family: string;
  dietaryGroup: string;
  habitat: string;
  regions: string[];
  blurb: string;
  hint: string;
  defaultImage: string;
  isActive?: boolean;
}

export interface Capture {
  id: string;
  userId: string;
  animalId: string;
  imageUrl: string;
  imagePath: string;
  confidence: number | null;
  capturedAt: string;
  animal?: Animal;
}

export interface UserStats {
  captureCount: number;
  totalAnimals: number;
  completionPercentage: number;
}
