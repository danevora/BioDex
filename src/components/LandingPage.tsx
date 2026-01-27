"use client";

import Link from "next/link";
import { Camera, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-emerald-800">BioDex</h1>
        <Link href="/auth/signin">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Discover Wildlife Around You
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Photograph animals, identify them, and build your personal
            collection of discoveries. Join a community of Explorers documenting
            the natural world.
          </p>

          <div className="flex justify-center mb-16">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Start Exploring
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-white rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Snap & Discover</h3>
              <p className="text-gray-600">
                Take a photo of any animal you encounter. Our AI instantly
                identifies the species and adds it to your BioDex.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Share & Connect</h3>
              <p className="text-gray-600">
                Share your discoveries with the community. Follow other Explorers
                and see what wildlife they&apos;re finding.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Build Your Collection</h3>
              <p className="text-gray-600">
                Track your progress as you discover more species. Complete your
                BioDex and become a wildlife expert.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>BioDex - Your Personal Wildlife Collection</p>
      </footer>
    </div>
  );
}
