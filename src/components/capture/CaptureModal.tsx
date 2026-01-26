"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";
import { ScanningAnimation } from "./ScanningAnimation";
import { RevealAnimation, NoMatchResult } from "./RevealAnimation";
import { identifyAnimal, type IdentifyResult } from "@/lib/api";
import type { Animal } from "@/types/animal";

type CaptureStep = "upload" | "scanning" | "result" | "saving";

interface CaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: Animal[];
  onCapture: (animalId: string, image: File, confidence?: number) => Promise<void>;
}

export function CaptureModal({
  open,
  onOpenChange,
  animals,
  onCapture,
}: CaptureModalProps) {
  const [step, setStep] = useState<CaptureStep>("upload");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [matchedAnimal, setMatchedAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStep("upload");
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setResult(null);
    setMatchedAnimal(null);
    setError(null);
  }, [imagePreviewUrl]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedImage(file);
    setImagePreviewUrl(previewUrl);
  };

  const handleClearImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };

  const handleIdentify = async () => {
    if (!selectedImage) return;

    setStep("scanning");
    setError(null);

    const identifyResult = await identifyAnimal(selectedImage);
    setResult(identifyResult);

    if (identifyResult.success && identifyResult.matched) {
      const animal = animals.find((a) => a.id === identifyResult.animal_id);
      if (animal) {
        setMatchedAnimal(animal);
      }
    }

    setStep("result");
  };

  const handleCapture = async () => {
    if (!result?.success || !result.matched || !selectedImage) return;

    setStep("saving");
    setError(null);

    try {
      const confidence = result.confidence;
      await onCapture(result.animal_id, selectedImage, confidence);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save capture");
      setStep("result");
    }
  };

  const handleTryAgain = () => {
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={step !== "scanning" && step !== "saving"}>
        {step === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle>Discover a Creature</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <ImageUploader
                onImageSelect={handleImageSelect}
                selectedImage={selectedImage}
                previewUrl={imagePreviewUrl}
                onClear={handleClearImage}
              />
              {selectedImage && (
                <Button onClick={handleIdentify} className="w-full">
                  Identify
                </Button>
              )}
            </div>
          </>
        )}

        {step === "scanning" && (
          <div className="py-4">
            <ScanningAnimation />
          </div>
        )}

        {step === "saving" && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Saving your discovery...</p>
          </div>
        )}

        {step === "result" && result && (
          <>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md mb-4">
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={handleCapture}
                >
                  Retry
                </Button>
              </div>
            )}
            {result.success && result.matched && matchedAnimal && selectedImage && imagePreviewUrl ? (
              <RevealAnimation animal={matchedAnimal} imageUrl={imagePreviewUrl} onClose={handleCapture} />
            ) : result.success && !result.matched ? (
              <NoMatchResult
                detectedAnimal={result.detected_animal}
                onTryAgain={handleTryAgain}
              />
            ) : (
              <NoMatchResult
                detectedAnimal={null}
                onTryAgain={handleTryAgain}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
