"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { endAmbientPreview, previewAmbient } from "@/lib/ambient";
import { extractColor } from "@/lib/color";
import { titleHref } from "@/lib/format";

export interface PosterData {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  year: string | null;
  posterPath: string;
}

const IMG = "https://image.tmdb.org/t/p/w500";

const whenIdle = (fn: () => void) =>
  "requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);

export function PosterCard({ item, priority = false }: { item: PosterData; priority?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [color, setColor] = useState<string | null>(null);
  const src = IMG + item.posterPath;

  // Work out the poster colour ahead of time, once the card is near the screen,
  // so the glow is ready the moment the pointer arrives.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let live = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        whenIdle(() => extractColor(src).then((c) => live && setColor(c)));
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      live = false;
      io.disconnect();
    };
  }, [src]);

  async function focusIn() {
    previewAmbient(color ?? (await extractColor(src)));
  }

  return (
    <Link
      ref={ref}
      href={titleHref(item.mediaType, item.id)}
      scroll={false}
      draggable={false}
      onMouseEnter={focusIn}
      onFocus={focusIn}
      onBlur={endAmbientPreview}
      aria-label={`${item.title}${item.year ? ` (${item.year})` : ""}`}
      style={{ "--c": color ?? "transparent" } as CSSProperties}
      className="group/card relative block w-[112px] shrink-0 snap-start outline-none md:w-[164px]"
    >
      {/* Hover: a small lift plus a thin outline in the poster's own colour.
          Only transform and opacity animate, so it stays smooth. */}
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-md bg-raised
                   transition-transform duration-300 ease-projector will-change-transform
                   group-hover/card:scale-[1.04] group-focus-visible/card:scale-[1.04]"
      >
        <Image
          src={src}
          alt=""
          fill
          draggable={false}
          priority={priority}
          sizes="(min-width: 768px) 164px, 112px"
          className="pointer-events-none object-cover"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-white/5 ring-inset"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md opacity-0 ring-2 ring-(--c) ring-inset
                     transition-opacity duration-300 group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
        />
      </div>
    </Link>
  );
}
