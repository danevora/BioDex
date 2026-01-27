"use client";

import { Calendar, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserProfile } from "@/hooks/useUserProfile";

interface ExplorerBadgeProps {
  profile: UserProfile;
  onEditClick?: () => void;
  showEditButton?: boolean;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatJoinDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function ExplorerBadge({
  profile,
  onEditClick,
  showEditButton = false,
}: ExplorerBadgeProps) {
  const displayName = profile.username || "Explorer";
  const initials = getInitials(profile.username);

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          {/* Avatar */}
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
            <AvatarImage src={profile.image || undefined} alt={displayName} />
            <AvatarFallback className="text-xl sm:text-2xl bg-emerald-100 text-emerald-700">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h2 className="text-xl sm:text-2xl font-bold">@{displayName}</h2>
              {showEditButton && onEditClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditClick}
                  className="hidden sm:inline-flex"
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {profile.bio && (
              <p className="mt-2 text-sm text-foreground">{profile.bio}</p>
            )}

            {/* Join Date */}
            <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatJoinDate(profile.createdAt)}</span>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
              {/* Discovery Count */}
              <div className="text-center sm:text-left">
                <span className="font-bold text-lg">{profile.discoveryCount}</span>
                <span className="text-muted-foreground text-sm ml-1">
                  species discovered
                </span>
              </div>

              {/* Followers/Following */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{profile.followerCount}</span>
                  <span className="text-muted-foreground">followers</span>
                </div>
                <div>
                  <span className="font-semibold">{profile.followingCount}</span>
                  <span className="text-muted-foreground ml-1">following</span>
                </div>
              </div>
            </div>

            {/* Mobile Edit Button */}
            {showEditButton && onEditClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="mt-4 sm:hidden w-full"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
