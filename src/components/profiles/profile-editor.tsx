"use client";

import { FirebaseError } from "firebase/app";
import { useState, type FormEvent } from "react";
import { Field, FormError } from "@/components/auth/form-bits";
import { AVATAR_COLORS, createProfile, deleteProfileDoc, updateProfileDoc, type Profile } from "@/lib/profiles";
import { GenreChips } from "./genre-chips";
import { ProfileAvatar } from "./profile-avatar";

interface Props {
  uid: string;
  profile: Profile | null; // null = creating a new one
  canDelete: boolean;
  usedColors: number[];
  onDone: (createdId?: string) => void;
}

export function ProfileEditor({ uid, profile, canDelete, usedColors, onDone }: Props) {
  const [name, setName] = useState(profile?.name ?? "");
  // New profiles start on the first colour nobody else is using.
  const [color, setColor] = useState(
    profile?.color ?? Math.max(0, AVATAR_COLORS.findIndex((_, i) => !usedColors.includes(i))),
  );
  const [genres, setGenres] = useState<number[]>(profile?.genres ?? []);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fail = (err: unknown) => {
    console.error("[profiles]", err);
    setError(
      err instanceof FirebaseError && err.code === "permission-denied"
        ? "The database refused the change. Check that the Firestore rules are published."
        : "Couldn't save. Check your connection and try again.",
    );
    setBusy(false);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Give the profile a name.");
    setBusy(true);
    setError(null);
    try {
      const input = { name: trimmed, color, genres };
      if (profile) {
        await updateProfileDoc(uid, profile.id, input);
        onDone();
      } else {
        onDone(await createProfile(uid, input));
      }
    } catch (err) {
      fail(err);
    }
  }

  async function onDelete() {
    if (!profile) return;
    setBusy(true);
    try {
      await deleteProfileDoc(uid, profile.id);
      onDone();
    } catch (err) {
      fail(err);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto grid w-full max-w-[620px] gap-7">
      <h1 className="text-center text-4xl font-extrabold tracking-[-0.03em]">{profile ? "Edit profile" : "Add profile"}</h1>

      <div className="flex items-center gap-5">
        <ProfileAvatar name={name || "?"} color={color} className="size-24 rounded-xl text-4xl" />
        <div className="grid flex-1 gap-3">
          <Field
            label="Name"
            id="profile-name"
            value={name}
            maxLength={20}
            autoComplete="off"
            required
            autoFocus={!profile}
            onChange={(e) => setName(e.target.value)}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink/90">Colour</legend>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(i)}
                  aria-label={`Colour ${i + 1}`}
                  aria-pressed={color === i}
                  style={{ background: c }}
                  className={`size-8 rounded-md transition ${color === i ? "ring-2 ring-ink ring-offset-2 ring-offset-screen" : "opacity-80 hover:opacity-100"}`}
                />
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-medium text-ink/90">
          Favourite genres <span className="text-steel">· used for &ldquo;Because you like&rdquo; rows</span>
        </p>
        <GenreChips value={genres} onChange={setGenres} />
      </div>

      <FormError message={error} />

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-md bg-ink px-7 text-[15px] font-bold text-black transition hover:bg-ink/85 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => onDone()}
          className="h-11 rounded-md px-5 text-[15px] font-semibold text-ink ring-1 ring-line transition hover:ring-steel"
        >
          Cancel
        </button>

        {profile && canDelete && (
          <div className="ml-auto flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-sm text-steel">Delete {profile.name}?</span>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={busy}
                  className="h-9 rounded-md bg-red-500/90 px-4 text-sm font-bold text-white transition hover:bg-red-500"
                >
                  Delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="h-9 px-3 text-sm text-steel hover:text-ink">
                  Keep
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="h-9 px-3 text-sm font-semibold text-red-300 transition hover:text-red-200"
              >
                Delete profile
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
