import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

// Constants
const BIODEX_USER_ID = "biodex-official";
const STARTER_ANIMAL_ID = "spike";
const BIODEX_USERNAME = "BioDex";

// TypeScript types for animal data
interface AnimalData {
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
  isStarterAnimal?: boolean;
}

interface AnimalFile {
  version: string;
  class: string;
  animals: AnimalData[];
}

const ANIMALS_DIR = join(__dirname, "data", "animals");
const BATCH_SIZE = 50;

function loadAllAnimals(): AnimalData[] {
  const allAnimals: AnimalData[] = [];

  if (!existsSync(ANIMALS_DIR)) {
    console.log("Animals directory not found, using empty list");
    return allAnimals;
  }

  const files = readdirSync(ANIMALS_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = join(ANIMALS_DIR, file);
    try {
      const content = readFileSync(filePath, "utf-8");
      const data: AnimalFile = JSON.parse(content);

      if (!data.animals || !Array.isArray(data.animals)) {
        console.warn(`Warning: Invalid format in ${file}, skipping`);
        continue;
      }

      // Validate each animal has required fields
      for (const animal of data.animals) {
        if (!animal.id || !animal.commonName || !animal.scientificName) {
          console.warn(
            `Warning: Animal missing required fields in ${file}, skipping`
          );
          continue;
        }
        allAnimals.push(animal);
      }

      console.log(`Loaded ${data.animals.length} animals from ${file}`);
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }

  return allAnimals;
}

async function batchUpsert(animals: AnimalData[]): Promise<void> {
  for (let i = 0; i < animals.length; i += BATCH_SIZE) {
    const batch = animals.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(
      batch.map((animal) =>
        prisma.animal.upsert({
          where: { id: animal.id },
          update: {
            commonName: animal.commonName,
            scientificName: animal.scientificName,
            class: animal.class,
            order: animal.order,
            family: animal.family,
            dietaryGroup: animal.dietaryGroup,
            habitat: animal.habitat,
            regions: animal.regions,
            blurb: animal.blurb,
            hint: animal.hint,
            isStarterAnimal: animal.isStarterAnimal ?? false,
          },
          create: {
            id: animal.id,
            commonName: animal.commonName,
            scientificName: animal.scientificName,
            class: animal.class,
            order: animal.order,
            family: animal.family,
            dietaryGroup: animal.dietaryGroup,
            habitat: animal.habitat,
            regions: animal.regions,
            blurb: animal.blurb,
            hint: animal.hint,
            isStarterAnimal: animal.isStarterAnimal ?? false,
          },
        })
      )
    );

    console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(animals.length / BATCH_SIZE)}`);
  }
}

function getStats(animals: AnimalData[]): Record<string, number> {
  const stats: Record<string, number> = {};

  for (const animal of animals) {
    stats[animal.class] = (stats[animal.class] || 0) + 1;
  }

  return stats;
}

async function seedBioDexAccount(): Promise<void> {
  console.log("\nSeeding BioDex account...");

  // Generate a random unusable password
  const randomPassword = Math.random().toString(36).repeat(3);

  // Upsert BioDex official account
  await prisma.user.upsert({
    where: { id: BIODEX_USER_ID },
    update: { image: "/spike.png" },
    create: {
      id: BIODEX_USER_ID,
      username: BIODEX_USERNAME,
      email: "noreply@biodex.app",
      password: randomPassword,
      image: "/spike.png",
      isSystemUser: true,
      hasOnboarded: true,
    },
  });
  console.log("  BioDex account created/verified");

  // Upsert BioDex's capture of Spike
  await prisma.capture.upsert({
    where: {
      userId_animalId: {
        userId: BIODEX_USER_ID,
        animalId: STARTER_ANIMAL_ID,
      },
    },
    update: {},
    create: {
      userId: BIODEX_USER_ID,
      animalId: STARTER_ANIMAL_ID,
      imageUrl: "/spike.png",
      imagePath: "starter",
      confidence: 1.0,
    },
  });
  console.log("  BioDex Spike capture created/verified");

  // Create welcome post if none exists
  const existingPost = await prisma.post.findFirst({
    where: { userId: BIODEX_USER_ID },
  });

  if (!existingPost) {
    const capture = await prisma.capture.findUnique({
      where: {
        userId_animalId: {
          userId: BIODEX_USER_ID,
          animalId: STARTER_ANIMAL_ID,
        },
      },
    });

    if (capture) {
      await prisma.post.create({
        data: {
          userId: BIODEX_USER_ID,
          captureId: capture.id,
          caption: "Welcome to BioDex!",
        },
      });
      console.log("  Welcome post created");
    }
  } else {
    console.log("  Welcome post already exists");
  }

  console.log("BioDex account seeding complete!");
}

async function main() {
  console.log("Starting database seed...\n");

  // Load all animals from JSON files
  const animals = loadAllAnimals();

  if (animals.length === 0) {
    console.log("No animals to seed");
    return;
  }

  console.log(`\nTotal animals to seed: ${animals.length}`);

  // Show statistics by class
  const stats = getStats(animals);
  console.log("\nAnimals by class:");
  for (const [className, count] of Object.entries(stats).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${className}: ${count}`);
  }

  console.log("\nSeeding database...\n");

  // Batch upsert all animals
  await batchUpsert(animals);

  // Verify the count
  const dbCount = await prisma.animal.count();
  console.log(`\nSeeding complete! ${dbCount} animals in database.`);

  // Seed BioDex account and welcome post
  await seedBioDexAccount();
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
