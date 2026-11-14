// Watch progress per profile: users/{uid}/profiles/{profileId}/progress/{type-id}.
// One document per title; for series it tracks the latest episode. Browser-only.
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface Progress {
  mediaType: "movie" | "tv";
  id: number;
  title: string;
  backdropPath: string | null;
  season: number | null;
  episode: number | null;
  position: number; // seconds
  duration: number; // seconds
  finished: boolean;
  updatedAt: number; // ms
}

/** Watched past this fraction counts as finished (credits etc.). */
export const FINISHED_AT = 0.95;
/** Resume only if at least this many seconds in. */
export const RESUME_AFTER = 10;

export const progressKey = (mediaType: string, id: number) => `${mediaType}-${id}`;

function col(uid: string, profileId: string) {
  if (!db) throw new Error("Firestore isn't configured");
  return collection(db, "users", uid, "profiles", profileId, "progress");
}

export async function getProgress(uid: string, profileId: string, key: string): Promise<Progress | null> {
  const snap = await getDoc(doc(col(uid, profileId), key));
  return snap.exists() ? (snap.data() as Progress) : null;
}

export function saveProgress(uid: string, profileId: string, p: Omit<Progress, "finished" | "updatedAt">) {
  const finished = p.duration > 0 && p.position / p.duration >= FINISHED_AT;
  return setDoc(doc(col(uid, profileId), progressKey(p.mediaType, p.id)), {
    ...p,
    finished,
    updatedAt: Date.now(),
  });
}

/** Unfinished titles, most recently watched first. */
export function subscribeContinueWatching(uid: string, profileId: string, onChange: (items: Progress[]) => void) {
  return onSnapshot(
    query(col(uid, profileId), orderBy("updatedAt", "desc"), limit(20)),
    (snap) => onChange(snap.docs.map((d) => d.data() as Progress).filter((p) => !p.finished && p.position >= RESUME_AFTER)),
    (err) => console.error("[progress] subscription failed:", err),
  );
}

/** Whether a saved position is worth resuming from. */
export const isResumable = (p: Progress | null): p is Progress =>
  Boolean(p && !p.finished && p.position >= RESUME_AFTER);

/** 4923 → "1:22:03", 75 → "1:15" */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Time left in words, e.g. "23 min left". */
export function timeLeft(p: Pick<Progress, "position" | "duration">): string {
  const mins = Math.max(1, Math.round((p.duration - p.position) / 60));
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m left` : `${mins} min left`;
}
