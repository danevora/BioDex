"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Activity, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExplorerSearch } from "@/components/feed";

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

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              data-onboarding={`nav-${item.label.toLowerCase()}`}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 px-6 min-h-[56px] min-w-[80px] transition-colors",
                isActive
                  ? "text-emerald-600"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  isActive && "text-emerald-600"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive && "text-emerald-600"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <div className="flex items-center gap-1">
            <Link href="/feed" className="text-xl font-bold text-emerald-600 mr-2">
              BioDex
            </Link>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-onboarding={`nav-${item.label.toLowerCase()}`}
                  className={cn(
                    "flex items-center gap-2 py-2 px-4 rounded-md transition-colors",
                    isActive
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ExplorerSearch />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 py-2 px-4 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function BottomNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Only show when authenticated
  if (status === "loading" || !session?.user) {
    return null;
  }

  return (
    <>
      <MobileNav pathname={pathname} />
      <DesktopNav pathname={pathname} />
    </>
  );
}
