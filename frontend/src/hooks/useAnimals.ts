import { useQuery } from "@tanstack/react-query";
import { Animal } from "@/types/animal";

async function fetchAnimals(): Promise<Animal[]> {
  const response = await fetch("/api/animals");
  if (!response.ok) {
    throw new Error("Failed to fetch animals");
  }
  return response.json();
}

export function useAnimals() {
  return useQuery({
    queryKey: ["animals"],
    queryFn: fetchAnimals,
  });
}
