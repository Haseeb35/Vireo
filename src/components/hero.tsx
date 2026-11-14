"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { setBaseAmbient } from "@/lib/ambient";
import { PlayButton } from "@/components/player/play-button";
import { extractColor } from "@/lib/color";
import { titleHref } from "@/lib/format";
import type { Title } from "@/lib/tmdb";

const SLIDE_MS = 8000;
const backdrop = (path: string, size: "w780" | "original") => `https://image.tmdb.org/t/p/${size}${path}`;

export interface HeroSlide extends Title {
  backdropPath: string;
  rank: number;
}

/** Rotating featured titles. Each slide sets the page's ambient colour. */
export function HeroCarousel({ slides, eyebrow = "TRENDING THIS WEEK" }: { slides: HeroSlide[]; eyebrow?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = slides[index];

  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);

  // Auto-advance unless hovered or the tab is hidden.
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setTimeout(() => {
      if (!document.hidden) go(index + 1);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, go, slides.length]);

  // Pull the slide's colour from its backdrop and fade the page to it.
  useEffect(() => {
    let live = true;
    extractColor(backdrop(current.backdropPath, "w780")).then((c) => live && setBaseAmbient(c));
    return () => {
      live = false;
    };
  }, [current.backdropPath]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured titles"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative flex min-h-[78svh] items-end overflow-hidden md:min-h-[88svh]"
    >
      {slides.map((s, i) => (
        <Image
          key={s.id}
          src={backdrop(s.backdropPath, "original")}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover object-top transition-opacity duration-1000 ease-projector ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Ambient glow and fades into the page */}
      {/* Solid colour shaped by a radial mask, so the colour change is a cheap background-color fade */}
      <div
        aria-hidden
        className="transition-colors duration-700 ease-projector absolute inset-0 bg-amb opacity-35 [mask-image:radial-gradient(90%_60%_at_20%_75%,black,transparent_70%)]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-screen via-screen/40 to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-screen/85 via-screen/25 to-transparent" />

      <div
        key={current.id}
        aria-live="polite"
        className="relative z-10 grid max-w-2xl animate-[rise_0.7s_var(--ease-projector)] gap-4 px-5 pb-36 md:px-10 md:pb-44"
      >
        <p className="flex items-center gap-3 font-mono text-xs text-ink/80">
          <span className="transition-colors duration-700 ease-projector rounded bg-amb px-1.5 py-0.5 font-medium text-black">#{current.rank}</span>
          {eyebrow}
        </p>

        <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.035em] text-balance md:text-7xl">
          {current.title}
        </h1>

        <p className="flex flex-wrap gap-4 font-mono text-xs uppercase text-ink/75">
          {current.year && <span>{current.year}</span>}
          <span>{current.mediaType === "tv" ? "Series" : "Film"}</span>
          {current.rating > 0 && <span>★ {current.rating.toFixed(1)}</span>}
        </p>

        <p className="line-clamp-3 max-w-[52ch] text-base text-ink/85">{current.overview}</p>

        <div className="mt-2 flex flex-wrap items-start gap-3">
          <PlayButton mediaType={current.mediaType} id={current.id} />
          <Link
            href={titleHref(current.mediaType, current.id)}
            scroll={false}
            className="inline-flex items-center gap-2 rounded-md bg-white/15 px-5 py-3 text-[15px] font-semibold text-ink transition hover:bg-white/25"
          >
            More info
          </Link>
        </div>
      </div>

      {/* Slide indicators: the active one fills over the slide duration */}
      {slides.length > 1 && (
        <div className="absolute right-5 bottom-36 z-10 flex gap-1.5 md:right-10 md:bottom-44">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${s.title}`}
              aria-current={i === index}
              className="group relative h-6 w-6 md:w-9"
            >
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/25 group-hover:bg-white/40">
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className="block h-full origin-left bg-ink"
                    style={{
                      animation: `fill ${SLIDE_MS}ms linear forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative flex min-h-[78svh] items-end md:min-h-[88svh]">
      <div className="grid w-full max-w-2xl gap-4 px-5 pb-36 md:px-10 md:pb-44">
        <div className="h-4 w-40 animate-pulse rounded bg-raised" />
        <div className="h-16 w-3/4 animate-pulse rounded bg-raised" />
        <div className="h-4 w-56 animate-pulse rounded bg-raised" />
        <div className="h-16 w-full animate-pulse rounded bg-raised" />
      </div>
    </section>
  );
}
