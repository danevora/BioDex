"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { DexGrid } from "@/components/DexGrid";
import { DexFilters, CaptureStatus } from "@/components/DexFilters";
import { AnimalDetail } from "@/components/AnimalDetail";
import { CaptureButton, CaptureModal } from "@/components/capture";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAnimals } from "@/hooks/useAnimals";
import { useCaptures, useCreateCapture } from "@/hooks/useCaptures";
import { useUserStats } from "@/hooks/useUserStats";
import { Animal } from "@/types/animal";

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const isAuthLoading = status === "loading";

  const { data: animals = [] } = useAnimals();
  const { data: captures = [], isLoading: isCapturesLoading } = useCaptures();
  const { data: stats } = useUserStats();
  const createCapture = useCreateCapture();

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [newCaptureImageUrl, setNewCaptureImageUrl] = useState<string | null>(null);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  // null means "all classes selected" (initial state before user interaction)
  const [selectedClasses, setSelectedClasses] = useState<Set<string> | null>(null);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("all");

  // Compute available classes from animals
  const availableClasses = useMemo(() => {
    const classes = new Set(animals.map((a) => a.class));
    return Array.from(classes).sort();
  }, [animals]);

  // Compute counts per class
  const classCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const animal of animals) {
      counts.set(animal.class, (counts.get(animal.class) || 0) + 1);
    }
    return counts;
  }, [animals]);

  // Effective selected classes: null means all classes are selected
  const effectiveSelectedClasses = useMemo(() => {
    return selectedClasses ?? new Set(availableClasses);
  }, [selectedClasses, availableClasses]);

  // Build capture map: animalId -> imageUrl
  const captureMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const capture of captures) {
      map.set(capture.animalId, capture.imageUrl);
    }
    return map;
  }, [captures]);

  // Filter animals based on selected classes and capture status
  const filteredAnimals = useMemo(() => {
    const filtered = animals.filter((animal) => {
      // Class filter
      if (!effectiveSelectedClasses.has(animal.class)) return false;

      // Capture status filter (only for authenticated users)
      if (isAuthenticated) {
        const isCaptured = captureMap.has(animal.id);
        if (captureStatus === "captured" && !isCaptured) return false;
        if (captureStatus === "undiscovered" && isCaptured) return false;
      }

      return true;
    });

    // Sort captured animals first (only for authenticated users)
    if (isAuthenticated) {
      return filtered.sort((a, b) => {
        const aCaptured = captureMap.has(a.id);
        const bCaptured = captureMap.has(b.id);
        if (aCaptured && !bCaptured) return -1;
        if (!aCaptured && bCaptured) return 1;
        return a.commonName.localeCompare(b.commonName);
      });
    }
    return filtered;
  }, [animals, effectiveSelectedClasses, captureStatus, captureMap, isAuthenticated]);

  const handleCapture = async (
    animalId: string,
    image: File,
    confidence?: number
  ) => {
    const capture = await createCapture.mutateAsync({ animalId, image, confidence });
    const animal = animals.find((a) => a.id === animalId);
    if (animal) {
      setNewCaptureImageUrl(capture.imageUrl);
      setSelectedAnimal(animal);
    }
  };

  const handleCloseDetail = () => {
    setSelectedAnimal(null);
    setNewCaptureImageUrl(null);
  };

  // Use new capture URL if available, otherwise fall back to capture map
  const selectedAnimalUserImage = selectedAnimal
    ? newCaptureImageUrl || captureMap.get(selectedAnimal.id)
    : undefined;

  const isLoading = isAuthLoading || (isAuthenticated && isCapturesLoading);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">BioDex</h1>
            {isAuthenticated && stats ? (
              <p className="text-muted-foreground">
                {stats.captureCount} of {stats.totalAnimals} species discovered
              </p>
            ) : (
              <p className="text-muted-foreground">
                {animals.length} species to discover
              </p>
            )}
          </div>
          <AuthButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!isAuthLoading && !isAuthenticated && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <p className="text-emerald-800">
              Sign in to start discovering animals and build your collection!
            </p>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {animals.length > 0 && (
              <DexFilters
                availableClasses={availableClasses}
                selectedClasses={effectiveSelectedClasses}
                onClassChange={setSelectedClasses}
                classCounts={classCounts}
                captureStatus={captureStatus}
                onCaptureStatusChange={setCaptureStatus}
                showCaptureFilter={isAuthenticated}
              />
            )}
            {filteredAnimals.length > 0 ? (
              <DexGrid
                animals={filteredAnimals}
                captureMap={captureMap}
                onAnimalClick={setSelectedAnimal}
              />
            ) : (
              <div className="flex justify-center py-12">
                <p className="text-muted-foreground">
                  No animals match your filters
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {isAuthenticated && (
        <>
          <CaptureButton onClick={() => setCaptureModalOpen(true)} />
          <CaptureModal
            open={captureModalOpen}
            onOpenChange={setCaptureModalOpen}
            animals={animals}
            onCapture={handleCapture}
          />
        </>
      )}

      {selectedAnimal && selectedAnimalUserImage && (
        <AnimalDetail
          animal={selectedAnimal}
          userImage={selectedAnimalUserImage}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
