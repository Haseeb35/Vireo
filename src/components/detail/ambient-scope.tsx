"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { DEFAULT_AMB, extractColor } from "@/lib/color";

/**
 * Gives its children their own --amb colour, taken from one image.
 * Used to tint the detail pop-up in the film's colour without touching the
 * page-wide colour behind it.
 */
export function AmbientScope({
  src,
  className,
  children,
}: {
  src: string | null;
  className?: string;
  children: ReactNode;
}) {
  const [color, setColor] = useState(DEFAULT_AMB);

  useEffect(() => {
    if (!src) return;
    let live = true;
    extractColor(src).then((c) => live && setColor(c));
    return () => {
      live = false;
    };
  }, [src]);

  return (
    <div style={{ "--amb": color } as CSSProperties} className={className}>
      {children}
    </div>
  );
}
