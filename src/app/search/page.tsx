import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/search/search-view";
import { getTrending, isTmdbConfigured, type Title } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Search" };

async function SearchLoader() {
  let popular: Title[] = [];
  if (isTmdbConfigured()) {
    try {
      popular = (await getTrending()).filter((t) => t.posterPath).slice(0, 14);
    } catch {
      // Search still works without the "Popular" grid.
    }
  }
  return <SearchView popular={popular} />;
}

export default function SearchPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 pt-28 pb-20 md:px-10">
      {/* SearchView reads ?q= from the URL, which is only known at request time. */}
      <Suspense fallback={<div className="h-14 animate-pulse rounded-lg bg-card" />}>
        <SearchLoader />
      </Suspense>
    </main>
  );
}
