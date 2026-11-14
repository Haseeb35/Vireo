"use client";

import { useOffline } from "next/offline";

/** Shown at the top of every page while the connection is down. */
export function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] z-[55] flex justify-center px-4 pt-2"
    >
      <p className="flex animate-[rise_0.3s_var(--ease-projector)] items-center gap-2.5 rounded-full bg-card/95 px-4 py-2 text-sm text-ink ring-1 ring-line backdrop-blur-sm">
        <span className="size-2 rounded-full bg-amber-400" aria-hidden />
        You&apos;re offline. Saved pages still work; everything else loads when you&apos;re back.
      </p>
    </div>
  );
}
