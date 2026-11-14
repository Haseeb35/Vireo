"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { loadSeason } from "@/app/actions";
import { formatRuntime, tmdbImage } from "@/lib/format";
import type { Episode, SeasonSummary } from "@/lib/tmdb";

interface Props {
  tvId: number;
  seasons: SeasonSummary[];
  initialSeason: number;
  initialEpisodes: Episode[];
}

export function Episodes({ tvId, seasons, initialSeason, initialEpisodes }: Props) {
  const [season, setSeason] = useState(initialSeason);
  const [episodes, setEpisodes] = useState(initialEpisodes);
  const [pending, startTransition] = useTransition();
  const loaded = useRef(new Map([[initialSeason, initialEpisodes]]));

  function choose(n: number) {
    setSeason(n);
    const hit = loaded.current.get(n);
    if (hit) return setEpisodes(hit);
    startTransition(async () => {
      const eps = await loadSeason(tvId, n);
      loaded.current.set(n, eps);
      setEpisodes(eps);
    });
  }

  return (
    <section aria-labelledby="episodes-heading">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
        <h2 id="episodes-heading" className="text-lg font-bold tracking-tight">
          Episodes
        </h2>
        {seasons.length > 1 ? (
          <label className="relative">
            <span className="sr-only">Season</span>
            <select
              value={season}
              onChange={(e) => choose(Number(e.target.value))}
              className="appearance-none rounded-md border border-line bg-raised py-2 pr-9 pl-3 text-sm font-medium text-ink"
            >
              {seasons.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.name} ({s.episodeCount})
                </option>
              ))}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-steel">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </label>
        ) : (
          <span className="font-mono text-xs text-steel">{seasons[0]?.name}</span>
        )}
      </div>

      <ol className={`divide-y divide-line transition-opacity ${pending ? "opacity-50" : ""}`} aria-busy={pending}>
        {episodes.map((ep) => (
          <li key={ep.number} className="grid grid-cols-[1.5rem_7rem_minmax(0,1fr)] items-start gap-3 py-4 md:grid-cols-[2rem_10rem_minmax(0,1fr)_auto] md:gap-5">
            <span className="pt-1 text-center font-mono text-sm text-steel">{ep.number}</span>
            <div className="relative aspect-video overflow-hidden rounded bg-raised">
              {ep.stillPath && (
                <Image src={tmdbImage(ep.stillPath, "w300")} alt="" fill sizes="160px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{ep.name}</p>
              {ep.overview && <p className="mt-1 line-clamp-2 text-sm text-steel">{ep.overview}</p>}
            </div>
            <span className="hidden pt-1 font-mono text-xs text-steel md:block">{formatRuntime(ep.runtime)}</span>
          </li>
        ))}
        {episodes.length === 0 && !pending && (
          <li className="py-6 text-sm text-steel">No episode details for this season yet.</li>
        )}
      </ol>
    </section>
  );
}
