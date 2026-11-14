// My List per profile: users/{uid}/profiles/{profileId}/list/{type-id}. Browser-only.
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface ListItem {
  mediaType: "movie" | "tv";
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  year: string | null;
  addedAt: number; // ms
}

export const listKey = (mediaType: string, id: number) => `${mediaType}-${id}`;

function col(uid: string, profileId: string) {
  if (!db) throw new Error("Firestore isn't configured");
  return collection(db, "users", uid, "profiles", profileId, "list");
}

export function subscribeList(uid: string, profileId: string, onChange: (items: ListItem[]) => void) {
  return onSnapshot(
    query(col(uid, profileId), orderBy("addedAt", "desc")),
    (snap) => onChange(snap.docs.map((d) => d.data() as ListItem)),
    (err) => console.error("[my-list] subscription failed:", err),
  );
}

export function addToList(uid: string, profileId: string, item: Omit<ListItem, "addedAt">) {
  return setDoc(doc(col(uid, profileId), listKey(item.mediaType, item.id)), { ...item, addedAt: Date.now() });
}

export function removeFromList(uid: string, profileId: string, mediaType: string, id: number) {
  return deleteDoc(doc(col(uid, profileId), listKey(mediaType, id)));
}
