"use client";

import { useRef, useState } from "react";
import { formatClock } from "@/lib/progress";

interface Props {
  time: number;
  duration: number;
  buffered: number;
  onSeek: (seconds: number) => void;
}

/** Scrubbable progress bar: buffered range, played range in the film's colour, hover time. */
export function SeekBar({ time, duration, buffered, onSeek }: Props) {
  const bar = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null); // 0..1
  const [dragging, setDragging] = useState(false);

  const ratioAt = (clientX: number) => {
    const r = bar.current?.getBoundingClientRect();
    if (!r || r.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  const pct = (v: number) => `${duration ? Math.min(100, (v / duration) * 100) : 0}%`;

  return (
    <div
      ref={bar}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={`${formatClock(time)} of ${formatClock(duration)}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        onSeek(ratioAt(e.clientX) * duration);
      }}
      onPointerMove={(e) => {
        const r = ratioAt(e.clientX);
        setHover(r);
        if (dragging) onSeek(r * duration);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onPointerLeave={() => !dragging && setHover(null)}
      className="group/seek relative flex h-5 cursor-pointer touch-none items-center"
    >
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20 transition-[height] group-hover/seek:h-1.5">
        <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: pct(buffered) }} />
        <div className="absolute inset-y-0 left-0 bg-amb" style={{ width: pct(time) }} />
      </div>
      <span
        aria-hidden
        className="absolute size-3.5 -translate-x-1/2 scale-0 rounded-full bg-ink shadow transition-transform group-hover/seek:scale-100"
        style={{ left: pct(time) }}
      />
      {hover !== null && duration > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-6 -translate-x-1/2 rounded bg-black/85 px-2 py-1 font-mono text-xs text-ink ring-1 ring-white/10"
          style={{ left: `${hover * 100}%` }}
        >
          {formatClock(hover * duration)}
        </span>
      )}
    </div>
  );
}
