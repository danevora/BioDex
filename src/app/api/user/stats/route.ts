import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [captureCount, totalAnimals] = await Promise.all([
      prisma.capture.count({
        where: { userId: session.user.id },
      }),
      prisma.animal.count({
        where: { isActive: true },
      }),
    ]);

    const completionPercentage =
      totalAnimals > 0 ? Math.round((captureCount / totalAnimals) * 100) : 0;

    return NextResponse.json({
      captureCount,
      totalAnimals,
      completionPercentage,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
