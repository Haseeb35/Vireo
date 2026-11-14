"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useProfiles } from "@/components/profiles/profile-provider";
import { addToList, listKey, removeFromList, subscribeList, type ListItem } from "@/lib/my-list";

interface MyListState {
  /** null while loading or for guests. */
  items: ListItem[] | null;
  /** False for guests: the UI should send them to sign in instead. */
  canEdit: boolean;
  has: (mediaType: string, id: number) => boolean;
  toggle: (item: Omit<ListItem, "addedAt">) => Promise<void>;
  remove: (mediaType: string, id: number) => Promise<void>;
}

const noop = async () => {};
const MyListContext = createContext<MyListState>({ items: null, canEdit: false, has: () => false, toggle: noop, remove: noop });

/** One live subscription to the active profile's list, shared by every button and page. */
export function MyListProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { active } = useProfiles();
  const key = user && active ? `${user.uid}/${active.id}` : null;
  const [state, setState] = useState<{ key: string; items: ListItem[] } | null>(null);

  useEffect(() => {
    if (!key || !user || !active) return;
    return subscribeList(user.uid, active.id, (items) => setState({ key, items }));
  }, [key, user, active]);

  const items = key && state?.key === key ? state.items : null;
  const keys = useMemo(() => new Set((items ?? []).map((i) => listKey(i.mediaType, i.id))), [items]);

  const has = useCallback((mediaType: string, id: number) => keys.has(listKey(mediaType, id)), [keys]);

  const remove = useCallback(
    async (mediaType: string, id: number) => {
      if (!user || !active) return;
      await removeFromList(user.uid, active.id, mediaType, id);
    },
    [user, active],
  );

  const toggle = useCallback(
    async (item: Omit<ListItem, "addedAt">) => {
      if (!user || !active) return;
      if (keys.has(listKey(item.mediaType, item.id))) await removeFromList(user.uid, active.id, item.mediaType, item.id);
      else await addToList(user.uid, active.id, item);
    },
    [user, active, keys],
  );

  const value = useMemo(
    () => ({ items, canEdit: Boolean(user && active), has, toggle, remove }),
    [items, user, active, has, toggle, remove],
  );
  return <MyListContext.Provider value={value}>{children}</MyListContext.Provider>;
}

export const useMyList = () => useContext(MyListContext);
