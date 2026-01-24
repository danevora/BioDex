"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { DexGrid } from "@/components/DexGrid";
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
  const isLoading = status === "loading";

  const { data: animals = [] } = useAnimals();
  const { data: captures = [] } = useCaptures();
  const { data: stats } = useUserStats();
  const createCapture = useCreateCapture();

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);

  // Build capture map: animalId -> imageUrl
  const captureMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const capture of captures) {
      map.set(capture.animalId, capture.imageUrl);
    }
    return map;
  }, [captures]);

  const handleCapture = async (
    animalId: string,
    image: File,
    confidence?: number
  ) => {
    await createCapture.mutateAsync({ animalId, image, confidence });
    const animal = animals.find((a) => a.id === animalId);
    if (animal) {
      setSelectedAnimal(animal);
    }
  };

  const selectedAnimalUserImage = selectedAnimal
    ? captureMap.get(selectedAnimal.id)
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">BioDex</h1>
            {isAuthenticated && stats ? (
              <p className="text-muted-foreground">
                {stats.captureCount} of {stats.totalAnimals} species captured
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
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <DexGrid
            animals={animals}
            captureMap={captureMap}
            isAuthenticated={isAuthenticated}
            onAnimalClick={setSelectedAnimal}
          />
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

      {selectedAnimal && (
        <AnimalDetail
          animal={selectedAnimal}
          userImage={selectedAnimalUserImage}
          onClose={() => setSelectedAnimal(null)}
        />
      )}
    </div>
  );
}
