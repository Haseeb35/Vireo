"use client";

import { useEffect, useState } from "react";

// Chrome/Edge/Android fire this event when the app can be installed.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "vireo:install-dismissed";
const DISMISS_DAYS = 30;
const SHOW_AFTER_MS = 20_000; // don't interrupt the first moments of a visit

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone/iPad Safari has no install event, so it gets "Share → Add to Home Screen" instructions. */
function isIosSafari() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

/** Small card offering to install Vireo. Appears once per 30 days at most. */
export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const showSoon = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    };
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the browser's own mini-bar from appearing
      setEvent(e as BeforeInstallPromptEvent);
      showSoon();
    };
    const onInstalled = () => {
      setVisible(false);
      setEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (isIosSafari()) {
      timer = setTimeout(() => {
        setIos(true);
        setVisible(true);
      }, SHOW_AFTER_MS);
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || (!event && !ios)) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  const install = async () => {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "dismissed") dismiss();
    else setVisible(false);
    setEvent(null);
  };

  return (
    <aside
      aria-label="Install Vireo"
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 z-[45] mx-auto max-w-sm animate-[rise_0.4s_var(--ease-projector)]
                 rounded-xl bg-card/95 p-4 ring-1 ring-line backdrop-blur-sm md:right-6 md:bottom-6 md:left-auto"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-[10px]" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Install Vireo</p>
          <p className="mt-0.5 text-sm text-steel">
            {ios ? (
              <>
                Tap{" "}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="inline size-4 -translate-y-0.5" aria-label="Share">
                  <path d="M12 3v12M7 8l5-5 5 5M5 13v6h14v-6" />
                </svg>{" "}
                Share, then <strong className="font-semibold text-ink">Add to Home Screen</strong>.
              </>
            ) : (
              "Open it from your home screen or dock, full screen, like any other app."
            )}
          </p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Not now" className="-mt-1 -mr-1 grid size-8 place-items-center rounded-full text-steel hover:bg-raised hover:text-ink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-4">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      {!ios && (
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={dismiss} className="rounded-md px-3 py-2 text-sm font-semibold text-steel hover:text-ink">
            Not now
          </button>
          <button type="button" onClick={install} className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-black hover:bg-ink/85">
            Install
          </button>
        </div>
      )}
    </aside>
  );
}
