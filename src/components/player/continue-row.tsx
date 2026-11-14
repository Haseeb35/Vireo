"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useProfiles } from "@/components/profiles/profile-provider";
import { RowScroller } from "@/components/row-scroller";
import { tmdbImage } from "@/lib/format";
import { subscribeContinueWatching, timeLeft, type Progress } from "@/lib/progress";
import { watchHref } from "./use-resume";

/** "Continue watching" for the active profile. Hidden for guests and when empty. */
export function ContinueRow() {
  const { user } = useAuth();
  const { active } = useProfiles();
  const key = user && active ? `${user.uid}/${active.id}` : null;
  const [state, setState] = useState<{ key: string; items: Progress[] } | null>(null);

  useEffect(() => {
    if (!key || !user || !active) return;
    return subscribeContinueWatching(user.uid, active.id, (items) => setState({ key, items }));
  }, [key, user, active]);

  const items = state?.key === key ? state.items : [];
  if (items.length === 0) return null;

  return (
    <section className="relative min-w-0">
      <h2 className="px-5 text-base font-semibold tracking-tight md:px-10 md:text-lg">
        Continue watching{active ? ` for ${active.name}` : ""}
      </h2>
      <RowScroller label="Continue watching">
        {items.map((p) => (
          <div role="listitem" key={`${p.mediaType}-${p.id}`} className="contents">
            <Link
              href={watchHref(p.mediaType, p.id, p)}
              draggable={false}
              className="group/tile block w-[240px] shrink-0 snap-start outline-none md:w-[300px]"
            >
              <div className="relative aspect-video overflow-hidden rounded-md bg-raised transition-transform duration-300 ease-projector group-hover/tile:scale-[1.03] group-focus-visible/tile:scale-[1.03] group-focus-visible/tile:ring-2 group-focus-visible/tile:ring-ink">
                {p.backdropPath && (
                  <Image
                    src={tmdbImage(p.backdropPath, "w780")}
                    alt=""
                    fill
                    draggable={false}
                    sizes="300px"
                    className="pointer-events-none object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover/tile:opacity-100">
                  <span className="grid size-12 place-items-center rounded-full bg-black/60 ring-1 ring-white/30">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 size-5 text-ink">
                      <path d="M7 4.5v15l13-7.5z" />
                    </svg>
                  </span>
                </span>
                <div className="absolute inset-x-3 bottom-2.5 grid gap-1.5">
                  <p className="truncate text-sm font-semibold">
                    {p.title}
                    {p.mediaType === "tv" && p.season && p.episode && (
                      <span className="ml-2 font-mono text-xs font-normal text-ink/70">
                        S{p.season}:E{p.episode}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                      <span className="block h-full bg-ink" style={{ width: `${Math.min(100, (p.position / p.duration) * 100)}%` }} />
                    </span>
                    <span className="font-mono text-[11px] text-ink/70">{timeLeft(p)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </RowScroller>
    </section>
  );
}
