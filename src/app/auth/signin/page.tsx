"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SignInForm } from "@/components/auth/SignInForm";

function RegistrationBanner() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  if (!registered) return null;

  return (
    <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-md text-center">
      Account created successfully! Please sign in.
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">BioDex</h1>
          <h2 className="mt-2 text-xl text-gray-600">Sign in to your account</h2>
        </div>

        <Suspense fallback={null}>
          <RegistrationBanner />
        </Suspense>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <SignInForm />

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
