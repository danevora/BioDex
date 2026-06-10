"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Leaf, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePostHog } from "posthog-js/react";

const ANIMAL_CLASSES = [
  "Mammalia",
  "Aves",
  "Reptilia",
  "Amphibia",
  "Actinopterygii",
  "Chondrichthyes",
  "Insecta",
  "Arachnida",
  "Other",
] as const;
type AnimalClass = (typeof ANIMAL_CLASSES)[number];

export default function SubmitAnimalPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [commonName, setCommonName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [animalClass, setAnimalClass] = useState<AnimalClass>("Mammalia");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    posthog?.capture("animal_suggestion_form_opened");
  }, [posthog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submit-animal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commonName: commonName.trim(),
          scientificName: scientificName.trim(),
          class: animalClass,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit suggestion");
      }

      posthog?.capture("animal_suggestion_submitted", {
        common_name: commonName.trim(),
        scientific_name: scientificName.trim(),
        class: animalClass,
        has_notes: notes.trim().length > 0,
      });

      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      posthog?.capture("animal_suggestion_failed", { error: message });
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
          <h1 className="text-xl font-semibold">Suggestion Submitted</h1>
          <p className="text-muted-foreground">
            Thanks! We&apos;ll review your suggestion and consider adding it to the BioDex.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-6 md:pt-20 max-w-lg mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center gap-2 mb-6">
        <Leaf className="h-5 w-5 text-emerald-600" />
        <h1 className="text-xl font-semibold">Submit an Animal</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="commonName" className="block text-sm font-medium mb-1">
            Common Name
          </label>
          <input
            id="commonName"
            type="text"
            value={commonName}
            onChange={(e) => setCommonName(e.target.value)}
            disabled={isSubmitting}
            maxLength={100}
            required
            placeholder="e.g. Red Fox"
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="scientificName" className="block text-sm font-medium mb-1">
            Scientific Name
          </label>
          <input
            id="scientificName"
            type="text"
            value={scientificName}
            onChange={(e) => setScientificName(e.target.value)}
            disabled={isSubmitting}
            maxLength={100}
            required
            placeholder="e.g. Vulpes vulpes"
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="animalClass" className="block text-sm font-medium mb-1">
            Class
          </label>
          <select
            id="animalClass"
            value={animalClass}
            onChange={(e) => setAnimalClass(e.target.value as AnimalClass)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ANIMAL_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            maxLength={500}
            rows={4}
            placeholder="Any additional context, where you encountered it, why it should be added..."
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {notes.length}/500
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || !commonName.trim() || !scientificName.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Suggestion"
          )}
        </Button>
      </form>
    </div>
  );
}
