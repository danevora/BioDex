import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";

export interface SearchUser {
  id: string;
  username: string | null;
  displayName: string | null;
  image: string | null;
  followerCount: number;
  discoveryCount: number;
  isFollowing: boolean;
}

interface SearchUsersResponse {
  users: SearchUser[];
}

async function fetchSearchUsers(query: string): Promise<SearchUsersResponse> {
  const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error("Failed to search users");
  }
  return response.json();
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: () => fetchSearchUsers(query),
    enabled: query.length >= 2,
    staleTime: 30000, // Cache results for 30 seconds
  });
}

// Hook with built-in debounce
export function useDebouncedSearch(initialQuery = "", delay = 300) {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [debouncedValue, setDebouncedValue] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue, delay]);

  const searchQuery = useSearchUsers(debouncedValue);

  return useMemo(
    () => ({
      inputValue,
      setInputValue,
      debouncedValue,
      ...searchQuery,
    }),
    [inputValue, debouncedValue, searchQuery]
  );
}
