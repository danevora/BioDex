import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STARTER_ANIMAL_ID = "spike";

async function main() {
  console.log("Granting Spike to existing users...\n");

  const usersWithoutSpike = await prisma.user.findMany({
    where: {
      captures: {
        none: { animalId: STARTER_ANIMAL_ID },
      },
      isSystemUser: false,
    },
    select: { id: true, username: true },
  });

  console.log(`Found ${usersWithoutSpike.length} users without Spike`);

  for (const user of usersWithoutSpike) {
    await prisma.capture.upsert({
      where: {
        userId_animalId: {
          userId: user.id,
          animalId: STARTER_ANIMAL_ID,
        },
      },
      update: {},
      create: {
        userId: user.id,
        animalId: STARTER_ANIMAL_ID,
        imageUrl: "/spike.png",
        imagePath: "starter",
        confidence: 1.0,
      },
    });

    console.log(`  Granted Spike to ${user.username}`);
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
