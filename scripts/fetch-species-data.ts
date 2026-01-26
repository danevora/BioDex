/**
 * Fetch Species Data Script
 *
 * Fetches taxonomic data from ITIS (Integrated Taxonomic Information System)
 * and occurrence data from iNaturalist APIs.
 *
 * Usage:
 *   npx tsx scripts/fetch-species-data.ts
 *
 * Output:
 *   Creates/updates JSON files in prisma/data/animals/
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const ITIS_BASE_URL = "https://www.itis.gov/ITISWebService/jsonservice";
const INATURALIST_BASE_URL = "https://api.inaturalist.org/v1";

interface ITISSearchResult {
  commonNames?: Array<{ commonName: string }>;
  scientificName?: string;
  tsn?: string;
}

interface ITISHierarchy {
  hierarchyList?: Array<{
    rankName: string;
    taxonName: string;
  }>;
}

interface INaturalistResult {
  results?: Array<{
    name: string;
    preferred_common_name?: string;
    ancestor_ids?: number[];
    ancestors?: Array<{
      rank: string;
      name: string;
    }>;
  }>;
}

interface SpeciesData {
  id: string;
  commonName: string;
  scientificName: string;
  class: string;
  order: string;
  family: string;
}

// Target species list - common North American animals to add
const TARGET_SPECIES: Array<{ commonName: string; scientificName: string }> = [
  // Additional mammals
  { commonName: "Snowshoe Hare", scientificName: "Lepus americanus" },
  { commonName: "Black-tailed Jackrabbit", scientificName: "Lepus californicus" },
  { commonName: "American Pika", scientificName: "Ochotona princeps" },
  { commonName: "Hoary Marmot", scientificName: "Marmota caligata" },
  { commonName: "Yellow-bellied Marmot", scientificName: "Marmota flaviventris" },

  // Additional birds
  { commonName: "Snowy Owl", scientificName: "Bubo scandiacus" },
  { commonName: "Barn Owl", scientificName: "Tyto alba" },
  { commonName: "Golden Eagle", scientificName: "Aquila chrysaetos" },
  { commonName: "Sandhill Crane", scientificName: "Antigone canadensis" },
  { commonName: "Great Horned Owl", scientificName: "Bubo virginianus" },

  // Add more as needed...
];

async function fetchWithRetry(
  url: string,
  retries = 3
): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      console.warn(`Request failed (${response.status}), retrying...`);
    } catch (error) {
      console.warn(`Request error, retrying...`, error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
  }
  return null;
}

async function searchITIS(scientificName: string): Promise<ITISSearchResult | null> {
  const url = `${ITIS_BASE_URL}/searchByScientificName?srchKey=${encodeURIComponent(
    scientificName
  )}`;
  const response = await fetchWithRetry(url);
  if (!response) return null;

  const data = await response.json();
  return data.scientificNames?.[0] || null;
}

async function getITISHierarchy(tsn: string): Promise<ITISHierarchy | null> {
  const url = `${ITIS_BASE_URL}/getFullHierarchyFromTSN?tsn=${tsn}`;
  const response = await fetchWithRetry(url);
  if (!response) return null;

  return response.json();
}

async function searchINaturalist(
  scientificName: string
): Promise<INaturalistResult | null> {
  const url = `${INATURALIST_BASE_URL}/taxa?q=${encodeURIComponent(
    scientificName
  )}&rank=species&per_page=1`;
  const response = await fetchWithRetry(url);
  if (!response) return null;

  return response.json();
}

function extractTaxonomy(
  hierarchy: ITISHierarchy
): { class: string; order: string; family: string } | null {
  const ranks: Record<string, string> = {};

  for (const item of hierarchy.hierarchyList || []) {
    ranks[item.rankName.toLowerCase()] = item.taxonName;
  }

  if (ranks.class && ranks.order && ranks.family) {
    return {
      class: ranks.class,
      order: ranks.order,
      family: ranks.family,
    };
  }

  return null;
}

async function fetchSpeciesData(
  commonName: string,
  scientificName: string
): Promise<SpeciesData | null> {
  console.log(`Fetching data for ${commonName} (${scientificName})...`);

  // Try ITIS first
  const itisResult = await searchITIS(scientificName);

  if (itisResult?.tsn) {
    const hierarchy = await getITISHierarchy(itisResult.tsn);
    if (hierarchy) {
      const taxonomy = extractTaxonomy(hierarchy);
      if (taxonomy) {
        return {
          id: commonName.toLowerCase().replace(/\s+/g, "-"),
          commonName,
          scientificName,
          ...taxonomy,
        };
      }
    }
  }

  // Fallback to iNaturalist
  const inatResult = await searchINaturalist(scientificName);
  if (inatResult?.results?.[0]?.ancestors) {
    const ancestors = inatResult.results[0].ancestors;
    const classInfo = ancestors.find((a) => a.rank === "class");
    const orderInfo = ancestors.find((a) => a.rank === "order");
    const familyInfo = ancestors.find((a) => a.rank === "family");

    if (classInfo && orderInfo && familyInfo) {
      return {
        id: commonName.toLowerCase().replace(/\s+/g, "-"),
        commonName,
        scientificName,
        class: classInfo.name,
        order: orderInfo.name,
        family: familyInfo.name,
      };
    }
  }

  console.warn(`Could not fetch complete data for ${commonName}`);
  return null;
}

async function main() {
  console.log("Fetching species data from ITIS and iNaturalist...\n");

  const results: SpeciesData[] = [];
  const failed: string[] = [];

  for (const species of TARGET_SPECIES) {
    const data = await fetchSpeciesData(
      species.commonName,
      species.scientificName
    );

    if (data) {
      results.push(data);
      console.log(`  ✓ ${species.commonName}`);
    } else {
      failed.push(species.commonName);
      console.log(`  ✗ ${species.commonName}`);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\nFetched ${results.length}/${TARGET_SPECIES.length} species`);

  if (failed.length > 0) {
    console.log(`\nFailed species:`);
    failed.forEach((name) => console.log(`  - ${name}`));
  }

  // Output results
  const outputPath = join(__dirname, "..", "prisma", "data", "fetched-species.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${outputPath}`);
}

main().catch(console.error);
