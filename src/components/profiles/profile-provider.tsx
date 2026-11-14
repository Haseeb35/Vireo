"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { ensureMainProfile, readActiveId, subscribeProfiles, writeActiveId, type Profile } from "@/lib/profiles";
import { getUserDoc } from "@/lib/user-doc";

interface ProfileState {
  /** null while loading; [] for guests. */
  profiles: Profile[] | null;
  active: Profile | null;
  setActive: (id: string) => void;
}

const ProfileContext = createContext<ProfileState>({ profiles: null, active: null, setActive: () => {} });

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  // Keyed by uid so a stale list from a previous account is never shown.
  const [list, setList] = useState<{ uid: string; profiles: Profile[] } | null>(null);
  const [activeId, setActiveId] = useState<{ uid: string; id: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    let migrated = false;
    return subscribeProfiles(
      uid,
      async (profiles) => {
        setList({ uid, profiles });
        // Accounts created before profiles existed: make their first profile
        // from the name and genres they already have.
        if (profiles.length === 0 && !migrated) {
          migrated = true;
          const doc = await getUserDoc(uid).catch(() => null);
          if (doc?.onboarded) {
            await ensureMainProfile(uid, {
              name: user.displayName || user.email?.split("@")[0] || "Me",
              genres: doc.genres ?? [],
            });
          }
        }
      },
      (err) => console.error("[profiles] subscription failed:", err),
    );
  }, [user]);

  const setActive = useCallback(
    (id: string) => {
      if (!user) return;
      writeActiveId(user.uid, id);
      setActiveId({ uid: user.uid, id });
    },
    [user],
  );

  const value = useMemo<ProfileState>(() => {
    if (authLoading) return { profiles: null, active: null, setActive };
    if (!user) return { profiles: [], active: null, setActive };
    const profiles = list?.uid === user.uid ? list.profiles : null;
    const wanted = activeId?.uid === user.uid ? activeId.id : readActiveId(user.uid);
    const active = profiles?.find((p) => p.id === wanted) ?? profiles?.[0] ?? null;
    return { profiles, active, setActive };
  }, [authLoading, user, list, activeId, setActive]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useProfiles = () => useContext(ProfileContext);
