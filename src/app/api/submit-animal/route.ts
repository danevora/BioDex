import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_CLASSES = [
  "Mammalia",
  "Aves",
  "Reptilia",
  "Amphibia",
  "Actinopterygii",
  "Chondrichthyes",
  "Insecta",
  "Arachnida",
  "Other",
];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { GITHUB_TOKEN, GITHUB_REPO } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return NextResponse.json(
      { error: "Submissions are not configured" },
      { status: 500 }
    );
  }

  let body: { commonName: string; scientificName: string; class: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { commonName, scientificName, notes } = body;
  const animalClass = body.class;

  if (!commonName || typeof commonName !== "string" || commonName.trim().length === 0) {
    return NextResponse.json({ error: "Common name is required" }, { status: 400 });
  }
  if (commonName.length > 100) {
    return NextResponse.json({ error: "Common name must be 100 characters or less" }, { status: 400 });
  }

  if (!scientificName || typeof scientificName !== "string" || scientificName.trim().length === 0) {
    return NextResponse.json({ error: "Scientific name is required" }, { status: 400 });
  }
  if (scientificName.length > 100) {
    return NextResponse.json({ error: "Scientific name must be 100 characters or less" }, { status: 400 });
  }

  if (!ALLOWED_CLASSES.includes(animalClass)) {
    return NextResponse.json({ error: "Invalid class" }, { status: 400 });
  }

  if (notes && notes.length > 500) {
    return NextResponse.json({ error: "Notes must be 500 characters or less" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });
  const username = user?.username || "unknown";

  const notesSection = notes?.trim()
    ? `\n\n## Notes\n\n${notes.trim()}`
    : "";

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
          title: `[Animal Submission] ${commonName.trim()} (${scientificName.trim()})`,
          body: `## Animal Details\n\n- **Common Name:** ${commonName.trim()}\n- **Scientific Name:** ${scientificName.trim()}\n- **Class:** ${animalClass}${notesSection}\n\n## Metadata\n\n- **User ID:** ${session.user.id}\n- **Username:** ${username}\n- **Timestamp:** ${new Date().toISOString()}`,
          labels: ["animal-suggestion"],
        }),
      }
    );

    if (!response.ok) {
      console.error("GitHub API error:", response.status, await response.text());
      return NextResponse.json({ error: "Failed to submit suggestion" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating GitHub issue:", error);
    return NextResponse.json({ error: "Failed to submit suggestion" }, { status: 500 });
  }
}
