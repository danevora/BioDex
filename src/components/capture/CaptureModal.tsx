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
import { identifyAnimal, submitAnimal, type IdentifyResult } from "@/lib/api";
import { useCreatePost } from "@/hooks/useFeed";
import type { Animal } from "@/types/animal";
import type { Capture } from "@/types/animal";

type CaptureStep = "upload" | "scanning" | "result" | "saving";

interface ShareOptions {
  shareToFeed: boolean;
  caption: string;
}

interface CaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: Animal[];
  onCapture: (animalId: string, image: File, confidence?: number) => Promise<Capture>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedCapture, setSubmittedCapture] = useState<{ id: string; animalId: string; imageUrl: string } | null>(null);
  const [isCorrection, setIsCorrection] = useState(false);

  const createPost = useCreatePost();

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
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmittedCapture(null);
    setIsCorrection(false);
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

  const handleSubmitAnimal = async (speciesName: string) => {
    if (!selectedImage || !result || !result.success || result.matched) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const taxonomicClass = result.taxonomic_class;
    const response = await submitAnimal(speciesName, selectedImage, taxonomicClass);

    if (response.success && response.animal && response.capture) {
      setSubmittedCapture(response.capture);
      setMatchedAnimal({
        id: response.animal.id,
        commonName: response.animal.commonName,
        scientificName: response.animal.scientificName,
        class: response.animal.class,
        order: response.animal.order,
        family: response.animal.family,
        dietaryGroup: response.animal.dietaryGroup,
        habitat: response.animal.habitat,
        regions: response.animal.regions,
        blurb: response.animal.blurb,
        hint: response.animal.hint,
      });
      // Switch result to matched state to trigger RevealAnimation
      setResult({
        success: true,
        matched: true,
        animal_id: response.animal.id,
        confidence: 1.0,
      });
    } else {
      setSubmitError(response.error || "Failed to add animal");
    }

    setIsSubmitting(false);
  };

  const handleCapture = async (shareOptions?: ShareOptions) => {
    if (!result?.success || !result.matched || !selectedImage) return;

    // If capture was already created server-side via submit, skip onCapture
    if (submittedCapture) {
      setStep("saving");
      setError(null);
      try {
        // Create post if sharing to feed
        if (shareOptions?.shareToFeed && submittedCapture.id) {
          try {
            await createPost.mutateAsync({
              captureId: submittedCapture.id,
              caption: shareOptions.caption || undefined,
            });
          } catch {
            console.error("Failed to share to feed, but capture was saved");
          }
        }
        handleOpenChange(false);
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
        setStep("result");
        return;
      }
    }

    setStep("saving");
    setError(null);

    try {
      const confidence = result.confidence;
      const capture = await onCapture(result.animal_id, selectedImage, confidence);

      // Create post if sharing to feed
      if (shareOptions?.shareToFeed && capture?.id) {
        try {
          await createPost.mutateAsync({
            captureId: capture.id,
            caption: shareOptions.caption || undefined,
          });
        } catch {
          // Post creation failed but capture succeeded - don't block closing
          console.error("Failed to share to feed, but capture was saved");
        }
      }

      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save capture");
      setStep("result");
    }
  };

  const handleRejectMatch = () => {
    setResult({
      success: true,
      matched: false,
      detected_animal: matchedAnimal?.commonName || null,
      taxonomic_class: result?.success && result.matched ? result.taxonomic_class : null,
    });
    setMatchedAnimal(null);
    setSubmittedCapture(null);
    setIsCorrection(true);
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
                  onClick={() => handleCapture()}
                >
                  Retry
                </Button>
              </div>
            )}
            {result.success && result.matched && matchedAnimal && selectedImage && imagePreviewUrl ? (
              <RevealAnimation animal={matchedAnimal} imageUrl={imagePreviewUrl} onClose={handleCapture} onReject={handleRejectMatch} />
            ) : result.success && !result.matched ? (
              <NoMatchResult
                detectedAnimal={result.detected_animal}
                onTryAgain={handleTryAgain}
                onSubmitAnimal={handleSubmitAnimal}
                isSubmitting={isSubmitting}
                submitError={submitError}
                isCorrection={isCorrection}
              />
            ) : (
              <NoMatchResult
                detectedAnimal={null}
                onTryAgain={handleTryAgain}
                onSubmitAnimal={handleSubmitAnimal}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
