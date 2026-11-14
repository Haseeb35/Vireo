"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { titleHref, tmdbImage } from "@/lib/format";
import { useMyList } from "./my-list-provider";

type Sort = "added" | "az";

export function MyListView() {
  const { user, loading } = useAuth();
  const { items, remove } = useMyList();
  const [sort, setSort] = useState<Sort>("added");

  if (!loading && !user) {
    return (
      <Empty
        title="Sign in to keep a list"
        body="Save films and series to watch later. Your list is kept separately for each profile."
        cta={{ href: "/login?next=%2Fmy-list", label: "Sign in" }}
      />
    );
  }

  if (items === null) {
    return (
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7" aria-busy>
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i} className="aspect-[2/3] animate-pulse rounded-md bg-raised" />
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        title="Your list is empty"
        body="Press + My List on any film or series and it will appear here."
        cta={{ href: "/", label: "Browse titles" }}
      />
    );
  }

  const sorted = sort === "az" ? [...items].sort((a, b) => a.title.localeCompare(b.title)) : items;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-steel">
          {items.length} {items.length === 1 ? "TITLE" : "TITLES"}
        </p>
        <div role="group" aria-label="Sort" className="flex rounded-md bg-raised p-1 ring-1 ring-line">
          {(
            [
              ["added", "Recently added"],
              ["az", "A–Z"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={sort === value}
              onClick={() => setSort(value)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${sort === value ? "bg-ink text-black" : "text-steel hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
        {sorted.map((item) => (
          <li key={`${item.mediaType}-${item.id}`} className="group relative">
            <Link href={titleHref(item.mediaType, item.id)} scroll={false} className="block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-raised transition-transform duration-300 ease-projector group-hover:scale-[1.03]">
                {item.posterPath && (
                  <Image src={tmdbImage(item.posterPath, "w342")} alt="" fill sizes="180px" className="object-cover" />
                )}
                <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-white/5 ring-inset" />
              </div>
              <p className="mt-2 truncate text-sm font-medium">{item.title}</p>
              <p className="font-mono text-[11px] text-steel">
                {[item.year, item.mediaType === "tv" ? "SERIES" : "FILM"].filter(Boolean).join(" · ")}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => remove(item.mediaType, item.id).catch(() => {})}
              aria-label={`Remove ${item.title} from My List`}
              className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/75 text-ink ring-1 ring-white/20 transition
                         hover:bg-ink hover:text-black md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-4">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ title, body, cta }: { title: string; body: string; cta: { href: string; label: string } }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-line px-6 py-16 text-center">
      <p className="text-xl font-bold">{title}</p>
      <p className="max-w-sm text-steel">{body}</p>
      <Link href={cta.href} className="mt-2 rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-black hover:bg-ink/85">
        {cta.label}
      </Link>
    </div>
  );
}
