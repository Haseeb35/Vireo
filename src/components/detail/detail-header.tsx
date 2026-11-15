"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { MyListButton } from "@/components/my-list/my-list-button";
import { PlayButton } from "@/components/player/play-button";
import { tmdbImage } from "@/lib/format";

interface Props {
  mediaType: "movie" | "tv";
  id: number;
  title: string;
  kind: "Film" | "Series";
  backdropPath: string | null;
  posterPath: string | null;
  year: string | null;
  trailerKey: string | null;
  meta: string[]; // e.g. ["2025", "2H 08M", "PG-13", "★ 7.8"]
  tagline: string;
}

/** Backdrop (or trailer), title, details and actions at the top of the detail view. */
export function DetailHeader({
  mediaType,
  id,
  title,
  kind,
  backdropPath,
  posterPath,
  year,
  trailerKey,
  meta,
  tagline,
}: Props) {
  const [playing, setPlaying] = useState(false);

  // Next.js hides pages you navigate away from instead of removing them (React
  // <Activity>). When this pop-up is hidden, close the trailer so it's off when
  // you come back. (TrailerFrame silences the video itself immediately.)
  useLayoutEffect(() => () => setPlaying(false), []);

  return (
    <header>
      <div className="relative aspect-video w-full overflow-hidden bg-raised md:aspect-[16/8]">
        {playing && trailerKey ? (
          <TrailerFrame videoKey={trailerKey} title={title} />
        ) : (
          <>
            {backdropPath && (
              <Image
                src={tmdbImage(backdropPath, "original")}
                alt=""
                fill
                priority
                sizes="(min-width: 920px) 920px, 100vw"
                className="object-cover"
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-amb opacity-30 [mask-image:radial-gradient(80%_70%_at_15%_100%,black,transparent_70%)]"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          </>
        )}
      </div>

      <div className={`relative z-10 grid gap-4 px-5 md:px-10 ${playing ? "mt-6" : "-mt-20 md:-mt-28"}`}>
        <p className="flex items-center gap-3 font-mono text-xs text-ink/80">
          <span className="rounded bg-amb px-1.5 py-0.5 font-medium text-black">{kind.toUpperCase()}</span>
          {tagline && <span className="line-clamp-1 normal-case">{tagline}</span>}
        </p>

        <h1 className="text-4xl font-extrabold leading-[0.95] tracking-[-0.035em] text-balance md:text-6xl">{title}</h1>

        {meta.length > 0 && (
          <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs uppercase text-ink/75">
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-start gap-3">
          <PlayButton mediaType={mediaType} id={id} />
          {trailerKey && (
            <button
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center gap-2 rounded-md bg-white/12 px-5 py-3 text-[15px] font-semibold text-ink ring-1 ring-white/10 transition hover:bg-white/20"
            >
              {playing ? "Close trailer" : "Trailer"}
            </button>
          )}
          <MyListButton item={{ mediaType, id, title, posterPath, backdropPath, year }} />
        </div>
      </div>
    </header>
  );
}

/**
 * The YouTube trailer. A hidden page keeps its DOM, so a hidden iframe would
 * keep playing with sound. When this component is hidden (or removed), its
 * cleanup points the iframe at a blank page, which stops playback instantly.
 */
function TrailerFrame({ videoKey, title }: { videoKey: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const src = `https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`;

  useLayoutEffect(() => {
    const frame = ref.current; // captured now: refs are detached before cleanup runs
    // Shown again after being hidden (or React's dev double-mount): restore the video.
    if (frame && frame.src !== src) frame.src = src;
    return () => {
      if (frame) frame.src = "about:blank";
    };
  }, [src]);

  return (
    <iframe
      ref={ref}
      src={src}
      title={`${title} trailer`}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      className="absolute inset-0 size-full"
    />
  );
}
