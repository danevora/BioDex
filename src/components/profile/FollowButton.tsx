"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, UserMinus } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
  onFollowChange?: (isFollowing: boolean, followerCount: number) => void;
}

export function FollowButton({
  userId,
  initialIsFollowing,
  initialFollowerCount,
  onFollowChange,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!session?.user) return;

    setIsLoading(true);

    // Optimistic update
    const newIsFollowing = !isFollowing;
    const newFollowerCount = followerCount + (newIsFollowing ? 1 : -1);
    setIsFollowing(newIsFollowing);
    setFollowerCount(newFollowerCount);

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: newIsFollowing ? "POST" : "DELETE",
      });

      if (!response.ok) {
        // Revert on error
        setIsFollowing(isFollowing);
        setFollowerCount(followerCount);
        return;
      }

      const data = await response.json();
      // Update with actual server values
      setIsFollowing(data.isFollowing);
      setFollowerCount(data.followerCount);
      onFollowChange?.(data.isFollowing, data.followerCount);
    } catch {
      // Revert on error
      setIsFollowing(isFollowing);
      setFollowerCount(followerCount);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if not authenticated
  if (!session?.user) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className="min-w-[100px]"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
}
