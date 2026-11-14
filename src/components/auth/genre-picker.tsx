"use client";

import { FirebaseError } from "firebase/app";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GenreChips } from "@/components/profiles/genre-chips";
import { useProfiles } from "@/components/profiles/profile-provider";
import { safeNext } from "@/lib/auth";
import { ensureMainProfile, MAIN_PROFILE_ID } from "@/lib/profiles";
import { saveGenres } from "@/lib/user-doc";
import { useAuth } from "./auth-provider";
import { FormError } from "./form-bits";

const MIN = 3;

export function GenrePicker() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { user, loading } = useAuth();
  const { setActive } = useProfiles();
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding is only for signed-in users.
  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent("/onboarding")}`);
  }, [loading, user, router]);

  async function save() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await saveGenres(user.uid, picked);
      // The account's first profile gets the same name and genres.
      await ensureMainProfile(user.uid, {
        name: user.displayName || user.email?.split("@")[0] || "Me",
        genres: picked,
      });
      setActive(MAIN_PROFILE_ID);
      router.replace(next);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "unknown";
      console.error("[onboarding] saving genres failed:", err);
      setError(
        code === "permission-denied"
          ? "The database refused to save. Publish the Firestore security rules (Firestore → Rules → Publish), then try again."
          : code === "unavailable"
            ? "Couldn't reach the database. Check your internet connection and try again."
            : `Couldn't save your picks (${code}). Please try again.`,
      );
      setBusy(false);
    }
  }

  const remaining = Math.max(0, MIN - picked.length);

  return (
    <div className="grid gap-6">
      <GenreChips value={picked} onChange={setPicked} />

      <FormError message={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-steel" aria-live="polite">
          {remaining > 0 ? `PICK ${remaining} MORE` : `${picked.length} PICKED`}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={remaining > 0 || busy || !user}
          className="h-11 rounded-md bg-ink px-7 text-[15px] font-bold text-black transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
