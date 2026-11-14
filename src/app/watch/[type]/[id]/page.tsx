import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Player } from "@/components/player/player";
import { titleHref } from "@/lib/format";
import { getDetail, type MediaType } from "@/lib/tmdb";
import { videoFor } from "@/lib/videos";

export const metadata: Metadata = { title: "Watch" };

type Params = Promise<{ type: string; id: string }>;
type Search = Promise<{ s?: string; e?: string }>;

export default function WatchPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <main className="fixed inset-0 z-[70] bg-black">
      <Suspense fallback={<div className="size-full bg-black" />}>
        {Promise.all([params, searchParams]).then(([p, s]) => (
          <WatchLoader type={p.type} id={p.id} s={s.s} e={s.e} />
        ))}
      </Suspense>
    </main>
  );
}

async function WatchLoader({ type, id, s, e }: { type: string; id: string; s?: string; e?: string }) {
  if ((type !== "movie" && type !== "tv") || !/^\d+$/.test(id)) notFound();
  const mediaType: MediaType = type;
  const detail = await getDetail(mediaType, Number(id));
  if (!detail) notFound();

  const season = Number(s);
  const episode = Number(e);
  const requested =
    mediaType === "tv" && Number.isInteger(season) && Number.isInteger(episode) && season > 0 && episode > 0
      ? { season, episode }
      : null;

  return (
    <Player
      mediaType={mediaType}
      id={detail.id}
      title={detail.title}
      backdropPath={detail.backdropPath}
      seasons={detail.seasons}
      video={videoFor(detail.id)}
      requested={requested}
      detailHref={titleHref(mediaType, detail.id)}
    />
  );
}
