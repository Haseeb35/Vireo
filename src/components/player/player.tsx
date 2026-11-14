"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadSeason } from "@/app/actions";
import { useAuth } from "@/components/auth/auth-provider";
import { AmbientScope } from "@/components/detail/ambient-scope";
import { useProfiles } from "@/components/profiles/profile-provider";
import { tmdbImage } from "@/lib/format";
import { formatClock, getProgress, isResumable, progressKey, saveProgress } from "@/lib/progress";
import type { SeasonSummary } from "@/lib/tmdb";
import type { SampleVideo } from "@/lib/videos";
import { SeekBar } from "./seek-bar";

interface Ep {
  season: number;
  episode: number;
}

export interface PlayerProps {
  mediaType: "movie" | "tv";
  id: number;
  title: string;
  backdropPath: string | null;
  seasons: SeasonSummary[];
  video: SampleVideo;
  requested: Ep | null; // ?s=&e= from the URL
  detailHref: string;
}

const HIDE_AFTER_MS = 3000;
const SAVE_EVERY_MS = 10000;
const NEXT_EPISODE_COUNTDOWN = 5;

/** Decides what to show: sign-in prompt for guests, otherwise the player. */
export function Player(props: PlayerProps) {
  const { user, loading } = useAuth();
  const { profiles, active } = useProfiles();
  const backdrop = props.backdropPath ? tmdbImage(props.backdropPath, "w780") : null;

  let body;
  if (loading || (user && (profiles === null || !active))) body = <Centered><Spinner /></Centered>;
  else if (!user) body = <SignInGate {...props} />;
  else body = <PlayerCore key={active!.id} {...props} uid={user.uid} profileId={active!.id} />;

  return (
    <AmbientScope src={backdrop} className="fixed inset-0 z-[70] bg-black text-ink">
      {body}
    </AmbientScope>
  );
}

function PlayerCore({
  mediaType,
  id,
  title,
  backdropPath,
  seasons,
  video,
  requested,
  detailHref,
  uid,
  profileId,
}: PlayerProps & { uid: string; profileId: string }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);

  // Where to start: decided once, after checking saved progress.
  const [start, setStart] = useState<{ ep: Ep | null; at: number } | null>(null);
  const [ep, setEp] = useState<Ep | null>(null);
  const [epName, setEpName] = useState<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [ended, setEnded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [controls, setControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── 1. Resume lookup ─────────────────────────────────────────────
  useEffect(() => {
    let live = true;
    const firstEp = seasons[0] ? { season: seasons[0].number, episode: 1 } : null;
    getProgress(uid, profileId, progressKey(mediaType, id))
      .catch(() => null)
      .then((p) => {
        if (!live) return;
        let target: Ep | null = null;
        if (mediaType === "tv") {
          target =
            requested ??
            (p && !p.finished && p.season && p.episode ? { season: p.season, episode: p.episode } : firstEp);
        }
        const sameEp = mediaType === "movie" || (p?.season === target?.season && p?.episode === target?.episode);
        setEp(target);
        setStart({ ep: target, at: isResumable(p) && sameEp ? p.position : 0 });
      });
    return () => {
      live = false;
    };
    // Runs once per mount: later episode changes are handled by goTo().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Episode title for the top bar.
  useEffect(() => {
    if (!ep) return;
    let live = true;
    loadSeason(id, ep.season)
      .then((eps) => live && setEpName(eps.find((e) => e.number === ep.episode)?.name ?? null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [id, ep]);

  // ── 2. Saving progress ──────────────────────────────────────────
  const save = useCallback(() => {
    const v = ref.current;
    if (!v || !v.duration || !Number.isFinite(v.duration)) return;
    saveProgress(uid, profileId, {
      mediaType,
      id,
      title,
      backdropPath,
      season: ep?.season ?? null,
      episode: ep?.episode ?? null,
      position: v.currentTime,
      duration: v.duration,
    }).catch((err) => console.error("[player] saving progress failed:", err));
  }, [uid, profileId, mediaType, id, title, backdropPath, ep]);

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => saveRef.current(), SAVE_EVERY_MS);
    return () => clearInterval(t);
  }, [playing]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && saveRef.current();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      saveRef.current(); // leaving the player
    };
  }, []);

  // ── 3. Playback controls ────────────────────────────────────────
  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seek = useCallback((t: number) => {
    const v = ref.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.min(v.duration, Math.max(0, t));
    setTime(v.currentTime);
  }, []);

  const skip = useCallback((d: number) => seek((ref.current?.currentTime ?? 0) + d), [seek]);

  const setVol = useCallback((value: number) => {
    const v = ref.current;
    if (!v) return;
    v.volume = Math.min(1, Math.max(0, value));
    v.muted = v.volume === 0;
  }, []);

  const toggleMute = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.6;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = root.current;
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
    else v?.webkitEnterFullscreen?.(); // iPhone Safari
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push(detailHref);
  }, [router, detailHref]);

  // ── 4. Next episode ─────────────────────────────────────────────
  const nextEp = useMemo<Ep | null>(() => {
    if (!ep) return null;
    const i = seasons.findIndex((s) => s.number === ep.season);
    if (i === -1) return null;
    if (ep.episode < seasons[i].episodeCount) return { season: ep.season, episode: ep.episode + 1 };
    return seasons[i + 1] ? { season: seasons[i + 1].number, episode: 1 } : null;
  }, [ep, seasons]);

  const goTo = useCallback(
    (target: Ep) => {
      setEp(target);
      setEpName(null);
      setStart({ ep: target, at: 0 });
      setEnded(false);
      setCountdown(null);
      setTime(0);
      // Update the address without a server round trip.
      window.history.replaceState(null, "", `/watch/tv/${id}?s=${target.season}&e=${target.episode}`);
      const v = ref.current;
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
    },
    [id],
  );

  // Tick once a second; on the last tick, start the next episode.
  useEffect(() => {
    if (countdown === null) return;
    const t = setTimeout(() => {
      if (countdown > 1) setCountdown(countdown - 1);
      else if (nextEp) goTo(nextEp);
    }, 1000);
    return () => clearTimeout(t);
  }, [countdown, nextEp, goTo]);

  // ── 5. Controls visibility + keyboard ───────────────────────────
  const poke = useCallback(() => {
    setControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), HIDE_AFTER_MS);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      const actions: Record<string, () => void> = {
        " ": toggle,
        k: toggle,
        arrowleft: () => skip(-10),
        arrowright: () => skip(10),
        j: () => skip(-10),
        l: () => skip(10),
        arrowup: () => setVol((ref.current?.volume ?? 1) + 0.1),
        arrowdown: () => setVol((ref.current?.volume ?? 1) - 0.1),
        m: toggleMute,
        f: toggleFullscreen,
      };
      const fn = actions[k];
      if (!fn) return;
      e.preventDefault();
      fn();
      poke();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, skip, setVol, toggleMute, toggleFullscreen, poke]);

  const showControls = controls || !playing || ended;
  const label = ep ? `S${ep.season}:E${ep.episode}${epName ? ` · ${epName}` : ""}` : null;
  const poster = backdropPath ? tmdbImage(backdropPath, "w1280") : undefined;

  return (
    <div
      ref={root}
      onPointerMove={poke}
      onPointerDown={poke}
      className={`relative size-full bg-black ${showControls ? "" : "cursor-none"}`}
    >
      {start && (
        <video
          ref={ref}
          src={video.src}
          poster={poster}
          autoPlay
          playsInline
          preload="auto"
          className="absolute inset-0 size-full object-contain"
          onClick={toggle}
          onDoubleClick={toggleFullscreen}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setDuration(v.duration);
            if (start.at > 0 && start.at < v.duration - 5) v.currentTime = start.at;
          }}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setTime(v.currentTime);
            if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
          }}
          onProgress={(e) => {
            const v = e.currentTarget;
            if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
          }}
          onPlay={() => {
            setPlaying(true);
            setEnded(false);
            poke();
          }}
          onPause={() => {
            setPlaying(false);
            saveRef.current();
          }}
          onWaiting={() => setWaiting(true)}
          onPlaying={() => setWaiting(false)}
          onCanPlay={() => setWaiting(false)}
          onVolumeChange={(e) => {
            setVolume(e.currentTarget.volume);
            setMuted(e.currentTarget.muted);
          }}
          onEnded={() => {
            setPlaying(false);
            setEnded(true);
            saveRef.current();
            if (mediaType === "tv" && nextEp) setCountdown(NEXT_EPISODE_COUNTDOWN);
          }}
        />
      )}

      {/* Film-coloured glow around the frame while paused. Only opacity animates. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_30px_var(--amb)] transition-opacity duration-700 ${
          playing ? "opacity-0" : "opacity-50"
        }`}
      />

      {(waiting || !start) && !ended && (
        <Centered>
          <Spinner />
        </Centered>
      )}

      {/* ── Top bar ── */}
      <div
        className={`absolute inset-x-0 top-0 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent px-4 pt-4 pb-12 transition-opacity duration-300 md:px-8 ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <IconButton label="Back" onClick={goBack}>
          <path d="m15 18-6-6 6-6" />
        </IconButton>
        <div className="min-w-0">
          <p className="truncate text-base font-bold md:text-lg">{title}</p>
          {label && <p className="truncate font-mono text-xs text-ink/70">{label}</p>}
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div
        className={`absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pt-16 pb-4 transition-opacity duration-300 md:px-8 md:pb-6 ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <SeekBar time={time} duration={duration} buffered={buffered} onSeek={seek} />

        <div className="flex items-center gap-1 md:gap-2">
          <IconButton label={playing ? "Pause (Space)" : "Play (Space)"} onClick={toggle} big>
            {playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" stroke="none" /> : <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />}
          </IconButton>
          <IconButton label="Back 10 seconds (←)" onClick={() => skip(-10)}>
            <path d="M11 5 4 12l7 7M20 5l-7 7 7 7" />
          </IconButton>
          <IconButton label="Forward 10 seconds (→)" onClick={() => skip(10)}>
            <path d="m13 5 7 7-7 7M4 5l7 7-7 7" />
          </IconButton>

          <div className="group/vol flex items-center">
            <IconButton label={muted ? "Unmute (M)" : "Mute (M)"} onClick={toggleMute}>
              <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
              {muted || volume === 0 ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />}
            </IconButton>
            <label className="sr-only" htmlFor="player-volume">
              Volume
            </label>
            <input
              id="player-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => setVol(Number(e.target.value))}
              className="hidden w-0 accent-(--amb) transition-[width] duration-300 group-hover/vol:w-24 focus:w-24 md:block"
            />
          </div>

          <span className="ml-2 font-mono text-xs text-ink/80 tabular-nums md:text-sm">
            {formatClock(time)} <span className="text-ink/40">/ {formatClock(duration)}</span>
          </span>

          <span className="ml-auto hidden truncate font-mono text-[11px] text-ink/40 lg:block">{video.credit}</span>

          {mediaType === "tv" && nextEp && (
            <button
              type="button"
              onClick={() => goTo(nextEp)}
              className="ml-auto inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-ink/90 transition hover:bg-white/10 lg:ml-2"
            >
              Next episode
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path d="M6 5v14l10-7zM17 5h2v14h-2z" />
              </svg>
            </button>
          )}

          <IconButton label={fullscreen ? "Exit full screen (F)" : "Full screen (F)"} onClick={toggleFullscreen} className={mediaType === "tv" && nextEp ? "" : "ml-auto lg:ml-0"}>
            {fullscreen ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
          </IconButton>
        </div>
      </div>

      {/* ── End of a film ── */}
      {ended && mediaType === "movie" && (
        <Centered>
          <div className="grid justify-items-center gap-4 text-center">
            <p className="font-mono text-xs tracking-wider text-ink/60">FINISHED</p>
            <p className="text-3xl font-extrabold tracking-tight">{title}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  seek(0);
                  toggle();
                }}
                className="rounded-md bg-ink px-5 py-3 font-bold text-black hover:bg-ink/85">
                Watch again
              </button>
              <Link href={detailHref} replace className="rounded-md bg-white/15 px-5 py-3 font-semibold hover:bg-white/25">
                Back to details
              </Link>
            </div>
          </div>
        </Centered>
      )}

      {/* ── Next episode countdown ── */}
      {countdown !== null && nextEp && (
        <div className="absolute right-4 bottom-28 w-72 animate-[rise_0.3s_var(--ease-projector)] rounded-lg bg-card/95 p-4 ring-1 ring-line md:right-8">
          <p className="font-mono text-xs text-steel">UP NEXT · S{nextEp.season}:E{nextEp.episode}</p>
          <p className="mt-1 text-lg font-bold">Next episode in {countdown}</p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full origin-left bg-amb"
              style={{ animation: `fill ${NEXT_EPISODE_COUNTDOWN}s linear forwards` }}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => goTo(nextEp)} className="flex-1 rounded-md bg-ink py-2 text-sm font-bold text-black hover:bg-ink/85">
              Play now
            </button>
            <button onClick={() => setCountdown(null)} className="flex-1 rounded-md bg-white/10 py-2 text-sm font-semibold hover:bg-white/20">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SignInGate({ title, backdropPath, mediaType, id, detailHref }: PlayerProps) {
  const here = `/watch/${mediaType}/${id}`;
  const next = `?next=${encodeURIComponent(here)}`;
  return (
    <div className="relative grid size-full place-items-center px-5">
      {backdropPath && (
        <Image src={tmdbImage(backdropPath, "w1280")} alt="" fill sizes="100vw" className="object-cover opacity-30" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
      <div className="relative grid max-w-md justify-items-center gap-4 text-center">
        <p className="font-mono text-xs tracking-wider text-ink/60">MEMBERS ONLY</p>
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] md:text-4xl">Sign in to watch {title}</h1>
        <p className="text-ink/70">Create a free account to play films and series and pick up where you left off.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href={`/signup${next}`} className="rounded-md bg-ink px-6 py-3 font-bold text-black hover:bg-ink/85">
            Create account
          </Link>
          <Link href={`/login${next}`} className="rounded-md bg-white/15 px-6 py-3 font-semibold hover:bg-white/25">
            Sign in
          </Link>
        </div>
        <Link href={detailHref} className="mt-2 text-sm text-ink/60 underline-offset-4 hover:text-ink hover:underline">
          Back to {title}
        </Link>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  big = false,
  className = "",
  children,
}: {
  label: string;
  onClick: () => void;
  big?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid shrink-0 place-items-center rounded-full text-ink transition hover:bg-white/10 ${big ? "size-12" : "size-10"} ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={big ? "size-7" : "size-5"}>
        {children}
      </svg>
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="pointer-events-none absolute inset-0 grid place-items-center [&>*]:pointer-events-auto">{children}</div>;
}

function Spinner() {
  return <span role="status" aria-label="Loading" className="size-12 animate-spin rounded-full border-[3px] border-white/20 border-t-amb" />;
}
