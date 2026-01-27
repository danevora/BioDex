import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdminAuth(request: NextRequest): boolean {
  const password = request.headers.get("x-admin-password");
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return password === adminPassword;
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const classFilter = searchParams.get("class");
  const sort = searchParams.get("sort") || "name";
  const review = searchParams.get("review") === "true";

  const where: Record<string, unknown> = {};

  if (classFilter) {
    where.class = classFilter;
  }

  if (review) {
    where.isUserSubmitted = true;
  }

  const orderBy =
    sort === "date"
      ? { createdAt: "desc" as const }
      : { commonName: "asc" as const };

  const animals = await prisma.animal.findMany({
    where,
    orderBy,
    include: {
      _count: {
        select: { captures: true },
      },
    },
  });

  return NextResponse.json({ animals });
}
