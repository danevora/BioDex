"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@/components/providers/OnboardingProvider";

const STEPS = [
  {
    title: "Welcome to BioDex!",
    description:
      "This is your feed. Here you'll see discoveries from Explorers you follow. Like, comment, and get inspired to find new species!",
  },
  {
    title: "Your BioDex",
    description:
      "This is your personal collection. Colorful cards are animals you've discovered. Grayscale cards are still waiting to be found!",
  },
  {
    title: "Discover Animals",
    description:
      "Tap this button to take a photo. We'll identify the species and add it to your BioDex. Get out there and start exploring!",
  },
  {
    title: "Respect Wildlife",
    description:
      "Always respect animals and their habitats. Never disturb, chase, or stress wildlife for a photo. Safety — yours and theirs — always comes first.",
  },
  {
    title: "Get Out There",
    description:
      "Uploading internet photos is allowed, but BioDex was made to encourage going outside and experiencing wildlife firsthand. Your own photos make your BioDex uniquely yours!",
  },
  {
    title: "Early Access",
    description:
      "BioDex is in early development and we'd love your feedback! If you find a bug or have an idea, use the 'Report an Issue' option in the menu (the three-dot button).",
  },
];

export function OnboardingOverlay() {
  const { isOnboarding, currentStep, nextStep } = useOnboarding();
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  // Lock body scroll during onboarding
  useEffect(() => {
    if (isOnboarding) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOnboarding]);

  // Find the capture button for step 3 spotlight
  useEffect(() => {
    if (!isOnboarding || currentStep !== 3) {
      setSpotlightRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector('[data-onboarding="capture-button"]');
      if (el) setSpotlightRect(el.getBoundingClientRect());
    };
    const timer = setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [isOnboarding, currentStep]);

  if (!isOnboarding) return null;

  const step = STEPS[currentStep - 1];
  const isLastStep = currentStep === STEPS.length;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop — spotlight cutout on step 3, plain otherwise */}
      {currentStep === 3 && spotlightRect ? (
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <circle
                cx={spotlightRect.left + spotlightRect.width / 2}
                cy={spotlightRect.top + spotlightRect.height / 2}
                r={spotlightRect.width / 2 + 12}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-black/75" />
      )}

      {/* Content card */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-4">
            {STEPS.map((_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  s === currentStep ? "bg-emerald-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
            {step.title}
          </h2>

          <p className="text-center text-gray-600 mb-6 text-sm leading-relaxed">
            {step.description}
          </p>

          <button
            onClick={nextStep}
            className="w-full bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            {isLastStep ? "Got it!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
