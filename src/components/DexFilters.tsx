"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

// Map taxonomic class names to user-friendly labels
const CLASS_LABELS: Record<string, string> = {
  Mammalia: "Mammals",
  Aves: "Birds",
  Reptilia: "Reptiles",
  Amphibia: "Amphibians",
  Actinopterygii: "Fish",
  Insecta: "Insects",
  Arachnida: "Arachnids",
  Malacostraca: "Crustaceans",
  Gastropoda: "Snails & Slugs",
  Cephalopoda: "Cephalopods",
  Bivalvia: "Bivalves",
  Merostomata: "Horseshoe Crabs",
};

function getClassLabel(className: string): string {
  return CLASS_LABELS[className] || className;
}

export type CaptureStatus = "all" | "captured" | "undiscovered";

interface DexFiltersProps {
  availableClasses: string[];
  selectedClasses: Set<string>;
  onClassChange: (classes: Set<string>) => void;
  classCounts: Map<string, number>;
  captureStatus: CaptureStatus;
  onCaptureStatusChange: (status: CaptureStatus) => void;
  showCaptureFilter: boolean;
}

export function DexFilters({
  availableClasses,
  selectedClasses,
  onClassChange,
  classCounts,
  captureStatus,
  onCaptureStatusChange,
  showCaptureFilter,
}: DexFiltersProps) {
  const allSelected = selectedClasses.size === availableClasses.length;
  const noneSelected = selectedClasses.size === 0;

  const selectAll = () => {
    onClassChange(new Set(availableClasses));
  };

  const selectNone = () => {
    onClassChange(new Set());
  };

  const toggleClass = (cls: string) => {
    const newSet = new Set(selectedClasses);
    if (newSet.has(cls)) {
      newSet.delete(cls);
    } else {
      newSet.add(cls);
    }
    onClassChange(newSet);
  };

  const getClassFilterLabel = () => {
    if (allSelected) return "All Classes";
    if (noneSelected) return "No Classes";
    if (selectedClasses.size === 1) {
      const cls = Array.from(selectedClasses)[0];
      return getClassLabel(cls);
    }
    return `${selectedClasses.size} Classes`;
  };

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
      {/* Class Filter - Left side */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[140px] justify-between">
            {getClassFilterLabel()}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          {/* All/None row */}
          <div className="flex gap-2 pb-2 border-b mb-2">
            <Button
              size="sm"
              variant={allSelected ? "default" : "ghost"}
              onClick={selectAll}
              className="flex-1"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={noneSelected ? "default" : "ghost"}
              onClick={selectNone}
              className="flex-1"
            >
              None
            </Button>
          </div>
          {/* Class checkboxes */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableClasses.map((cls) => (
              <label
                key={cls}
                className="flex items-center gap-2 py-1 cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1"
              >
                <Checkbox
                  checked={selectedClasses.has(cls)}
                  onCheckedChange={() => toggleClass(cls)}
                />
                <span className="flex-1 text-sm">{getClassLabel(cls)}</span>
                <span className="text-xs text-muted-foreground">
                  ({classCounts.get(cls) || 0})
                </span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Capture Status - Right side */}
      {showCaptureFilter && (
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => onCaptureStatusChange("all")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              captureStatus === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onCaptureStatusChange("captured")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors border-l ${
              captureStatus === "captured"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent"
            }`}
          >
            Discovered
          </button>
          <button
            onClick={() => onCaptureStatusChange("undiscovered")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors border-l ${
              captureStatus === "undiscovered"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent"
            }`}
          >
            Undiscovered
          </button>
        </div>
      )}
    </div>
  );
}
