"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { searchTitles } from "@/app/actions";
import { titleHref, tmdbImage } from "@/lib/format";
import type { PersonResult, SearchResults, Title } from "@/lib/tmdb";

type Filter = "all" | "movie" | "tv";
const DEBOUNCE_MS = 300;
const RECENT_KEY = "vireo:recent-searches";
const MAX_RECENT = 8;

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {}
}

export function SearchView({ popular }: { popular: Title[] }) {
  const initial = useSearchParams().get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<{ q: string; data: SearchResults } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [recent, setRecent] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  // Recent searches live in this browser only.
  useEffect(() => {
    const t = setTimeout(() => setRecent(readRecent()), 0);
    input.current?.focus();
    return () => clearTimeout(t);
  }, []);

  const query = q.trim();

  // Search as you type, after a short pause.
  useEffect(() => {
    const t = setTimeout(() => {
      // Keep the address shareable without a server round trip.
      window.history.replaceState(null, "", query ? `/search?q=${encodeURIComponent(query)}` : "/search");
      if (!query) return setResults(null);
      startTransition(async () => {
        const data = await searchTitles(query).catch(() => ({ titles: [], people: [] }));
        setResults({ q: query, data });
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  function remember(term: string) {
    const t = term.trim();
    if (t.length < 2) return;
    const next = [t, ...readRecent().filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
    writeRecent(next);
    setRecent(next);
  }

  const data = results?.q === query ? results.data : null;
  const titles = (data?.titles ?? []).filter((t) => filter === "all" || t.mediaType === filter);
  const counts = {
    all: data?.titles.length ?? 0,
    movie: data?.titles.filter((t) => t.mediaType === "movie").length ?? 0,
    tv: data?.titles.filter((t) => t.mediaType === "tv").length ?? 0,
  };

  return (
    <div className="grid gap-8">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          remember(q);
          input.current?.blur();
        }}
        className="relative"
      >
        <label htmlFor="search-input" className="sr-only">
          Search films, series and people
        </label>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-steel">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={input}
          id="search-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Films, series, actors…"
          autoComplete="off"
          enterKeyHint="search"
          className="h-14 w-full rounded-lg border border-line bg-card pr-12 pl-12 text-lg text-ink placeholder:text-dim focus:border-steel focus:outline-none"
        />
        {pending && (
          <span aria-label="Searching" className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-ink" />
        )}
      </form>

      {!query ? (
        <>
          {recent.length > 0 && (
            <section aria-labelledby="recent-heading" className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 id="recent-heading" className="font-mono text-xs tracking-wider text-steel">
                  RECENT SEARCHES
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    writeRecent([]);
                    setRecent([]);
                  }}
                  className="text-xs text-steel hover:text-ink"
                >
                  Clear
                </button>
              </div>
              <ul className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => setQ(r)}
                      className="rounded-full bg-raised px-4 py-2 text-sm text-ink/85 ring-1 ring-line transition hover:ring-steel"
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="popular-heading" className="grid gap-4">
            <h2 id="popular-heading" className="text-lg font-bold tracking-tight">
              Popular right now
            </h2>
            <PosterGrid titles={popular} />
          </section>
        </>
      ) : data && data.titles.length === 0 && data.people.length === 0 ? (
        <div className="grid justify-items-center gap-2 py-16 text-center">
          <p className="text-xl font-bold">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-steel">Check the spelling, or try a shorter title or an actor&rsquo;s name.</p>
        </div>
      ) : data ? (
        <>
          <div role="group" aria-label="Filter results" className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["movie", "Films"],
                ["tv", "Series"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                  filter === value ? "bg-ink text-black ring-ink" : "bg-raised text-ink/85 ring-line hover:ring-steel"
                }`}
              >
                {label} <span className="ml-1 font-mono text-xs opacity-60">{counts[value]}</span>
              </button>
            ))}
          </div>

          {filter === "all" && data.people.length > 0 && <People people={data.people} onPick={() => remember(query)} />}

          {titles.length > 0 ? (
            <div onClickCapture={() => remember(query)}>
              <PosterGrid titles={titles} />
            </div>
          ) : (
            <p className="text-steel">No {filter === "movie" ? "films" : "series"} match &ldquo;{query}&rdquo;.</p>
          )}
        </>
      ) : (
        <PosterGrid titles={[]} loading />
      )}
    </div>
  );
}

function PosterGrid({ titles, loading = false }: { titles: Title[]; loading?: boolean }) {
  if (loading) {
    return (
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7" aria-busy>
        {Array.from({ length: 14 }, (_, i) => (
          <li key={i} className="aspect-[2/3] animate-pulse rounded-md bg-raised" />
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
      {titles.map((t) => (
        <li key={`${t.mediaType}-${t.id}`}>
          <Link href={titleHref(t.mediaType, t.id)} scroll={false} className="group block">
            <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-raised transition-transform duration-300 ease-projector group-hover:scale-[1.03]">
              {t.posterPath && <Image src={tmdbImage(t.posterPath, "w342")} alt="" fill sizes="180px" className="object-cover" />}
              <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-white/5 ring-inset" />
            </div>
            <p className="mt-2 truncate text-sm font-medium group-hover:text-ink">{t.title}</p>
            <p className="font-mono text-[11px] text-steel">
              {[t.year, t.mediaType === "tv" ? "SERIES" : "FILM"].filter(Boolean).join(" · ")}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function People({ people, onPick }: { people: PersonResult[]; onPick: () => void }) {
  return (
    <section aria-labelledby="people-heading" className="grid gap-3">
      <h2 id="people-heading" className="font-mono text-xs tracking-wider text-steel">
        PEOPLE
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg bg-card p-3 ring-1 ring-line">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-raised">
              {p.profilePath && <Image src={tmdbImage(p.profilePath, "w185")} alt="" fill sizes="56px" className="object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{p.name}</p>
              {p.knownFor.length > 0 && (
                <p className="truncate text-sm text-steel">
                  Known for{" "}
                  {p.knownFor.slice(0, 3).map((k, i) => (
                    <span key={`${k.mediaType}-${k.id}`}>
                      {i > 0 && ", "}
                      <Link href={titleHref(k.mediaType, k.id)} scroll={false} onClick={onPick} className="text-ink/85 hover:text-ink hover:underline">
                        {k.title}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
