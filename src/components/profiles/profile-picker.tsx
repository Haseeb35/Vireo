"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { endAmbientPreview, previewAmbient } from "@/lib/ambient";
import { safeNext } from "@/lib/auth";
import { AVATAR_COLORS, MAX_PROFILES, type Profile } from "@/lib/profiles";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileEditor } from "./profile-editor";
import { useProfiles } from "./profile-provider";

type Editing = { kind: "new" } | { kind: "edit"; profile: Profile } | null;

/** "Who's watching?" — pick, add, edit and delete profiles. */
export function ProfilePicker() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { user, loading } = useAuth();
  const { profiles, active, setActive } = useProfiles();
  const [managing, setManaging] = useState(params.get("manage") === "1");
  const [editing, setEditing] = useState<Editing>(null);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent("/profiles")}`);
  }, [loading, user, router]);

  // Restore the page colour when leaving this screen.
  useEffect(() => endAmbientPreview, []);

  if (!user || profiles === null) {
    return (
      <div className="flex justify-center gap-6" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="size-28 animate-pulse rounded-xl bg-raised md:size-36" />
        ))}
      </div>
    );
  }

  if (editing) {
    return (
      <ProfileEditor
        uid={user.uid}
        profile={editing.kind === "edit" ? editing.profile : null}
        canDelete={profiles.length > 1}
        usedColors={profiles.map((p) => p.color)}
        onDone={(createdId) => {
          setEditing(null);
          if (createdId) setActive(createdId);
        }}
      />
    );
  }

  const choose = (p: Profile) => {
    if (managing) return setEditing({ kind: "edit", profile: p });
    setActive(p.id);
    router.replace(next);
  };

  return (
    <div className="grid justify-items-center gap-10">
      <h1 className="text-center text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
        {managing ? "Manage profiles" : "Who’s watching?"}
      </h1>

      <ul className="flex flex-wrap justify-center gap-5 md:gap-8">
        {profiles.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => choose(p)}
              onMouseEnter={() => previewAmbient(AVATAR_COLORS[p.color % AVATAR_COLORS.length])}
              onFocus={() => previewAmbient(AVATAR_COLORS[p.color % AVATAR_COLORS.length])}
              aria-label={managing ? `Edit ${p.name}` : `Watch as ${p.name}`}
              className="group grid w-28 justify-items-center gap-3 md:w-36"
            >
              <span className="relative transition-transform duration-300 ease-projector group-hover:scale-105 group-focus-visible:scale-105">
                <ProfileAvatar name={p.name} color={p.color} className="size-28 rounded-xl text-5xl md:size-36 md:text-6xl" />
                {managing && (
                  <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/55">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-8 text-ink">
                      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
                    </svg>
                  </span>
                )}
                {!managing && active?.id === p.id && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-ink" aria-hidden />
                )}
              </span>
              <span className="max-w-full truncate text-sm font-medium text-steel group-hover:text-ink md:text-base">{p.name}</span>
            </button>
          </li>
        ))}

        {profiles.length < MAX_PROFILES && (
          <li>
            <button
              type="button"
              onClick={() => setEditing({ kind: "new" })}
              className="group grid w-28 justify-items-center gap-3 md:w-36"
            >
              <span className="grid size-28 place-items-center rounded-xl border-2 border-dashed border-line text-5xl text-steel transition group-hover:border-steel group-hover:text-ink md:size-36">
                +
              </span>
              <span className="text-sm font-medium text-steel group-hover:text-ink md:text-base">Add profile</span>
            </button>
          </li>
        )}
      </ul>

      <button
        type="button"
        onClick={() => setManaging((m) => !m)}
        className={`h-11 rounded-md px-6 text-[15px] font-semibold transition ${
          managing ? "bg-ink text-black hover:bg-ink/85" : "text-steel ring-1 ring-line hover:text-ink hover:ring-steel"
        }`}
      >
        {managing ? "Done" : "Manage profiles"}
      </button>
    </div>
  );
}
