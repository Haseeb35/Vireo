import Link from "next/link";

/** Wordmark. The dot takes the ambient colour of whatever film is in focus. */
export function Logo() {
  return (
    <Link
      href="/"
      aria-label="Vireo home"
      className="inline-flex items-center gap-1.5 text-xl font-extrabold tracking-wide text-ink"
    >
      VIREO
      <span aria-hidden className="transition-colors duration-700 ease-projector size-[7px] rounded-full bg-amb" />
    </Link>
  );
}
