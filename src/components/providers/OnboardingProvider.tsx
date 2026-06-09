"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
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

  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasActivated, setHasActivated] = useState(false);

  useEffect(() => {
    if (!isLoading && profile && !profile.hasOnboarded && session && !hasActivated) {
      setIsOnboarding(true);
      setCurrentStep(1);
      setHasActivated(true);
    }
  }, [isLoading, profile, session, hasActivated]);

  const nextStep = useCallback(() => {
    if (currentStep < 6) {
      setCurrentStep((s) => s + 1);
    } else {
      completeOnboarding.mutate();
      setIsOnboarding(false);
    }
  }, [currentStep, completeOnboarding]);

  return (
    <OnboardingContext.Provider value={{ isOnboarding, currentStep, nextStep }}>
      {children}
    </OnboardingContext.Provider>
  );
}
