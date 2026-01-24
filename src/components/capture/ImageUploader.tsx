"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ImageUploaderProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  selectedImage: File | null;
  previewUrl: string | null;
  onClear: () => void;
}

export function ImageUploader({
  onImageSelect,
  selectedImage,
  previewUrl,
  onClear,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        onImageSelect(file, url);
      }
    },
    [onImageSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    onClear();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  if (selectedImage && previewUrl) {
    return (
      <div className="relative">
        <div className="relative aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-muted">
          <Image
            src={previewUrl}
            alt="Selected image"
            fill
            className="object-cover"
          />
        </div>
        <Button
          variant="destructive"
          size="icon-sm"
          className="absolute top-2 right-2"
          onClick={handleClear}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
        `}
      >
        <p className="text-muted-foreground mb-4">
          Drag & drop an image here, or choose an option below
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="size-4" />
            Take Photo
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            Upload Image
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
