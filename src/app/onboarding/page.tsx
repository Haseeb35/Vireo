import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { GenrePicker } from "@/components/auth/genre-picker";

export const metadata: Metadata = { title: "Your genres" };

export default function Page() {
  return (
    <AuthShell title="What do you like to watch?" subtitle="Pick at least 3 genres. We'll use them to fill your home page." wide>
      {/* The form reads ?next= from the URL, which is only known at request time. */}
      <Suspense>
        <GenrePicker />
      </Suspense>
    </AuthShell>
  );
}
