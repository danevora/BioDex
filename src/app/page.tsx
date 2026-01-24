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
  const isAuthLoading = status === "loading";

  const { data: animals = [] } = useAnimals();
  const { data: captures = [], isLoading: isCapturesLoading } = useCaptures();
  const { data: stats } = useUserStats();
  const createCapture = useCreateCapture();

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [newCaptureImageUrl, setNewCaptureImageUrl] = useState<string | null>(null);
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
        {!isAuthLoading && !isAuthenticated && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <p className="text-emerald-800">
              Sign in to start capturing animals and build your collection!
            </p>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <DexGrid
            animals={animals}
            captureMap={captureMap}
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
