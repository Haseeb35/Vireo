"use server";

import { GENRE_CHOICES } from "@/lib/genres";
import { getMoviesByGenre, getSeason, searchMulti, type Episode, type SearchResults, type Title } from "@/lib/tmdb";

/** Loads a season's episodes when the user switches season in the detail view. */
export async function loadSeason(tvId: number, season: number): Promise<Episode[]> {
  if (!Number.isInteger(tvId) || !Number.isInteger(season) || tvId <= 0 || season < 0) return [];
  return getSeason(tvId, season);
}

/** Films for a "Because you like …" row. Only known genre ids are accepted. */
export async function loadGenreRow(genreId: number): Promise<Title[]> {
  if (!GENRE_CHOICES.some((g) => g.id === genreId)) return [];
  return getMoviesByGenre(genreId);
}

/** Search-as-you-type. Normalises the query so equivalent searches share a cache entry. */
export async function searchTitles(query: string): Promise<SearchResults> {
  const q = String(query).trim().replace(/\s+/g, " ").toLowerCase().slice(0, 100);
  if (q.length < 1) return { titles: [], people: [] };
  return searchMulti(q);
}
