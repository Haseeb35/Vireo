import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatRuntime, tmdbImage, titleHref } from "@/lib/format";
import { getDetail, getSeason, type Episode, type MediaType } from "@/lib/tmdb";
import { AmbientScope } from "./ambient-scope";
import { DetailHeader } from "./detail-header";
import { Episodes } from "./episodes";

/** Loads and renders a title. Shared by the pop-up and the full page. */
export async function TitleDetail({ type, id }: { type: string; id: string }) {
  if ((type !== "movie" && type !== "tv") || !/^\d+$/.test(id)) notFound();
  const mediaType: MediaType = type;

  const detail = await getDetail(mediaType, Number(id));
  if (!detail) notFound();

  const firstSeason = detail.seasons[0]?.number;
  const episodes: Episode[] =
    mediaType === "tv" && firstSeason !== undefined ? await getSeason(detail.id, firstSeason) : [];

  const meta = [
    detail.year,
    mediaType === "tv"
      ? `${detail.seasons.length} season${detail.seasons.length === 1 ? "" : "s"}`
      : formatRuntime(detail.runtime),
    detail.certification,
    detail.rating > 0 ? `★ ${detail.rating.toFixed(1)}` : null,
  ].filter((m): m is string => Boolean(m));

  return (
    <AmbientScope
      src={detail.backdropPath ? tmdbImage(detail.backdropPath, "w780") : null}
      className="overflow-hidden bg-card md:rounded-xl md:ring-1 md:ring-[color-mix(in_srgb,var(--amb)_30%,transparent)]
                 md:shadow-[0_40px_160px_-40px_color-mix(in_srgb,var(--amb)_70%,transparent)]"
    >
      <DetailHeader
        mediaType={mediaType}
        id={detail.id}
        title={detail.title}
        kind={mediaType === "tv" ? "Series" : "Film"}
        backdropPath={detail.backdropPath}
        posterPath={detail.posterPath}
        year={detail.year}
        trailerKey={detail.trailerKey}
        meta={meta}
        tagline={detail.tagline}
      />

      <div className="grid gap-10 px-5 pt-8 pb-12 md:px-10">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] md:gap-10">
          <p className="max-w-[62ch] text-[15px] leading-relaxed text-ink/90">{detail.overview || "No description yet."}</p>
          <dl className="grid content-start gap-3 text-sm">
            {detail.cast.length > 0 && (
              <Fact label="Starring" value={detail.cast.slice(0, 3).map((c) => c.name).join(", ")} />
            )}
            {detail.makers.names.length > 0 && <Fact label={detail.makers.label} value={detail.makers.names.join(", ")} />}
            {detail.genres.length > 0 && <Fact label="Genres" value={detail.genres.join(", ")} />}
          </dl>
        </div>

        {mediaType === "tv" && firstSeason !== undefined && (
          <Episodes tvId={detail.id} seasons={detail.seasons} initialSeason={firstSeason} initialEpisodes={episodes} />
        )}

        {detail.cast.length > 0 && (
          <section aria-labelledby="cast-heading">
            <h2 id="cast-heading" className="mb-4 text-lg font-bold tracking-tight">
              Cast
            </h2>
            <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6">
              {detail.cast.map((p) => (
                <li key={p.id} className="min-w-0">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-raised">
                    {p.profilePath ? (
                      <Image src={tmdbImage(p.profilePath, "w185")} alt="" fill sizes="140px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center font-mono text-lg text-dim">
                        {p.name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold">{p.name}</p>
                  {p.role && <p className="truncate text-xs text-steel">{p.role}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {detail.recommendations.length > 0 && (
          <section aria-labelledby="more-heading">
            <h2 id="more-heading" className="mb-4 text-lg font-bold tracking-tight">
              More like this
            </h2>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {detail.recommendations.map((t) => (
                <li key={`${t.mediaType}-${t.id}`}>
                  {/* replace: hopping between titles doesn't stack up history,
                      so Close/Back always returns to where the pop-up was opened */}
                  <Link
                    href={titleHref(t.mediaType, t.id)}
                    replace
                    scroll={false}
                    className="group block"
                    aria-label={`${t.title}${t.year ? ` (${t.year})` : ""}`}
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-raised transition-transform duration-300 ease-projector group-hover:scale-[1.04]">
                      <Image src={tmdbImage(t.posterPath!, "w342")} alt="" fill sizes="150px" className="object-cover" />
                      <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-white/5 ring-inset" />
                    </div>
                    <p className="mt-2 truncate text-xs text-steel group-hover:text-ink">{t.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AmbientScope>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-steel">{label}</dt>
      <dd className="text-ink/90">{value}</dd>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-busy className="overflow-hidden bg-card md:rounded-xl">
      <div className="aspect-video w-full animate-pulse bg-raised md:aspect-[16/8]" />
      <div className="grid gap-4 px-5 py-8 md:px-10">
        <div className="h-4 w-24 animate-pulse rounded bg-raised" />
        <div className="h-12 w-2/3 animate-pulse rounded bg-raised" />
        <div className="h-4 w-48 animate-pulse rounded bg-raised" />
        <div className="h-20 w-full animate-pulse rounded bg-raised" />
      </div>
    </div>
  );
}
