"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useProfiles } from "@/components/profiles/profile-provider";
import { getProgress, isResumable, progressKey, type Progress } from "@/lib/progress";

/** Saved progress for one title on the active profile (null if none or a guest). */
export function useResume(mediaType: "movie" | "tv", id: number): Progress | null {
  const { user } = useAuth();
  const { active } = useProfiles();
  const key = user && active ? `${user.uid}/${active.id}/${progressKey(mediaType, id)}` : null;
  const [state, setState] = useState<{ key: string; progress: Progress | null } | null>(null);

  useEffect(() => {
    if (!key || !user || !active) return;
    let live = true;
    getProgress(user.uid, active.id, progressKey(mediaType, id))
      .then((p) => live && setState({ key, progress: isResumable(p) ? p : null }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key, user, active, mediaType, id]);

  return state?.key === key ? state.progress : null;
}

/** Link to the player, continuing the saved episode for series. */
export function watchHref(mediaType: "movie" | "tv", id: number, p: Progress | null): string {
  const base = `/watch/${mediaType}/${id}`;
  return mediaType === "tv" && p?.season && p.episode ? `${base}?s=${p.season}&e=${p.episode}` : base;
}
