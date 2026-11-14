"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ListItem } from "@/lib/my-list";
import { useMyList } from "./my-list-provider";

/** "+ My List" / "✓ In My List". Guests are sent to sign in first. */
export function MyListButton({ item }: { item: Omit<ListItem, "addedAt"> }) {
  const router = useRouter();
  const { has, toggle, canEdit } = useMyList();
  const [error, setError] = useState(false);
  const inList = has(item.mediaType, item.id);

  async function onClick() {
    if (!canEdit) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setError(false);
    // Firestore applies the change locally first, so the button flips instantly.
    await toggle(item).catch(() => setError(true));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={inList}
      title={error ? "Couldn't update My List. Try again." : undefined}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-3 text-[15px] font-semibold ring-1 transition ${
        inList ? "bg-white/20 text-ink ring-white/25 hover:bg-white/25" : "bg-white/12 text-ink ring-white/10 hover:bg-white/20"
      } ${error ? "ring-red-400/60" : ""}`}
    >
      {inList ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-4" aria-hidden>
          <path d="m5 12 5 5 9-10" />
        </svg>
      ) : (
        <span aria-hidden className="text-lg leading-none">
          +
        </span>
      )}
      {inList ? "In My List" : "My List"}
    </button>
  );
}
