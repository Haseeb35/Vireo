import type { CSSProperties } from "react";
import { AVATAR_COLORS } from "@/lib/profiles";

/** Solid colour tile with the profile's initial. */
export function ProfileAvatar({
  name,
  color,
  className = "size-8 text-sm rounded-md",
}: {
  name: string;
  color: number;
  className?: string;
}) {
  const bg = AVATAR_COLORS[color % AVATAR_COLORS.length];
  return (
    <span
      aria-hidden
      style={{ "--tile": bg } as CSSProperties}
      className={`relative grid shrink-0 place-items-center overflow-hidden bg-(--tile) font-extrabold text-black/85 ${className}`}
    >
      {/* soft top highlight so the tile reads as an object, not a flat swatch */}
      <span className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent to-60%" />
      <span className="relative">{name.trim().charAt(0).toUpperCase() || "?"}</span>
    </span>
  );
}
