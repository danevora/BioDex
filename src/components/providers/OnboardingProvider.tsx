"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserProfile, useCompleteOnboarding } from "@/hooks/useUserProfile";
import { useSession } from "next-auth/react";

interface OnboardingContextValue {
  isOnboarding: boolean;
  currentStep: number;
  nextStep: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  isOnboarding: false,
  currentStep: 1,
  nextStep: () => {},
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useUserProfile();
  const { data: session } = useSession();
  const completeOnboarding = useCompleteOnboarding();
  const router = useRouter();
  const pathname = usePathname();

  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasActivated, setHasActivated] = useState(false);

  // Activate onboarding when profile loads with hasOnboarded === false
  useEffect(() => {
    if (!isLoading && profile && !profile.hasOnboarded && session && !hasActivated) {
      setIsOnboarding(true);
      setCurrentStep(1);
      setHasActivated(true);
      if (pathname !== "/feed") {
        router.push("/feed");
      }
    }
  }, [isLoading, profile, session, hasActivated, pathname, router]);

  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      setCurrentStep(2);
      router.push("/profile");
    } else if (currentStep === 2) {
      setCurrentStep(3);
      // Stay on profile page — capture button is visible here
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else if (currentStep === 5) {
      setCurrentStep(6);
    } else if (currentStep === 6) {
      completeOnboarding.mutate();
      setIsOnboarding(false);
    }
  }, [currentStep, router, completeOnboarding]);

  return (
    <OnboardingContext.Provider value={{ isOnboarding, currentStep, nextStep }}>
      {children}
    </OnboardingContext.Provider>
  );
}
