import type { Title } from "@/lib/tmdb";
import { PosterCard, type PosterData } from "./poster-card";
import { RowScroller } from "./row-scroller";

/** A titled, horizontally scrolling row of posters. */
export function Row({ heading, titles }: { heading: string; titles: Title[] }) {
  const items: PosterData[] = titles
    .filter((t): t is Title & { posterPath: string } => Boolean(t.posterPath))
    .map(({ id, mediaType, title, year, posterPath }) => ({ id, mediaType, title, year, posterPath }));

  if (items.length === 0) return null;

  return (
    <section className="relative">
      <h2 className="px-5 text-base font-semibold tracking-tight md:px-10 md:text-lg">{heading}</h2>
      <RowScroller label={heading}>
        {items.map((item) => (
          <div role="listitem" key={`${item.mediaType}-${item.id}`} className="contents">
            <PosterCard item={item} />
          </div>
        ))}
      </RowScroller>
    </section>
  );
}

export function RowSkeleton() {
  return (
    <section aria-hidden>
      <div className="mx-5 h-5 w-40 animate-pulse rounded bg-raised md:mx-10" />
      <div className="flex gap-2.5 overflow-hidden px-5 py-4 md:px-10">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="aspect-[2/3] w-[112px] shrink-0 animate-pulse rounded-md bg-raised md:w-[164px]" />
        ))}
      </div>
    </section>
  );
}
