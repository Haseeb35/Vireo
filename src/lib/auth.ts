// Account actions (browser-only). Every function throws a FriendlyError with a
// message that can be shown to the user as-is.
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

export class FriendlyError extends Error {}

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "That email and password don't match. Check them and try again.",
  "auth/wrong-password": "That email and password don't match. Check them and try again.",
  "auth/user-not-found": "There's no account with that email. Sign up instead?",
  "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/weak-password": "Choose a password with at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes, then try again.",
  "auth/network-request-failed": "Couldn't reach the server. Check your internet connection.",
  "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups for this site and try again.",
  "auth/user-disabled": "This account has been disabled.",
};

/** Codes where the user simply changed their mind: no message needed. */
const SILENT = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

function friendly(err: unknown): FriendlyError | null {
  if (err instanceof FirebaseError) {
    if (SILENT.has(err.code)) return null;
    return new FriendlyError(MESSAGES[err.code] ?? "Something went wrong. Please try again.");
  }
  return new FriendlyError("Something went wrong. Please try again.");
}

function requireAuth() {
  if (!auth) throw new FriendlyError("Sign-in isn't set up yet: the Firebase keys are missing from .env.local.");
  return auth;
}

/** Runs an auth call; returns null if the user cancelled, throws FriendlyError on failure. */
async function run<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof FriendlyError) throw err;
    const f = friendly(err);
    if (f) throw f;
    return null;
  }
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<User | null> {
  return run(async () => {
    const { user } = await createUserWithEmailAndPassword(requireAuth(), email, password);
    if (name) await updateProfile(user, { displayName: name });
    return user;
  });
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  return run(async () => (await signInWithEmailAndPassword(requireAuth(), email, password)).user);
}

/** Google pop-up. `isNew` is true the first time this Google account signs in. */
export async function signInWithGoogle(): Promise<{ user: User; isNew: boolean } | null> {
  return run(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(requireAuth(), provider);
    return { user: result.user, isNew: Boolean(getAdditionalUserInfo(result)?.isNewUser) };
  });
}

export async function sendReset(email: string): Promise<void> {
  await run(() => sendPasswordResetEmail(requireAuth(), email));
}

export async function signOut(): Promise<void> {
  await run(() => fbSignOut(requireAuth()));
}

/** Only allow same-site relative redirects after sign-in (prevents open redirects). */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
