"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaptureButtonProps {
  onClick: () => void;
}

export function CaptureButton({ onClick }: CaptureButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon-lg"
      className="fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
    >
      <Camera className="size-6" />
      <span className="sr-only">Discover animal</span>
    </Button>
  );
}
