"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { useProfiles } from "@/components/profiles/profile-provider";
import { signOut } from "@/lib/auth";
import { useAuth } from "./auth-provider";

/** Navbar right side: "Sign in" for guests; active profile + menu for members. */
export function AccountMenu() {
  const { user, loading } = useAuth();
  const { profiles, active, setActive } = useProfiles();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Close on outside click or Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) return <span aria-hidden className="size-8 animate-pulse rounded-md bg-raised" />;

  if (!user) {
    return (
      <Link href="/login" className="rounded-md bg-ink px-3.5 py-1.5 text-sm font-bold text-black transition hover:bg-ink/85">
        Sign in
      </Link>
    );
  }

  const fallbackName = user.displayName || user.email?.split("@")[0] || "You";
  const others = (profiles ?? []).filter((p) => p.id !== active?.id);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu${active ? `, watching as ${active.name}` : ""}`}
        className="block rounded-md ring-1 ring-white/10"
      >
        {active ? (
          <ProfileAvatar name={active.name} color={active.color} />
        ) : (
          <span className="block size-8 animate-pulse rounded-md bg-raised" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-11 right-0 w-64 animate-[rise_0.2s_var(--ease-projector)] overflow-hidden rounded-lg bg-card ring-1 ring-line"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            {active && <ProfileAvatar name={active.name} color={active.color} />}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{active?.name ?? fallbackName}</p>
              {user.email && <p className="truncate text-xs text-steel">{user.email}</p>}
            </div>
          </div>

          {others.length > 0 && (
            <div className="border-b border-line py-1">
              <p className="px-4 pt-2 pb-1 font-mono text-[11px] tracking-wider text-dim">SWITCH PROFILE</p>
              {others.map((p) => (
                <button
                  key={p.id}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setActive(p.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-ink/90 transition hover:bg-raised"
                >
                  <ProfileAvatar name={p.name} color={p.color} className="size-6 rounded text-xs" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="py-1">
            <Link
              role="menuitem"
              href="/profiles?manage=1"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink/90 transition hover:bg-raised"
            >
              Manage profiles
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.replace("/");
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-ink/90 transition hover:bg-raised"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
