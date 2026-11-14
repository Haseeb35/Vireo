"use client";

import Link from "next/link";
import { formatClock, timeLeft } from "@/lib/progress";
import { useResume, watchHref } from "./use-resume";

/** Primary Play button. Becomes "Resume …" when the active profile has progress. */
export function PlayButton({ mediaType, id }: { mediaType: "movie" | "tv"; id: number }) {
  const progress = useResume(mediaType, id);
  const label = progress
    ? mediaType === "tv" && progress.season && progress.episode
      ? `Resume S${progress.season}:E${progress.episode}`
      : `Resume ${formatClock(progress.position)}`
    : "Play";

  return (
    <span className="inline-grid gap-1.5">
      <Link
        href={watchHref(mediaType, id, progress)}
        className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-[15px] font-bold text-black transition hover:bg-ink/85"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
          <path d="M7 4.5v15l13-7.5z" />
        </svg>
        {label}
      </Link>
      {progress && (
        <span className="flex items-center gap-2" aria-label={timeLeft(progress)}>
          <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
            <span
              className="block h-full bg-amb"
              style={{ width: `${Math.min(100, (progress.position / progress.duration) * 100)}%` }}
            />
          </span>
          <span className="font-mono text-[11px] text-ink/60">{timeLeft(progress)}</span>
        </span>
      )}
    </span>
  );
}
