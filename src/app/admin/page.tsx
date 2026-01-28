"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AnimalRow {
  id: string;
  commonName: string;
  scientificName: string;
  class: string;
  isUserSubmitted: boolean;
  createdAt: string;
  _count: { captures: number };
}

const TAXONOMIC_CLASSES = [
  "Mammalia",
  "Aves",
  "Reptilia",
  "Amphibia",
  "Actinopterygii",
  "Insecta",
  "Arachnida",
  "Malacostraca",
  "Gastropoda",
  "Cephalopoda",
  "Bivalvia",
  "Merostomata",
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const [tab, setTab] = useState<"all" | "review">("all");
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [classFilter, setClassFilter] = useState("");
  const [sort, setSort] = useState<"name" | "date">("name");
  const [error, setError] = useState<string | null>(null);

  // Check sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_password");
    if (stored) {
      setPassword(stored);
      setAuthenticated(true);
    }
  }, []);

  const fetchAnimals = useCallback(async () => {
    if (!password) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (classFilter) params.set("class", classFilter);
    params.set("sort", sort);
    if (tab === "review") params.set("review", "true");

    try {
      const res = await fetch(`/api/admin/animals?${params}`, {
        headers: { "x-admin-password": password },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false);
          setPassword("");
          sessionStorage.removeItem("admin_password");
          setError("Invalid password");
          return;
        }
        throw new Error("Failed to fetch");
      }

      const data = await res.json();
      setAnimals(data.animals);
    } catch {
      setError("Failed to load animals");
    } finally {
      setLoading(false);
    }
  }, [password, classFilter, sort, tab]);

  useEffect(() => {
    if (authenticated) {
      fetchAnimals();
    }
  }, [authenticated, fetchAnimals]);

  const handleLogin = () => {
    if (passwordInput.trim()) {
      setPassword(passwordInput.trim());
      sessionStorage.setItem("admin_password", passwordInput.trim());
      setAuthenticated(true);
    }
  };

  const handleDelete = async (animalId: string, confirmMessage: string) => {
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/animals/${animalId}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });

      if (!res.ok) throw new Error("Failed to delete");

      setAnimals((prev) => prev.filter((a) => a.id !== animalId));
    } catch {
      alert("Failed to delete animal");
    }
  };

  const handleReject = (animalId: string) => {
    handleDelete(animalId, "Reject this animal? This will delete it and all associated captures, posts, and images.");
  };

  const handleAccept = (animalId: string) => {
    // Animal is already active - just remove from review queue view
    setAnimals((prev) => prev.filter((a) => a.id !== animalId));
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 p-6">
          <h1 className="text-2xl font-bold text-center">Admin Access</h1>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Input
            type="password"
            placeholder="Enter admin password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
          />
          <Button onClick={handleLogin} className="w-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">BioDex Admin</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === "all" ? "default" : "outline"}
            onClick={() => setTab("all")}
          >
            All Animals
          </Button>
          <Button
            variant={tab === "review" ? "default" : "outline"}
            onClick={() => setTab("review")}
          >
            Review Queue
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={classFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {TAXONOMIC_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={sort}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as "name" | "date")}
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date Added</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : animals.length === 0 ? (
          <p className="text-muted-foreground">No animals found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Common Name</th>
                  <th className="py-2 pr-4 font-medium">Scientific Name</th>
                  <th className="py-2 pr-4 font-medium">Class</th>
                  <th className="py-2 pr-4 font-medium">Captures</th>
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {animals.map((animal) => (
                  <tr key={animal.id} className="border-b">
                    <td className="py-2 pr-4">{animal.commonName}</td>
                    <td className="py-2 pr-4 italic text-muted-foreground">
                      {animal.scientificName}
                    </td>
                    <td className="py-2 pr-4">{animal.class}</td>
                    <td className="py-2 pr-4">{animal._count.captures}</td>
                    <td className="py-2 pr-4">
                      {animal.isUserSubmitted ? (
                        <span className="text-amber-600 font-medium">User</span>
                      ) : (
                        <span className="text-muted-foreground">Seeded</span>
                      )}
                    </td>
                    <td className="py-2 space-x-2">
                      {tab === "review" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAccept(animal.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(animal.id)}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(animal.id, "Delete this animal? This will delete it and all associated captures, posts, and images.")}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
