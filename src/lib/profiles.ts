// Profiles live at users/{uid}/profiles/{profileId}. Browser-only.
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Profile {
  id: string;
  name: string;
  color: number; // index into AVATAR_COLORS
  genres: number[]; // TMDB genre ids
  createdAt: number; // ms; client time so new profiles sort correctly before the server confirms
}

export type ProfileInput = Pick<Profile, "name" | "color" | "genres">;

export const MAX_PROFILES = 5;
export const MAIN_PROFILE_ID = "main";

/** Avatar tile colours, tuned to sit on the near-black UI. */
export const AVATAR_COLORS = ["#e2a33d", "#4f8cff", "#e0566b", "#3fbf9f", "#a77dff", "#f07a3a", "#5fb8d6", "#c9c5bd"];

function profilesCol(uid: string) {
  if (!db) throw new Error("Firestore isn't configured");
  return collection(db, "users", uid, "profiles");
}

export function subscribeProfiles(
  uid: string,
  onChange: (profiles: Profile[]) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    query(profilesCol(uid), orderBy("createdAt")),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Profile, "id">) }))),
    onError,
  );
}

/**
 * Creates (or refreshes) the account's first profile under a fixed id, so
 * onboarding and the automatic set-up for older accounts can never create two.
 */
export function ensureMainProfile(uid: string, input: Omit<ProfileInput, "color">) {
  return setDoc(
    doc(profilesCol(uid), MAIN_PROFILE_ID),
    { ...input, color: 0, createdAt: Date.now() },
    { merge: true },
  );
}

export async function createProfile(uid: string, input: ProfileInput): Promise<string> {
  const ref = await addDoc(profilesCol(uid), { ...input, createdAt: Date.now() });
  return ref.id;
}

export function updateProfileDoc(uid: string, id: string, input: Partial<ProfileInput>) {
  return updateDoc(doc(profilesCol(uid), id), input);
}

/** Sub-collections stored under each profile. Deleted along with it. */
const PROFILE_SUBCOLLECTIONS = ["list", "progress"];

/**
 * Deletes a profile and everything stored under it. Firestore doesn't delete
 * sub-collections automatically, so they're cleared first in one batch.
 */
export async function deleteProfileDoc(uid: string, id: string) {
  if (!db) throw new Error("Firestore isn't configured");
  const batch = writeBatch(db);
  for (const name of PROFILE_SUBCOLLECTIONS) {
    const snap = await getDocs(collection(db, "users", uid, "profiles", id, name));
    snap.forEach((d) => batch.delete(d.ref));
  }
  batch.delete(doc(profilesCol(uid), id));
  await batch.commit();
}

// The active profile is remembered per account on this device.
const key = (uid: string) => `vireo:profile:${uid}`;
export function readActiveId(uid: string): string | null {
  try {
    return localStorage.getItem(key(uid));
  } catch {
    return null;
  }
}
export function writeActiveId(uid: string, id: string) {
  try {
    localStorage.setItem(key(uid), id);
  } catch {
    // Private mode: the choice just won't persist.
  }
}
