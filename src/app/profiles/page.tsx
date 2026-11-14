import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfilePicker } from "@/components/profiles/profile-picker";

export const metadata: Metadata = { title: "Who's watching?" };

export default function ProfilesPage() {
  return (
    <main className="grid flex-1 place-items-center px-5 pt-28 pb-20">
      {/* Reads ?next= and ?manage= from the URL, known only at request time. */}
      <Suspense>
        <ProfilePicker />
      </Suspense>
    </main>
  );
}
