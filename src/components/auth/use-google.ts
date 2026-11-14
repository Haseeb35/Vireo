"use client";

import { useRouter } from "next/navigation";
import { FriendlyError, signInWithGoogle } from "@/lib/auth";
import { destinationAfterSignIn } from "@/lib/user-doc";

/** Shared Google sign-in handler for the sign-in and sign-up forms. */
export function useGoogleSignIn(next: string, setBusy: (b: boolean) => void, setError: (e: string | null) => void) {
  const router = useRouter();
  return async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      if (!result) return setBusy(false); // pop-up closed
      const dest = result.isNew
        ? `/onboarding?next=${encodeURIComponent(next)}`
        : await destinationAfterSignIn(result.user.uid, next);
      router.replace(dest);
    } catch (err) {
      setError(err instanceof FriendlyError ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  };
}
