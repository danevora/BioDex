"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useComments, useCreateComment, Comment } from "@/hooks/useComments";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onCommentCountChange?: (count: number) => void;
}

const MAX_COMMENT_LENGTH = 1000;

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

function CommentItem({ comment }: { comment: Comment }) {
  const displayName =
    comment.author.displayName || comment.author.username || "Explorer";
  const initials = getInitials(
    comment.author.displayName || comment.author.username
  );

  return (
    <div className="flex gap-2 py-2">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.author.image || undefined} alt={displayName} />
        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm truncate">{displayName}</span>
          <span className="text-muted-foreground text-xs shrink-0">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-foreground break-words">{comment.content}</p>
      </div>
    </div>
  );
}

export function CommentSection({
  postId,
  isOpen,
  onCommentCountChange,
}: CommentSectionProps) {
  const [commentText, setCommentText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useComments(postId, isOpen);

  const createComment = useCreateComment(postId);

  // Scroll to bottom when new comment is added
  useEffect(() => {
    if (createComment.isSuccess && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [createComment.isSuccess]);

  // Focus input when section opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure animation completes
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = commentText.trim();
    if (!trimmedContent || createComment.isPending) return;

    try {
      const result = await createComment.mutateAsync(trimmedContent);
      setCommentText("");
      onCommentCountChange?.(result.commentCount);
    } catch {
      // Error is handled by mutation state
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  const allComments = data?.pages.flatMap((page) => page.comments) ?? [];
  const charCount = commentText.length;
  const isOverLimit = charCount > MAX_COMMENT_LENGTH;

  return (
    <div
      className={cn(
        "border-t bg-muted/30 overflow-hidden transition-all duration-200",
        isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
      )}
    >
      {/* Comments List */}
      <div
        ref={scrollContainerRef}
        className="max-h-[280px] overflow-y-auto px-4 py-2"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="text-center text-sm text-destructive py-4">
            Failed to load comments
          </p>
        ) : allComments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <>
            {allComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            {hasNextPage && (
              <div className="py-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-muted-foreground"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Load more comments
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="border-t px-4 py-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment..."
              rows={1}
              className={cn(
                "w-full resize-none rounded-md border bg-background px-3 py-2 text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                "focus:ring-emerald-500 focus:border-transparent",
                "min-h-[40px] max-h-[100px]",
                isOverLimit && "border-destructive focus:ring-destructive"
              )}
              style={{
                height: "auto",
                minHeight: "40px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
              }}
            />
            <div
              className={cn(
                "absolute bottom-1 right-2 text-xs",
                isOverLimit ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {charCount > 0 && `${charCount}/${MAX_COMMENT_LENGTH}`}
            </div>
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={
              !commentText.trim() || isOverLimit || createComment.isPending
            }
            className="h-10 w-10 shrink-0 bg-emerald-600 hover:bg-emerald-700"
          >
            {createComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send comment</span>
          </Button>
        </div>
        {createComment.isError && (
          <p className="text-destructive text-xs mt-1">
            {createComment.error?.message || "Failed to post comment"}
          </p>
        )}
      </form>
    </div>
  );
}
