"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import {
  useUserFollowers,
  useUserFollowing,
  useFollowUser,
  useUnfollowUser,
  FollowUser,
} from "@/hooks/useFollow";

interface FollowListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "followers" | "following";
  userId: string;
  count: number;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function UserListItem({
  user,
  onUserClick,
  currentUserId,
}: {
  user: FollowUser;
  onUserClick: (userId: string) => void;
  currentUserId?: string;
}) {
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const isLoading = followMutation.isPending || unfollowMutation.isPending;
  const isOwnProfile = currentUserId === user.id;

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user.isFollowing) {
      unfollowMutation.mutate(user.id);
    } else {
      followMutation.mutate(user.id);
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
      onClick={() => onUserClick(user.id)}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.image || undefined} alt={user.username || "User"} />
        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
          {getInitials(user.username)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">@{user.username || "explorer"}</p>
        <p className="text-sm text-muted-foreground">
          {user.discoveryCount} discoveries
        </p>
      </div>
      {!isOwnProfile && currentUserId && (
        <Button
          variant={user.isFollowing ? "outline" : "default"}
          size="sm"
          onClick={handleFollowClick}
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : user.isFollowing ? (
            "Unfollow"
          ) : (
            "Follow"
          )}
        </Button>
      )}
    </div>
  );
}

export function FollowListModal({
  open,
  onOpenChange,
  type,
  userId,
  count,
}: FollowListModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const followersQuery = useUserFollowers(open ? userId : undefined);
  const followingQuery = useUserFollowing(open ? userId : undefined);

  const users = type === "followers"
    ? followersQuery.data?.pages.flatMap((page) => page.followers) ?? []
    : followingQuery.data?.pages.flatMap((page) => page.following) ?? [];
  const query = type === "followers" ? followersQuery : followingQuery;
  const hasNextPage = query.hasNextPage;
  const isLoading = query.isLoading;
  const isFetchingNextPage = query.isFetchingNextPage;

  const handleUserClick = (userId: string) => {
    onOpenChange(false);
    router.push(`/profile/${userId}`);
  };

  const title = type === "followers" ? `${count} Followers` : `${count} Following`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {type === "followers" ? "No followers yet" : "Not following anyone yet"}
            </p>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onUserClick={handleUserClick}
                  currentUserId={currentUserId}
                />
              ))}
              {hasNextPage && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => query.fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
