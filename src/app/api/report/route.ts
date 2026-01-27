import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_CATEGORIES = ["Misidentification", "Bug", "Inappropriate Content", "Other"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { GITHUB_TOKEN, GITHUB_REPO } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return NextResponse.json(
      { error: "Reporting is not configured" },
      { status: 500 }
    );
  }

  let body: { category: string; description: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { category, description } = body;

  if (!ALLOWED_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "Invalid category" },
      { status: 400 }
    );
  }

  if (!description || typeof description !== "string" || description.trim().length === 0) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }

  if (description.length > 1000) {
    return NextResponse.json(
      { error: "Description must be 1000 characters or less" },
      { status: 400 }
    );
  }

  // Get username for the issue
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });
  const username = user?.username || "unknown";

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `[${category}] User Report from ${username}`,
          body: `## Description\n\n${description.trim()}\n\n## Metadata\n\n- **User ID:** ${session.user.id}\n- **Username:** ${username}\n- **Timestamp:** ${new Date().toISOString()}`,
          labels: ["user-report"],
        }),
      }
    );

    if (!response.ok) {
      console.error("GitHub API error:", response.status, await response.text());
      return NextResponse.json(
        { error: "Failed to submit report" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating GitHub issue:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
