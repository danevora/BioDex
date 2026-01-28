"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Animal } from "@/types/animal";
import { Check, HelpCircle, EllipsisVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AnimalCardProps {
  animal: Animal;
  isCaptured?: boolean;
  userImage?: string;
  captureId?: string;
  onClick?: () => void;
  onRemoveDiscovery?: (captureId: string) => void;
}

export function AnimalCard({
  animal,
  isCaptured = false,
  userImage,
  captureId,
  onClick,
  onRemoveDiscovery,
}: AnimalCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <Card
      className={`overflow-hidden relative ${isCaptured ? "cursor-pointer transition-transform hover:scale-105" : ""}`}
      onClick={isCaptured ? onClick : undefined}
    >
      <div className="relative aspect-square">
        {isCaptured && userImage ? (
          <Image
            src={userImage}
            alt={animal.commonName}
            fill
            className="object-cover"
            unoptimized={userImage.includes("supabase.co")}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <HelpCircle className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {isCaptured && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1">
            <Check className="h-3 w-3" />
          </div>
        )}
        {isCaptured && captureId && onRemoveDiscovery && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="absolute top-2 left-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <EllipsisVertical className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Discovery
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <CardContent className="p-3">
        {isCaptured ? (
          <>
            <h3 className="font-semibold text-sm truncate">{animal.commonName}</h3>
            <p className="text-xs text-muted-foreground italic truncate">
              {animal.scientificName}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            {animal.hint || "A mysterious creature..."}
          </p>
        )}
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this discovery?</AlertDialogTitle>
            <AlertDialogDescription>
              Your photo and any posts about this animal will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (captureId) {
                  onRemoveDiscovery?.(captureId);
                }
              }}
            >
              Remove Discovery
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
