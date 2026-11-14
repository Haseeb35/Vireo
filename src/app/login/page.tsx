import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to pick up where you left off.">
      {/* The form reads ?next= from the URL, which is only known at request time. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
