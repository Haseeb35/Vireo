// The signed-in user's own document in Firestore: users/{uid}. Browser-only.
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface UserDoc {
  genres: number[]; // TMDB genre ids picked during onboarding
  onboarded: boolean;
}

const userRef = (uid: string) => {
  if (!db) throw new Error("Firestore isn't configured");
  return doc(db, "users", uid);
};

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function saveGenres(uid: string, genres: number[]): Promise<void> {
  await setDoc(
    userRef(uid),
    { genres, onboarded: true, updatedAt: serverTimestamp(), createdAt: serverTimestamp() },
    { merge: true },
  );
}

/** Where to send someone right after they sign in. */
export async function destinationAfterSignIn(uid: string, next: string): Promise<string> {
  try {
    const user = await getUserDoc(uid);
    return user?.onboarded ? `/profiles?next=${encodeURIComponent(next)}` : `/onboarding?next=${encodeURIComponent(next)}`;
  } catch {
    // If the database can't be read (e.g. rules not published yet), don't block sign-in.
    return next;
  }
}
