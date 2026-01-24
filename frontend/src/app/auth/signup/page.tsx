"use client";

import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">BioDex</h1>
          <h2 className="mt-2 text-xl text-gray-600">Create your account</h2>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <SignUpForm />

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
