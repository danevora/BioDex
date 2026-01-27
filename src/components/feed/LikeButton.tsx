"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  initialIsLiked: boolean;
  initialLikeCount: number;
  onLikeChange?: (isLiked: boolean, likeCount: number) => void;
}

export function LikeButton({
  postId,
  initialIsLiked,
  initialLikeCount,
  onLikeChange,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);

    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikeCount = likeCount + (newIsLiked ? 1 : -1);
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    try {
      const response = await fetch(`/api/posts/${postId}/likes`, {
        method: newIsLiked ? "POST" : "DELETE",
      });

      if (!response.ok) {
        // Revert on error
        setIsLiked(isLiked);
        setLikeCount(likeCount);
        return;
      }

      const data = await response.json();
      // Update with actual server values
      setIsLiked(data.isLiked);
      setLikeCount(data.likeCount);
      onLikeChange?.(data.isLiked, data.likeCount);
    } catch {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(likeCount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-1.5 px-2 h-8"
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
      <span className={cn("text-sm", isLiked ? "text-red-500" : "text-muted-foreground")}>
        {likeCount}
      </span>
    </Button>
  );
}
