"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker in production. In development any
 * previously registered worker is removed, so cached files never hide changes.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      return;
    }
    const register = () =>
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => console.error("[sw] registration failed:", err));
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
