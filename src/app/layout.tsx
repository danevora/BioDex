import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { BottomNav } from "@/components/navigation";
import { OnboardingProvider } from "@/components/providers/OnboardingProvider";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BioDex",
  description: "Discover and collect real-world animals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>
          <SessionProvider>
            <QueryProvider>
              <OnboardingProvider>
                {children}
                <BottomNav />
                <OnboardingOverlay />
              </OnboardingProvider>
            </QueryProvider>
          </SessionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
