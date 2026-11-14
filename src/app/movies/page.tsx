import type { Metadata } from "next";
import { BrowsePage } from "@/components/browse/browse-page";
import { GENRES, getMoviesByGenre, getNowPlaying, getPopularMovies, getTopRatedMovies, getUpcoming } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Films" };

export default function MoviesPage() {
  return (
    <BrowsePage
      featured={getPopularMovies}
      eyebrow="POPULAR FILMS"
      rows={[
        { heading: "Popular films", load: getPopularMovies },
        { heading: "In cinemas now", load: getNowPlaying },
        { heading: "Coming soon", load: getUpcoming },
        { heading: "Top rated of all time", load: getTopRatedMovies },
        { heading: "Thrillers", load: () => getMoviesByGenre(GENRES.thriller) },
        { heading: "Action", load: () => getMoviesByGenre(GENRES.action) },
        { heading: "Comedy", load: () => getMoviesByGenre(GENRES.comedy) },
        { heading: "Animation", load: () => getMoviesByGenre(GENRES.animation) },
      ]}
    />
  );
}
