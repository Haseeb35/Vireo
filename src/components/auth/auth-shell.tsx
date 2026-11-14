import Image from "next/image";
import type { ReactNode } from "react";
import { tmdbImage } from "@/lib/format";
import { getTrending, isTmdbConfigured, type Title } from "@/lib/tmdb";

/** Wall of this week's trending posters behind the sign-in / sign-up card. */
async function PosterWall() {
  let titles: Title[] = [];
  if (isTmdbConfigured()) {
    try {
      titles = (await getTrending()).filter((t) => t.posterPath).slice(0, 18);
    } catch {
      // The wall is decoration; the form works without it.
    }
  }
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="grid -rotate-6 scale-125 grid-cols-4 gap-3 opacity-45 sm:grid-cols-6">
        {titles.concat(titles).map((t, i) => (
          <div key={i} className="relative aspect-[2/3] overflow-hidden rounded-md bg-raised">
            <Image src={tmdbImage(t.posterPath!, "w342")} alt="" fill sizes="200px" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(7,8,10,0.75),rgba(7,8,10,0.97))]" />
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  wide = false,
  children,
}: {
  title: string;
  subtitle: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="relative grid flex-1 place-items-center overflow-hidden px-5 pt-24 pb-16">
      <PosterWall />
      <section className={`relative z-10 w-full ${wide ? "max-w-[620px]" : "max-w-[420px]"} rounded-xl bg-card/95 p-6 ring-1 ring-line backdrop-blur-sm md:p-8`}>
        <h1 className="text-3xl font-extrabold tracking-[-0.03em]">{title}</h1>
        <p className="mt-1.5 text-sm text-steel">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
