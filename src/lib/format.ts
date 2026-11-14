// Small display helpers, safe for both server and client.

/** 128 → "2H 08M", 52 → "52M" */
export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}H ${String(m).padStart(2, "0")}M` : `${m}M`;
}

export const tmdbImage = (path: string, size: string) => `https://image.tmdb.org/t/p/${size}${path}`;

export const titleHref = (mediaType: "movie" | "tv", id: number) => `/title/${mediaType}/${id}`;
