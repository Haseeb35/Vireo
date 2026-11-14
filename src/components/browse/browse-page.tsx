import { Suspense } from "react";
import { HeroCarousel, HeroSkeleton, type HeroSlide } from "@/components/hero";
import { Row, RowSkeleton } from "@/components/row";
import { isTmdbConfigured, type Title } from "@/lib/tmdb";

export interface RowSpec {
  heading: string;
  load: () => Promise<Title[]>;
}

async function safe(load: () => Promise<Title[]>): Promise<Title[]> {
  if (!isTmdbConfigured()) return [];
  try {
    return await load();
  } catch {
    return [];
  }
}

async function Featured({ load, eyebrow }: { load: () => Promise<Title[]>; eyebrow: string }) {
  const slides: HeroSlide[] = (await safe(load))
    .map((t, i) => ({ ...t, rank: i + 1 }))
    .filter((t): t is HeroSlide => Boolean(t.backdropPath && t.overview))
    .slice(0, 5);
  if (slides.length === 0) return <div className="h-40" />;
  return <HeroCarousel slides={slides} eyebrow={eyebrow} />;
}

async function TitleRow({ heading, load }: RowSpec) {
  return <Row heading={heading} titles={await safe(load)} />;
}

/** Banner of the top titles plus rows. Used by the Films and TV pages. */
export function BrowsePage({ featured, eyebrow, rows }: { featured: () => Promise<Title[]>; eyebrow: string; rows: RowSpec[] }) {
  return (
    <main className="flex-1 pb-20">
      <Suspense fallback={<HeroSkeleton />}>
        <Featured load={featured} eyebrow={eyebrow} />
      </Suspense>
      <div className="relative z-10 -mt-28 grid grid-cols-[minmax(0,1fr)] gap-6 md:-mt-36 md:gap-8">
        {rows.map((r) => (
          <Suspense key={r.heading} fallback={<RowSkeleton />}>
            <TitleRow {...r} />
          </Suspense>
        ))}
      </div>
    </main>
  );
}
