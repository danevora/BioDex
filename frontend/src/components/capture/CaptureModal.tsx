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

type CaptureStep = "upload" | "scanning" | "result";

interface CaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: Animal[];
  onCapture: (animalId: string) => void;
}

export function CaptureModal({
  open,
  onOpenChange,
  animals,
  onCapture,
}: CaptureModalProps) {
  const [step, setStep] = useState<CaptureStep>("upload");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [matchedAnimal, setMatchedAnimal] = useState<Animal | null>(null);

  const resetState = useCallback(() => {
    setStep("upload");
    setSelectedImage(null);
    setResult(null);
    setMatchedAnimal(null);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
  };

  const handleIdentify = async () => {
    if (!selectedImage) return;

    setStep("scanning");

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

  const handleCapture = () => {
    if (result?.success && result.matched) {
      onCapture(result.animal_id);
    }
    handleOpenChange(false);
  };

  const handleTryAgain = () => {
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={step !== "scanning"}>
        {step === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle>Capture a Creature</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <ImageUploader
                onImageSelect={handleImageSelect}
                selectedImage={selectedImage}
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

        {step === "result" && result && (
          <>
            {result.success && result.matched && matchedAnimal ? (
              <RevealAnimation animal={matchedAnimal} onClose={handleCapture} />
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
