import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { UserStats } from "@/types/animal";

async function fetchUserStats(): Promise<UserStats> {
  const response = await fetch("/api/user/stats");
  if (!response.ok) {
    if (response.status === 401) {
      return { captureCount: 0, totalAnimals: 0, completionPercentage: 0 };
    }
    throw new Error("Failed to fetch user stats");
  }
  return response.json();
}

export function useUserStats() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["userStats", userId],
    queryFn: fetchUserStats,
    enabled: !!userId,
  });
}
