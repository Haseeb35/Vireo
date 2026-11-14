"use client";

import { useEffect, useState } from "react";
import { loadGenreRow } from "@/app/actions";
import { Row, RowSkeleton } from "@/components/row";
import { genreName } from "@/lib/genres";
import type { Title } from "@/lib/tmdb";
import { useProfiles } from "./profile-provider";

const ROWS_PER_PROFILE = 2;

/** "Because you like …" rows built from the active profile's genres. Nothing for guests. */
export function PersonalRows() {
  const { active } = useProfiles();
  const genres = (active?.genres ?? []).slice(0, ROWS_PER_PROFILE);
  const key = genres.join(",");
  const [rows, setRows] = useState<{ key: string; data: { genre: number; titles: Title[] }[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    let live = true;
    const ids = key.split(",").map(Number);
    Promise.all(ids.map(async (genre) => ({ genre, titles: await loadGenreRow(genre).catch(() => []) }))).then(
      (data) => live && setRows({ key, data }),
    );
    return () => {
      live = false;
    };
  }, [key]);

  if (!key) return null;
  if (rows?.key !== key) return genres.map((g) => <RowSkeleton key={g} />);

  return rows.data.map(({ genre, titles }) => (
    <Row key={genre} heading={`Because you like ${genreName(genre) ?? "this"}`} titles={titles} />
  ));
}
