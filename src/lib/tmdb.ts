// TMDB access. Server-only so the access token never ships to the browser.
import "server-only";
import { cacheLife } from "next/cache";

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

export type MediaType = "movie" | "tv";

export interface Title {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  year: string | null;
  rating: number; // 0–10
  posterPath: string | null;
  backdropPath: string | null;
}

export class TmdbNotConfiguredError extends Error {
  constructor() {
    super("TMDB_ACCESS_TOKEN is missing from .env.local");
  }
}

export class TmdbError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const isTmdbConfigured = () => Boolean(process.env.TMDB_ACCESS_TOKEN);

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new TmdbNotConfiguredError();

  const url = new URL(API + path);
  url.search = new URLSearchParams({ language: "en-US", ...params }).toString();

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new TmdbError(res.status, `TMDB ${res.status} on ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// Raw shape TMDB returns for list results (movies and TV mixed).
interface RawResult {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
}

function toTitle(r: RawResult, fallbackType: MediaType): Title {
  const date = r.release_date || r.first_air_date || "";
  return {
    id: r.id,
    mediaType: r.media_type === "tv" || r.media_type === "movie" ? r.media_type : fallbackType,
    title: r.title ?? r.name ?? "Untitled",
    overview: r.overview ?? "",
    year: date ? date.slice(0, 4) : null,
    rating: r.vote_average ?? 0,
    posterPath: r.poster_path ?? null,
    backdropPath: r.backdrop_path ?? null,
  };
}

/**
 * Fetches any TMDB list endpoint and normalises it. Cached for an hour per
 * (path, params, type) combination, so every row is one TMDB call per hour at most.
 */
async function getList(path: string, params: Record<string, string>, type: MediaType): Promise<Title[]> {
  "use cache";
  cacheLife("hours");
  const data = await tmdb<{ results: RawResult[] }>(path, params);
  return data.results
    .filter((r) => !r.media_type || r.media_type === "movie" || r.media_type === "tv")
    .map((r) => toTitle(r, type));
}

/** Trending movies and series this week. */
export const getTrending = () => getList("/trending/all/week", {}, "movie");

/** Highest-rated films of all time. */
export const getTopRatedMovies = () => getList("/movie/top_rated", {}, "movie");

/** Series trending this week. */
export const getTrendingTV = () => getList("/trending/tv/week", {}, "tv");

/** Popular, well-reviewed films in one genre. */
export const getMoviesByGenre = (genreId: number) =>
  getList(
    "/discover/movie",
    {
      with_genres: String(genreId),
      sort_by: "popularity.desc",
      "vote_count.gte": "300",
      include_adult: "false",
    },
    "movie",
  );

// Films page
export const getPopularMovies = () => getList("/movie/popular", {}, "movie");
export const getNowPlaying = () => getList("/movie/now_playing", {}, "movie");
export const getUpcoming = () => getList("/movie/upcoming", {}, "movie");

// TV page
export const getTopRatedTV = () => getList("/tv/top_rated", {}, "tv");
export const getOnTheAir = () => getList("/tv/on_the_air", {}, "tv");
/** Popular series, leaving out talk shows, news and soaps so the rows feel curated. */
export const getPopularTV = () =>
  getList("/discover/tv", { sort_by: "popularity.desc", without_genres: "10767,10763,10766", "vote_count.gte": "200" }, "tv");
export const getTVByGenre = (genreId: number) =>
  getList(
    "/discover/tv",
    { with_genres: String(genreId), sort_by: "popularity.desc", "vote_count.gte": "150", without_genres: "10767,10763" },
    "tv",
  );

/** TMDB TV genre ids (they differ from movie genres). */
export const TV_GENRES = {
  actionAdventure: 10759,
  comedy: 35,
  crime: 80,
  drama: 18,
  scifiFantasy: 10765,
  animation: 16,
  mystery: 9648,
} as const;

// ─────────────────────────── Search ───────────────────────────

export interface PersonResult {
  id: number;
  name: string;
  profilePath: string | null;
  knownFor: Title[];
}

export interface SearchResults {
  titles: Title[];
  people: PersonResult[];
}

/** Films, series and people matching a query, most popular first. */
export async function searchMulti(query: string): Promise<SearchResults> {
  "use cache";
  cacheLife("hours");
  const data = await tmdb<{
    results: (RawResult & { media_type: string; name?: string; profile_path?: string | null; known_for?: RawResult[]; popularity?: number })[];
  }>("/search/multi", { query, include_adult: "false" });

  const titles: Title[] = [];
  const people: PersonResult[] = [];
  for (const r of data.results) {
    if (r.media_type === "movie" || r.media_type === "tv") {
      if (r.poster_path) titles.push(toTitle(r, r.media_type));
    } else if (r.media_type === "person") {
      people.push({
        id: r.id,
        name: r.name ?? "",
        profilePath: r.profile_path ?? null,
        knownFor: (r.known_for ?? [])
          .filter((k) => (k.media_type === "movie" || k.media_type === "tv") && k.poster_path)
          .map((k) => toTitle(k, k.media_type as MediaType)),
      });
    }
  }
  return { titles, people: people.slice(0, 6) };
}

/** TMDB movie genre ids used for home rows. */
export const GENRES = {
  action: 28,
  comedy: 35,
  horror: 27,
  scifi: 878,
  animation: 16,
  thriller: 53,
} as const;

// ─────────────────────────── Title detail ───────────────────────────

export interface Person {
  id: number;
  name: string;
  role: string; // character played
  profilePath: string | null;
}

export interface SeasonSummary {
  number: number;
  name: string;
  episodeCount: number;
}

export interface Episode {
  number: number;
  name: string;
  overview: string;
  runtime: number | null; // minutes
  stillPath: string | null;
}

export interface Detail extends Title {
  tagline: string;
  genres: string[];
  runtime: number | null; // film length, or typical episode length for series
  certification: string | null; // e.g. "PG-13", "TV-MA"
  seasons: SeasonSummary[];
  cast: Person[];
  makers: { label: string; names: string[] }; // Director(s) or Created by
  trailerKey: string | null; // YouTube video id
  recommendations: Title[];
}

interface RawVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
}
interface RawCast {
  id: number;
  name: string;
  character?: string;
  roles?: { character: string }[];
  profile_path: string | null;
}
interface RawDetail extends RawResult {
  tagline?: string;
  genres?: { name: string }[];
  runtime?: number | null;
  episode_run_time?: number[];
  seasons?: { season_number: number; name: string; episode_count: number }[];
  created_by?: { name: string }[];
  videos?: { results: RawVideo[] };
  credits?: { cast: RawCast[]; crew: { job: string; name: string }[] };
  aggregate_credits?: { cast: RawCast[] };
  recommendations?: { results: RawResult[] };
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string }[] }[] };
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
}

function pickTrailer(videos: RawVideo[] = []): string | null {
  const yt = videos.filter((v) => v.site === "YouTube");
  const best =
    yt.find((v) => v.type === "Trailer" && v.official) ??
    yt.find((v) => v.type === "Trailer") ??
    yt.find((v) => v.type === "Teaser");
  return best?.key ?? null;
}

/**
 * Everything the detail pop-up needs, in one TMDB request.
 * Returns null when the title doesn't exist. (Errors lose their class when they
 * cross a "use cache" boundary, so a 404 is turned into a value here instead.)
 */
export async function getDetail(type: MediaType, id: number): Promise<Detail | null> {
  "use cache";
  cacheLife("hours");

  const append =
    type === "movie"
      ? "videos,credits,recommendations,release_dates"
      : "videos,aggregate_credits,recommendations,content_ratings";
  let r: RawDetail;
  try {
    r = await tmdb<RawDetail>(`/${type}/${id}`, { append_to_response: append });
  } catch (err) {
    if (err instanceof TmdbError && err.status === 404) return null;
    throw err;
  }

  const rawCast = (type === "movie" ? r.credits?.cast : r.aggregate_credits?.cast) ?? [];
  const certification =
    type === "movie"
      ? r.release_dates?.results
          .find((x) => x.iso_3166_1 === "US")
          ?.release_dates.find((d) => d.certification)?.certification
      : r.content_ratings?.results.find((x) => x.iso_3166_1 === "US")?.rating;

  return {
    ...toTitle(r, type),
    tagline: r.tagline ?? "",
    genres: (r.genres ?? []).map((g) => g.name),
    runtime: type === "movie" ? (r.runtime ?? null) : (r.episode_run_time?.[0] ?? null),
    certification: certification || null,
    seasons: (r.seasons ?? [])
      .filter((s) => s.season_number > 0 && s.episode_count > 0)
      .map((s) => ({ number: s.season_number, name: s.name, episodeCount: s.episode_count })),
    cast: rawCast.slice(0, 12).map((c) => ({
      id: c.id,
      name: c.name,
      role: c.character ?? c.roles?.[0]?.character ?? "",
      profilePath: c.profile_path,
    })),
    makers:
      type === "movie"
        ? { label: "Directed by", names: (r.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name) }
        : { label: "Created by", names: (r.created_by ?? []).map((c) => c.name) },
    trailerKey: pickTrailer(r.videos?.results),
    recommendations: (r.recommendations?.results ?? [])
      .map((x) => toTitle(x, type))
      .filter((t) => t.posterPath)
      .slice(0, 12),
  };
}

/** Episodes of one season of a series. */
export async function getSeason(tvId: number, season: number): Promise<Episode[]> {
  "use cache";
  cacheLife("hours");
  const r = await tmdb<{
    episodes?: { episode_number: number; name: string; overview: string; runtime: number | null; still_path: string | null }[];
  }>(`/tv/${tvId}/season/${season}`);
  return (r.episodes ?? []).map((e) => ({
    number: e.episode_number,
    name: e.name,
    overview: e.overview,
    runtime: e.runtime,
    stillPath: e.still_path,
  }));
}

type PosterSize = "w185" | "w342" | "w500" | "w780";
type BackdropSize = "w780" | "w1280" | "original";

export const posterUrl = (path: string, size: PosterSize = "w342") => `${IMG}/${size}${path}`;
export const backdropUrl = (path: string, size: BackdropSize = "w1280") => `${IMG}/${size}${path}`;
