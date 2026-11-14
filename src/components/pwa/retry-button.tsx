"use client";

export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="rounded-md bg-ink px-6 py-3 text-[15px] font-bold text-black transition hover:bg-ink/85"
    >
      Try again
    </button>
  );
}
