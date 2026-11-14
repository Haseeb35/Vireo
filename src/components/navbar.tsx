"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AccountMenu } from "./auth/account-menu";
import { Logo } from "./logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/tv", label: "TV Shows" },
  { href: "/my-list", label: "My List" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  // Transparent over the hero; turns solid once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      // pt: clears the notch / status bar when installed as an app on a phone.
      // The divider is a box-shadow, not a border: a border strip repeats the
      // background gradient and shows up as a dark line over the hero.
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-300 ${
        scrolled
          ? "bg-screen/95 backdrop-blur-sm shadow-[0_1px_0_var(--color-line)]"
          : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 items-center gap-10 px-5 md:px-10">
        <Logo />

        {/* The current URL is only known at request time on dynamic pages,
            so the active-link highlight streams in; the fallback is the same
            links without a highlight. */}
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>

        <div className="ml-auto flex items-center gap-5 md:ml-0">
          {/* On phones, Search lives in the bottom tab bar */}
          <Link href="/search" aria-label="Search" className="hidden text-ink/90 hover:text-ink md:block">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <AccountMenu />
        </div>
      </nav>
    </header>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="hidden flex-1 items-center gap-7 md:flex">
      {LINKS.map(({ href, label }) => {
        const active = pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`text-sm font-medium transition-colors ${active ? "text-ink" : "text-steel hover:text-ink"}`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
