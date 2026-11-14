"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FriendlyError, safeNext, signUpWithEmail } from "@/lib/auth";
import { Divider, Field, FormError, GoogleButton, SubmitButton } from "./form-bits";
import { useGoogleSignIn } from "./use-google";

export function SignupForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const google = useGoogleSignIn(next, setBusy, setError);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));

    if (password !== String(form.get("confirm"))) return setError("The two passwords don't match.");
    if (password.length < 8) return setError("Choose a password with at least 8 characters.");

    setError(null);
    setBusy(true);
    try {
      const user = await signUpWithEmail(name, email, password);
      if (user) router.replace(`/onboarding?next=${encodeURIComponent(next)}`);
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
        <Field label="Your name" id="name" autoComplete="name" required placeholder="What should we call you?" />
        <Field label="Email" id="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        <Field label="Password" id="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
        <Field label="Confirm password" id="confirm" type="password" autoComplete="new-password" required minLength={8} />
        <FormError message={error} />
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
      <p className="text-center text-sm text-steel">
        Already have an account?{" "}
        <Link href={`/login${keepNext}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
