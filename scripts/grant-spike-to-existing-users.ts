import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BIODEX_USER_ID = "biodex-official";
const STARTER_ANIMAL_ID = "spike";

async function main() {
  console.log("Granting Spike to existing users...\n");

  // Get all users who don't have Spike
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
    // Create capture
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

    // Create follow to BioDex
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: BIODEX_USER_ID,
        },
      },
      update: {},
      create: {
        followerId: user.id,
        followingId: BIODEX_USER_ID,
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
