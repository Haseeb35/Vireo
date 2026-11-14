"use client";

import { Row } from "@/components/row";
import type { Title } from "@/lib/tmdb";
import { useMyList } from "./my-list-provider";

/** Home row of the active profile's saved titles. Hidden when empty. */
export function MyListRow() {
  const { items } = useMyList();
  if (!items || items.length === 0) return null;

  const titles: Title[] = items.map((i) => ({
    id: i.id,
    mediaType: i.mediaType,
    title: i.title,
    year: i.year,
    posterPath: i.posterPath,
    backdropPath: i.backdropPath,
    overview: "",
    rating: 0,
  }));
  return <Row heading="My List" titles={titles} />;
}
