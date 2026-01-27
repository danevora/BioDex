"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Post } from "@/hooks/useUserProfile";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  post: Post;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

export function FeedCard({ post }: FeedCardProps) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);

  const displayName = post.user.username || "Explorer";
  const initials = getInitials(post.user.username);

  return (
    <Card className="w-full overflow-hidden">
      {/* Header with user info */}
      <CardContent className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user.id}`}>
            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={post.user.image || undefined} alt={displayName} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${post.user.id}`}
              className="hover:underline"
            >
              <p className="font-semibold text-sm truncate">@{displayName}</p>
            </Link>
          </div>
          <span className="text-muted-foreground text-xs shrink-0">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
      </CardContent>

      {/* Discovery photo */}
      <div className="relative w-full aspect-square bg-muted">
        <Image
          src={post.capture.imageUrl}
          alt={post.animal.commonName}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 640px"
        />
      </div>

      {/* Animal info and interactions */}
      <CardContent className="p-4 pt-3 space-y-2">
        {/* Animal discovered */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm">
              Discovered: {post.animal.commonName}
            </p>
            <p className="text-muted-foreground text-xs italic">
              {post.animal.scientificName}
            </p>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-foreground">{post.caption}</p>
        )}

        {/* Like and Comment buttons */}
        <div className="flex items-center gap-2 pt-1">
          <LikeButton
            postId={post.id}
            initialIsLiked={post.isLikedByMe}
            initialLikeCount={post.likeCount}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={cn(
              "flex items-center gap-1.5 px-2 h-8",
              isCommentsOpen && "bg-muted"
            )}
          >
            <MessageCircle
              className={cn(
                "h-5 w-5",
                isCommentsOpen ? "text-emerald-600" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-sm",
                isCommentsOpen ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {commentCount}
            </span>
          </Button>
        </div>
      </CardContent>

      {/* Comment Section */}
      <CommentSection
        postId={post.id}
        isOpen={isCommentsOpen}
        onCommentCountChange={setCommentCount}
      />
    </Card>
  );
}
