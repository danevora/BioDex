"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function FeedPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Feed</h1>
          <p className="text-muted-foreground">
            Discoveries from Explorers you follow
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">
            Your feed is empty. Follow other Explorers to see their discoveries!
          </p>
        </div>
      </main>
    </div>
  );
}
