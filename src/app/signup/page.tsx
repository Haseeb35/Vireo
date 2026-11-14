import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function Page() {
  return (
    <AuthShell title="Create your account" subtitle="Free, and it only takes a minute.">
      {/* The form reads ?next= from the URL, which is only known at request time. */}
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
