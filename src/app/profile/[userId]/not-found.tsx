import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Explorer Not Found</h1>
          <p className="text-muted-foreground">
            This Explorer doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/feed"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
