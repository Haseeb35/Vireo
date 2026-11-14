"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FriendlyError, safeNext, signInWithEmail } from "@/lib/auth";
import { destinationAfterSignIn } from "@/lib/user-doc";
import { Divider, Field, FormError, GoogleButton, SubmitButton } from "./form-bits";
import { useGoogleSignIn } from "./use-google";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const google = useGoogleSignIn(next, setBusy, setError);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setBusy(true);
    try {
      const user = await signInWithEmail(String(form.get("email")).trim(), String(form.get("password")));
      if (user) router.replace(await destinationAfterSignIn(user.uid, next));
      else setBusy(false);
    } catch (err) {
      setError(err instanceof FriendlyError ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const keepNext = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;

  return (
    <div className="grid gap-5">
      <GoogleButton onClick={google} busy={busy} />
      <Divider />
      <form onSubmit={onSubmit} className="grid gap-4">
        <Field label="Email" id="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        <Field label="Password" id="password" type="password" autoComplete="current-password" required />
        <div className="-mt-1 text-right">
          <Link href="/reset" className="text-sm text-steel underline-offset-4 hover:text-ink hover:underline">
            Forgot password?
          </Link>
        </div>
        <FormError message={error} />
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>
      <p className="text-center text-sm text-steel">
        New to Vireo?{" "}
        <Link href={`/signup${keepNext}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
