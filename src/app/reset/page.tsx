import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a link to choose a new one.">
      {/* The form reads ?next= from the URL, which is only known at request time. */}
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
