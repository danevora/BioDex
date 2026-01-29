import { prisma } from "./prisma";
import { BIODEX_USER_ID, STARTER_ANIMAL_ID } from "./constants";

/**
 * Grants the starter animal (Spike) to a user and follows BioDex account.
 * Called during signup for new users.
 */
export async function grantStarterAnimal(userId: string): Promise<void> {
  // Upsert capture of Spike for user
  await prisma.capture.upsert({
    where: {
      userId_animalId: {
        userId,
        animalId: STARTER_ANIMAL_ID,
      },
    },
    update: {},
    create: {
      userId,
      animalId: STARTER_ANIMAL_ID,
      imageUrl: "/spike.png",
      imagePath: "starter",
      confidence: 1.0,
    },
  });

  // Auto-follow BioDex account
  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: userId,
        followingId: BIODEX_USER_ID,
      },
    },
    update: {},
    create: {
      followerId: userId,
      followingId: BIODEX_USER_ID,
    },
  });
}
