"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

/**
 * Pop-up shell for the intercepted /title route.
 * Closes with Esc, the close button, a click outside the card, or browser Back.
 */
export function Modal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);

    // Freeze the page behind the pop-up.
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";

    panel.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prev;
    };
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-[60] animate-[fade_0.25s_ease-out] overflow-y-auto overscroll-contain bg-black/75"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Title details"
        tabIndex={-1}
        className="relative mx-auto w-full max-w-[920px] animate-[rise_0.45s_var(--ease-projector)] outline-none md:my-10"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 z-30 grid size-10 place-items-center rounded-full bg-black/70 text-ink ring-1 ring-white/15 transition hover:bg-ink hover:text-black"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-5">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
