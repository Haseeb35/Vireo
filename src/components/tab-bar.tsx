"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { useAuth } from "./auth/auth-provider";
import { ProfileAvatar } from "./profiles/profile-avatar";
import { useProfiles } from "./profiles/profile-provider";

/** Bottom navigation on phones, like a native app. Hidden from the md breakpoint up. */
export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-screen/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
    >
      {/* The active tab depends on the URL, known only at request time on dynamic pages. */}
      <Suspense fallback={<Tabs pathname={null} />}>
        <ActiveTabs />
      </Suspense>
    </nav>
  );
}

function ActiveTabs() {
  return <Tabs pathname={usePathname()} />;
}

function Tabs({ pathname }: { pathname: string | null }) {
  const { user } = useAuth();
  const { active } = useProfiles();
  const is = (href: string) => pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <ul className="grid h-16 grid-cols-4">
      <Tab href="/" label="Home" active={is("/")}>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </Tab>
      <Tab href="/search" label="Search" active={is("/search")}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </Tab>
      <Tab href="/my-list" label="My List" active={is("/my-list")}>
        <path d="M6 3h12v18l-6-4-6 4z" />
      </Tab>
      <li>
        <Link
          href={user ? "/profiles?manage=1" : "/login"}
          aria-current={is("/profiles") || is("/login") ? "page" : undefined}
          className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${
            is("/profiles") || is("/login") ? "text-ink" : "text-steel"
          }`}
        >
          {active ? (
            <ProfileAvatar name={active.name} color={active.color} className="size-6 rounded text-xs" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-6" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          )}
          {active ? active.name.split(" ")[0] : user ? "Profile" : "Sign in"}
        </Link>
      </li>
    </ul>
  );
}

function Tab({ href, label, active, children }: { href: string; label: string; active: boolean; children: ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
          active ? "text-ink" : "text-steel"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          className="size-6"
          aria-hidden
        >
          {children}
        </svg>
        {label}
      </Link>
    </li>
  );
}
