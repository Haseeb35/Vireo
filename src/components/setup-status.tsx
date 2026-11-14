import { isFirebaseConfigured } from "@/lib/firebase";
import { isTmdbConfigured } from "@/lib/tmdb";

/**
 * Shown when the catalogue can't load. In development it's a checklist for
 * .env.local; in production visitors get a plain "unavailable" message instead
 * of a silent blank page (and no configuration details are revealed).
 */
export function SetupStatus({ tmdbError }: { tmdbError?: string }) {
  const items = [
    { label: "Firebase keys", ok: isFirebaseConfigured },
    { label: "TMDB token", ok: isTmdbConfigured() && !tmdbError },
  ];
  if (items.every((i) => i.ok)) return null;

  if (process.env.NODE_ENV === "production") {
    return (
      <section role="status" className="mx-5 mt-32 mb-10 grid max-w-xl gap-2 md:mx-10">
        <p className="font-mono text-xs tracking-wider text-steel">CATALOGUE UNAVAILABLE</p>
        <h1 className="text-3xl font-extrabold tracking-[-0.03em]">We can&apos;t load films right now</h1>
        <p className="text-steel">Please try again in a few minutes.</p>
      </section>
    );
  }

  return (
    <aside className="mx-5 mt-28 mb-10 max-w-xl rounded-lg border border-line bg-card p-5 md:mx-10">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Setup status (dev only)</h2>
      <ul className="grid gap-2 text-sm">
        {items.map(({ label, ok }) => (
          <li key={label} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
            {label}: {ok ? "connected" : "missing"}
          </li>
        ))}
      </ul>
      {tmdbError && <p className="mt-3 font-mono text-xs break-words text-amber-300/90">{tmdbError}</p>}
      <p className="mt-3 text-sm text-steel">
        Fill in <code className="font-mono text-ink">.env.local</code>, then restart{" "}
        <code className="font-mono text-ink">npm run dev</code>.
      </p>
    </aside>
  );
}
