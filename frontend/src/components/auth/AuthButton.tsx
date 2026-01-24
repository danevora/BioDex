"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="text-gray-600 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Link href="/auth/signin">
      <Button variant="outline" size="sm">
        Sign In
      </Button>
    </Link>
  );
}
