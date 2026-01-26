/**
 * Generate Content Script
 *
 * Uses Claude API to generate blurbs, hints, habitat, and dietary information
 * for animal species.
 *
 * Usage:
 *   npx tsx scripts/generate-content.ts
 *
 * Requires:
 *   ANTHROPIC_API_KEY environment variable
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

interface SpeciesInput {
  id: string;
  commonName: string;
  scientificName: string;
  class: string;
  order: string;
  family: string;
}

interface GeneratedContent {
  dietaryGroup: string;
  habitat: string;
  regions: string[];
  blurb: string;
  hint: string;
}

interface CompleteAnimal extends SpeciesInput, GeneratedContent {}

const VALID_DIETARY_GROUPS = [
  "Carnivore",
  "Herbivore",
  "Omnivore",
  "Insectivore",
  "Piscivore",
  "Frugivore",
  "Nectarivore",
  "Detritivore",
  "Filter Feeder",
];

const VALID_REGIONS = [
  "Northeast",
  "Southeast",
  "Midwest",
  "Great Plains",
  "Southwest",
  "Pacific",
  "Alaska",
  "Hawaii",
];

async function generateContent(
  client: Anthropic,
  species: SpeciesInput
): Promise<GeneratedContent | null> {
  const prompt = `Generate content for a Pokédex-style app entry about the ${species.commonName} (${species.scientificName}).

Return a JSON object with these fields:
- dietaryGroup: One of: ${VALID_DIETARY_GROUPS.join(", ")}
- habitat: Brief description of typical habitats (20-40 words)
- regions: Array of North American regions where found. Valid regions: ${VALID_REGIONS.join(", ")}
- blurb: Educational, engaging description (40-60 words). Include interesting facts.
- hint: Short, playful clue for identifying this animal (8-12 words)

Respond with ONLY the JSON object, no markdown or explanation.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const content = JSON.parse(responseText) as GeneratedContent;

    // Validate dietary group
    if (!VALID_DIETARY_GROUPS.includes(content.dietaryGroup)) {
      console.warn(
        `Invalid dietary group for ${species.commonName}: ${content.dietaryGroup}`
      );
      content.dietaryGroup = "Omnivore"; // Default fallback
    }

    // Validate regions
    content.regions = content.regions.filter((r) => VALID_REGIONS.includes(r));
    if (content.regions.length === 0) {
      content.regions = ["North America"];
    }

    return content;
  } catch (error) {
    console.error(`Error generating content for ${species.commonName}:`, error);
    return null;
  }
}

async function main() {
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  const client = new Anthropic();

  // Load input species data
  const inputPath = join(
    __dirname,
    "..",
    "prisma",
    "data",
    "fetched-species.json"
  );

  if (!existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    console.error("Run fetch-species-data.ts first");
    process.exit(1);
  }

  const species: SpeciesInput[] = JSON.parse(readFileSync(inputPath, "utf-8"));
  console.log(`Generating content for ${species.length} species...\n`);

  const results: CompleteAnimal[] = [];
  const failed: string[] = [];

  for (const s of species) {
    console.log(`Processing ${s.commonName}...`);

    const content = await generateContent(client, s);

    if (content) {
      results.push({
        ...s,
        ...content,
      });
      console.log(`  ✓ ${s.commonName}`);
    } else {
      failed.push(s.commonName);
      console.log(`  ✗ ${s.commonName}`);
    }

    // Rate limiting - be respectful to the API
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\nGenerated content for ${results.length}/${species.length} species`);

  if (failed.length > 0) {
    console.log(`\nFailed species:`);
    failed.forEach((name) => console.log(`  - ${name}`));
  }

  // Group by class and output
  const byClass: Record<string, CompleteAnimal[]> = {};
  for (const animal of results) {
    const className = animal.class;
    if (!byClass[className]) {
      byClass[className] = [];
    }
    byClass[className].push(animal);
  }

  // Output grouped results
  const outputPath = join(
    __dirname,
    "..",
    "prisma",
    "data",
    "generated-animals.json"
  );
  writeFileSync(outputPath, JSON.stringify(byClass, null, 2));
  console.log(`\nResults written to ${outputPath}`);

  // Summary
  console.log("\nBy class:");
  for (const [className, animals] of Object.entries(byClass)) {
    console.log(`  ${className}: ${animals.length}`);
  }
}

main().catch(console.error);
