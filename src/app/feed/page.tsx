"use client";

import { useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { useFeed } from "@/hooks/useFeed";
import { FeedCard, ExplorerSearch } from "@/components/feed";
import { MobileMenuButton } from "@/components/navigation/BottomNav";

export default function FeedPage() {
  const { data: session, status } = useSession();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useFeed();

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleObserver]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
      <header className="border-b sticky top-0 bg-background z-10 md:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold">Feed</h1>
            <div className="flex items-center gap-2">
              <ExplorerSearch />
              <MobileMenuButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-2">Failed to load feed</p>
            <p className="text-muted-foreground text-sm">
              Please try refreshing the page
            </p>
          </div>
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold mb-2">Your feed is empty</p>
            <p className="text-muted-foreground text-sm max-w-[280px]">
              Follow other Explorers to see their discoveries here, or share
              your own discoveries!
            </p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-4">
            {allPosts.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
