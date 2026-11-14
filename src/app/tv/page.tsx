import type { Metadata } from "next";
import { BrowsePage } from "@/components/browse/browse-page";
import { getOnTheAir, getPopularTV, getTopRatedTV, getTrendingTV, getTVByGenre, TV_GENRES } from "@/lib/tmdb";

export const metadata: Metadata = { title: "TV Shows" };

export default function TVPage() {
  return (
    <BrowsePage
      featured={getTrendingTV}
      eyebrow="TRENDING SERIES"
      rows={[
        { heading: "Trending this week", load: getTrendingTV },
        { heading: "Popular series", load: getPopularTV },
        { heading: "New episodes this week", load: getOnTheAir },
        { heading: "Top rated series", load: getTopRatedTV },
        { heading: "Crime", load: () => getTVByGenre(TV_GENRES.crime) },
        { heading: "Sci-fi & fantasy", load: () => getTVByGenre(TV_GENRES.scifiFantasy) },
        { heading: "Drama", load: () => getTVByGenre(TV_GENRES.drama) },
        { heading: "Comedy", load: () => getTVByGenre(TV_GENRES.comedy) },
        { heading: "Animation", load: () => getTVByGenre(TV_GENRES.animation) },
      ]}
    />
  );
}
