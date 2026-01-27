"use client";

import { useParams, redirect, notFound } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExplorerBadge, FollowButton } from "@/components/profile";
import { usePublicProfile, useUserPosts, Post } from "@/hooks/useUserProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Heart, MessageCircle } from "lucide-react";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface PostCardProps {
  post: Post;
}

function PostCard({ post }: PostCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square">
        <Image
          src={post.capture.imageUrl}
          alt={post.animal.commonName}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
      </div>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{post.animal.commonName}</p>
            <p className="text-xs text-muted-foreground italic truncate">
              {post.animal.scientificName}
            </p>
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
        {post.caption && (
          <p className="text-sm text-foreground mt-2 line-clamp-2">{post.caption}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className={`h-3 w-3 ${post.isLikedByMe ? "fill-red-500 text-red-500" : ""}`} />
            {post.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {post.commentCount}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PostsGrid({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          This Explorer hasn&apos;t shared any discoveries yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { data: session, status: sessionStatus } = useSession();
  const isAuthLoading = sessionStatus === "loading";

  // Redirect to own profile page if viewing own userId
  const isOwnProfile = session?.user?.id === userId;

  // Use useEffect for client-side redirect to own profile
  useEffect(() => {
    if (!isAuthLoading && isOwnProfile) {
      redirect("/profile");
    }
  }, [isAuthLoading, isOwnProfile]);

  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = usePublicProfile(isOwnProfile ? undefined : userId);

  const {
    data: postsData,
    isLoading: isPostsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPosts(isOwnProfile ? undefined : userId);

  // Flatten paginated posts
  const posts = useMemo(() => {
    return postsData?.pages.flatMap((page) => page.posts) ?? [];
  }, [postsData]);

  // Handle 404 for non-existent users
  if (profileError?.message === "User not found") {
    notFound();
  }

  const isLoading = isAuthLoading || isProfileLoading || isPostsLoading;

  if (isLoading || isOwnProfile) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-muted-foreground">Failed to load profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Explorer Badge with Follow Button */}
        <div className="space-y-4">
          <ExplorerBadge profile={profile} />

          {/* Follow Button - shown below badge on mobile, could be integrated differently */}
          <div className="flex justify-center sm:justify-start">
            <FollowButton
              userId={userId}
              initialIsFollowing={profile.isFollowing}
              initialFollowerCount={profile.followerCount}
            />
          </div>
        </div>

        {/* Posts Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Shared Discoveries</h2>
          <PostsGrid posts={posts} />

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
        </section>

        {/* Back to Feed Link */}
        <div className="pt-4">
          <Link
            href="/feed"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Feed
          </Link>
        </div>
      </main>
    </div>
  );
}
