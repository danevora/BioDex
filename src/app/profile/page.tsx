"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { DexGrid } from "@/components/DexGrid";
import { DexFilters, CaptureStatus } from "@/components/DexFilters";
import { AnimalDetail } from "@/components/AnimalDetail";
import { CaptureButton, CaptureModal } from "@/components/capture";
import { ExplorerBadge, ProfileEditModal } from "@/components/profile";
import { MobileMenuButton } from "@/components/navigation/BottomNav";
import { ExplorerSearch } from "@/components/feed";
import { useAnimals } from "@/hooks/useAnimals";
import { useCaptures, useCreateCapture } from "@/hooks/useCaptures";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Animal } from "@/types/animal";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const isAuthLoading = status === "loading";

  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { data: animals = [] } = useAnimals();
  const { data: captures = [], isLoading: isCapturesLoading, refetch: refetchCaptures } = useCaptures();
  const createCapture = useCreateCapture();

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [newCaptureImageUrl, setNewCaptureImageUrl] = useState<string | null>(null);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  // null means "all classes selected" (initial state before user interaction)
  const [selectedClasses, setSelectedClasses] = useState<Set<string> | null>(null);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("all");

  // Redirect to signin if not authenticated
  if (!isAuthLoading && !session?.user) {
    redirect("/auth/signin");
  }

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

      // Capture status filter
      const isCaptured = captureMap.has(animal.id);
      if (captureStatus === "captured" && !isCaptured) return false;
      if (captureStatus === "undiscovered" && isCaptured) return false;

      return true;
    });

    // Sort discovered animals first
    return filtered.sort((a, b) => {
      const aCaptured = captureMap.has(a.id);
      const bCaptured = captureMap.has(b.id);
      if (aCaptured && !bCaptured) return -1;
      if (!aCaptured && bCaptured) return 1;
      return a.commonName.localeCompare(b.commonName);
    });
  }, [animals, effectiveSelectedClasses, captureStatus, captureMap]);

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
    return capture;
  };

  const handleCloseDetail = async () => {
    if (newCaptureImageUrl) {
      await refetchCaptures();
    }
    setSelectedAnimal(null);
    setNewCaptureImageUrl(null);
  };

  const handleEditProfile = () => {
    setEditModalOpen(true);
  };

  // Use new capture URL if available, otherwise fall back to capture map
  const selectedAnimalUserImage = selectedAnimal
    ? newCaptureImageUrl || captureMap.get(selectedAnimal.id)
    : undefined;

  const isLoading = isAuthLoading || isProfileLoading || isCapturesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-muted-foreground">Failed to load profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
      <header className="border-b sticky top-0 bg-background z-10 md:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold">Your BioDex</h1>
            <div className="flex items-center gap-2">
              <ExplorerSearch />
              <MobileMenuButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Explorer Badge */}
        <ExplorerBadge
          profile={profile}
          showEditButton={true}
          onEditClick={handleEditProfile}
        />

        {/* BioDex Section */}
        <section>

          {/* Filters */}
          {animals.length > 0 && (
            <DexFilters
              availableClasses={availableClasses}
              selectedClasses={effectiveSelectedClasses}
              onClassChange={setSelectedClasses}
              classCounts={classCounts}
              captureStatus={captureStatus}
              onCaptureStatusChange={setCaptureStatus}
              showCaptureFilter={true}
            />
          )}

          {/* Animal Grid */}
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
        </section>


      </main>

      {/* Capture Button & Modal */}
      <CaptureButton onClick={() => setCaptureModalOpen(true)} />
      <CaptureModal
        open={captureModalOpen}
        onOpenChange={setCaptureModalOpen}
        animals={animals}
        onCapture={handleCapture}
      />

      {/* Animal Detail Modal */}
      {selectedAnimal && selectedAnimalUserImage && (
        <AnimalDetail
          animal={selectedAnimal}
          userImage={selectedAnimalUserImage}
          onClose={handleCloseDetail}
        />
      )}

      {/* Edit Profile Modal */}
      <ProfileEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={profile}
      />
    </div>
  );
}
