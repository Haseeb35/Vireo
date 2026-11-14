"use client";

import { GENRE_CHOICES } from "@/lib/genres";

/** Toggleable genre pills. Used by onboarding and the profile editor. */
export function GenreChips({ value, onChange }: { value: number[]; onChange: (next: number[]) => void }) {
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Genres">
      {GENRE_CHOICES.map((g) => {
        const on = value.includes(g.id);
        return (
          <li key={g.id}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => toggle(g.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                on ? "bg-ink text-black ring-ink" : "bg-raised text-ink/85 ring-line hover:ring-steel"
              }`}
            >
              {on && <span aria-hidden className="mr-1.5">✓</span>}
              {g.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
