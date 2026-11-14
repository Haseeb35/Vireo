import { Fragment, Suspense } from "react";
import { HeroCarousel, HeroSkeleton, type HeroSlide } from "@/components/hero";
import { MyListRow } from "@/components/my-list/my-list-row";
import { ContinueRow } from "@/components/player/continue-row";
import { PersonalRows } from "@/components/profiles/personal-rows";
import { Row, RowSkeleton } from "@/components/row";
import { SetupStatus } from "@/components/setup-status";
import {
  GENRES,
  getMoviesByGenre,
  getTopRatedMovies,
  getTrending,
  getTrendingTV,
  isTmdbConfigured,
  type Title,
} from "@/lib/tmdb";

/** Runs a TMDB call and returns an error message instead of throwing. */
async function safe(load: () => Promise<Title[]>): Promise<{ titles: Title[]; error?: string }> {
  try {
    return { titles: await load() };
  } catch (err) {
    return { titles: [], error: err instanceof Error ? err.message : String(err) };
  }
}

async function Featured() {
  if (!isTmdbConfigured()) return <SetupStatus />;

  const { titles, error } = await safe(getTrending);
  const slides: HeroSlide[] = titles
    .map((t, i) => ({ ...t, rank: i + 1 }))
    .filter((t): t is HeroSlide => Boolean(t.backdropPath && t.overview))
    .slice(0, 5);

  if (error || slides.length === 0) {
    return <SetupStatus tmdbError={error ?? "TMDB returned no trending titles."} />;
  }
  return <HeroCarousel slides={slides} />;
}

async function TitleRow({ heading, load }: { heading: string; load: () => Promise<Title[]> }) {
  if (!isTmdbConfigured()) return null;
  const { titles } = await safe(load);
  return <Row heading={heading} titles={titles} />;
}

const ROWS: { heading: string; load: () => Promise<Title[]> }[] = [
  { heading: "Trending now", load: getTrending },
  { heading: "Top rated films", load: getTopRatedMovies },
  { heading: "Series everyone's watching", load: getTrendingTV },
  { heading: "Action", load: () => getMoviesByGenre(GENRES.action) },
  { heading: "Science fiction", load: () => getMoviesByGenre(GENRES.scifi) },
  { heading: "Comedy", load: () => getMoviesByGenre(GENRES.comedy) },
  { heading: "Horror", load: () => getMoviesByGenre(GENRES.horror) },
  { heading: "Animation", load: () => getMoviesByGenre(GENRES.animation) },
];

export default function Home() {
  return (
    <main className="flex-1 pb-20">
      <Suspense fallback={<HeroSkeleton />}>
        <Featured />
      </Suspense>

      {/* Rows tuck up over the bottom of the hero */}
      <div className="relative z-10 -mt-28 grid grid-cols-[minmax(0,1fr)] gap-6 md:-mt-36 md:gap-8">
        <ContinueRow />
        <MyListRow />
        {ROWS.map(({ heading, load }, i) => (
          <Fragment key={heading}>
            <Suspense fallback={<RowSkeleton />}>
              <TitleRow heading={heading} load={load} />
            </Suspense>
            {/* Personal rows for the signed-in profile sit right after "Trending now" */}
            {i === 0 && <PersonalRows />}
          </Fragment>
        ))}
      </div>
    </main>
  );
}
