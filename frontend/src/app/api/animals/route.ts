import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const animals = await prisma.animal.findMany({
      where: { isActive: true },
      orderBy: { commonName: "asc" },
    });

    return NextResponse.json(animals);
  } catch (error) {
    console.error("Error fetching animals:", error);
    return NextResponse.json(
      { error: "Failed to fetch animals" },
      { status: 500 }
    );
  }
}
