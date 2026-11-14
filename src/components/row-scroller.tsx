"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { endAmbientPreview } from "@/lib/ambient";

const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag

/**
 * Horizontal poster track.
 * - Mouse wheel always scrolls the page (like Netflix).
 * - Rows move with the edge arrows, click-and-drag, or a trackpad/touch swipe.
 * - Reaching the end of a row never scrolls the page sideways.
 */
export function RowScroller({ children, label }: { children: ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });

  const updateArrows = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateArrows]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  // ── Click-and-drag (mouse only; touch and trackpads scroll natively) ──
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !track.current) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startScroll: track.current.scrollLeft };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = track.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = d.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.moved) {
      track.current?.releasePointerCapture(e.pointerId);
      setDragging(false);
    }
  };

  // A drag shouldn't also count as a click on the poster under the pointer.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <div className="group/row relative" onMouseLeave={endAmbientPreview}>
      <div
        ref={track}
        role="list"
        aria-label={label}
        onScroll={updateArrows}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className={`no-scrollbar -my-3 flex gap-2.5 overflow-x-auto overflow-y-hidden overscroll-x-contain
                    scroll-px-5 px-5 py-5 md:scroll-px-10 md:px-10
                    ${dragging ? "cursor-grabbing select-none" : "snap-x snap-mandatory md:cursor-grab"}`}
      >
        {children}
      </div>

      {([-1, 1] as const).map((dir) => {
        const visible = dir === -1 ? canLeft : canRight;
        return (
          <button
            key={dir}
            type="button"
            tabIndex={visible ? 0 : -1}
            onClick={() => page(dir)}
            aria-label={dir === -1 ? `Scroll ${label} left` : `Scroll ${label} right`}
            className={`absolute inset-y-2 z-20 hidden w-12 items-center justify-center text-ink transition-opacity duration-200 md:flex
                        ${dir === -1 ? "left-0 bg-gradient-to-r" : "right-0 bg-gradient-to-l"} from-screen via-screen/70 to-transparent
                        ${visible ? "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-raised/90 ring-1 ring-white/15 transition hover:scale-110 hover:bg-ink hover:text-black">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-5">
                <path d={dir === -1 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}
