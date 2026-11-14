import type { Metadata } from "next";
import Link from "next/link";
import { RetryButton } from "@/components/pwa/retry-button";

export const metadata: Metadata = { title: "Offline" };

// Precached by the service worker and shown for pages you haven't opened before.
export default function OfflinePage() {
  return (
    <main className="grid flex-1 place-items-center px-5 pt-32 pb-24 text-center">
      <div className="grid max-w-md justify-items-center gap-4">
        <p className="font-mono text-xs tracking-wider text-steel">NO CONNECTION</p>
        <h1 className="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">You&apos;re offline</h1>
        <p className="text-steel">
          This page hasn&apos;t been saved on this device yet. Pages you&apos;ve opened before, like My List, still work.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <RetryButton />
          <Link href="/my-list" className="rounded-md bg-white/12 px-6 py-3 text-[15px] font-semibold ring-1 ring-white/10 hover:bg-white/20">
            Open My List
          </Link>
        </div>
      </div>
    </main>
  );
}
