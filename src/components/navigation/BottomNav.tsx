"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, LogOut, EllipsisVertical, Flag, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: "/profile",
    label: "BioDex",
    icon: BookOpen,
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
            <Link href="/profile" className="mr-2">
              <Image src="/icon.png" alt="BioDex" width={36} height={36} />
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
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center h-10 w-10 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted">
                  <EllipsisVertical className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1">
                <Link
                  href="/report"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted"
                >
                  <Flag className="h-4 w-4" />
                  Report an Issue
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function MobileMenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center justify-center h-10 w-10 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl pb-8">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex flex-col gap-1 pt-2">
          <Link
            href="/report"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition-colors hover:bg-muted"
          >
            <Flag className="h-5 w-5" />
            Report an Issue
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition-colors hover:bg-muted text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>
      </SheetContent>
    </Sheet>
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
