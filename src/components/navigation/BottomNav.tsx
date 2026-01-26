"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Activity, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: "/feed",
    label: "Feed",
    icon: Activity,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
];

export function BottomNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Only show when authenticated
  if (status === "loading" || !session?.user) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:relative md:border-t-0 md:border-b">
      <div className="container mx-auto">
        <div className="flex items-center justify-around md:justify-start md:gap-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 px-6 min-h-[56px] min-w-[80px] transition-colors",
                  "md:flex-row md:gap-2 md:py-2 md:px-4 md:min-h-0 md:min-w-0 md:rounded-md",
                  isActive
                    ? "text-emerald-600"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 md:h-5 md:w-5",
                    isActive && "text-emerald-600"
                  )}
                />
                <span
                  className={cn(
                    "text-xs md:text-sm font-medium",
                    isActive && "text-emerald-600"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
