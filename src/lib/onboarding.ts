import { prisma } from "./prisma";
import { STARTER_ANIMAL_ID } from "./constants";

export async function grantStarterAnimal(userId: string): Promise<void> {
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
}
