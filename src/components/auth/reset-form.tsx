"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FriendlyError, sendReset } from "@/lib/auth";
import { Field, FormError, SubmitButton } from "./form-bits";

export function ResetForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setError(null);
    setBusy(true);
    try {
      await sendReset(email);
      setSentTo(email);
    } catch (err) {
      setError(err instanceof FriendlyError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className="grid gap-4">
        <p className="text-[15px] text-ink/90">
          If an account exists for <strong className="font-semibold text-ink">{sentTo}</strong>, a reset link is on its
          way. Check your inbox and spam folder.
        </p>
        <Link href="/login" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field label="Email" id="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      <FormError message={error} />
      <SubmitButton busy={busy}>Send reset link</SubmitButton>
      <Link href="/login" className="text-center text-sm text-steel underline-offset-4 hover:text-ink hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
