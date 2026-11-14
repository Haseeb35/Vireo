import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center px-5 pt-32 pb-24 text-center">
      <div className="grid max-w-md justify-items-center gap-4">
        <p className="font-mono text-xs tracking-wider text-steel">ERROR 404</p>
        <h1 className="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Nothing playing here</h1>
        <p className="text-steel">This title or page doesn&apos;t exist, or it may have been removed from the catalogue.</p>
        <Link
          href="/"
          className="mt-2 inline-flex rounded-md bg-ink px-6 py-3 text-[15px] font-bold text-black transition hover:bg-ink/85"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
